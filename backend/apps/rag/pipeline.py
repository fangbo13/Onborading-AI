"""RAG Pipeline - Main orchestrator.

V4.2 SYS-V4.2-014: Added DashScope circuit breaker protection.
When DashScope API fails 3 times consecutively, the circuit opens
and returns a degraded response for 30 seconds (half-open recovery).
This prevents external API failures from blocking the entire server.
"""

import logging
import time

from django.conf import settings

from .chunker import LangChainChunker
from .embedding import EmbeddingService
from .retriever import PgVectorRetriever
from .prompt_builder import PromptBuilder
from .guardrails import GuardrailsService, LiteLLMChatService
from .config import CHUNK_SIZE, CHUNK_OVERLAP, TOP_K, SIMILARITY_THRESHOLD
from apps.core.circuit_breaker import dashscope_breaker  # V4.2 SYS-V4.2-014

logger = logging.getLogger(__name__)


class RAGPipeline:
    """Orchestrates the full RAG lifecycle: ingest, retrieve, generate."""

    def __init__(self):
        self.parser = DocumentParser()
        self.chunker = LangChainChunker(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )
        self.embedder = EmbeddingService()
        self.retriever = PgVectorRetriever()
        self.prompt_builder = PromptBuilder()
        self.guardrails = GuardrailsService()
        self.llm = LiteLLMChatService()
        self.model_name = settings.RAG_LLM_MODEL

    def ingest(self, document) -> list:
        """Parse, chunk, embed, and store a document.

        Args:
            document: Django Document model instance.

        Returns:
            List of created DocumentChunk instances.
        """
        from apps.knowledge.models import DocumentChunk

        # Parse document
        raw_text, page_metadata = self.parser.parse(document.file.path, document.file_type)

        # Chunk
        chunks = self.chunker.split(raw_text, page_metadata)

        # Embed in batches
        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.embed_batch(texts)

        # Store
        document_chunks = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            doc_chunk = DocumentChunk.objects.create(
                document=document,
                content=chunk["text"],
                chunk_index=i,
                page_number=chunk.get("metadata", {}).get("page"),
                metadata=chunk.get("metadata", {}),
                embedding=embedding,
            )
            document_chunks.append(doc_chunk)

        logger.info(f"Ingested {len(document_chunks)} chunks from {document.title}")
        return document_chunks

    def retrieve_and_generate(
        self,
        query: str,
        user_profile,
        conversation_history: list,
        language: str = "en",
    ):
        """Full RAG: retrieve context, build prompt, call LLM, stream response.

        Yields:
            Dicts with 'event' and 'data' keys for SSE streaming.
        """
        # Step 1: Guardrails - check for injection
        if not self.guardrails.check_input(query):
            yield {"event": "token", "data": {"token": self.guardrails.generate_fallback(language)}}
            yield {"event": "done", "data": {}}
            return

        # Step 2: Retrieve relevant chunks
        chunks = self.retriever.search(
            query=query,
            top_k=TOP_K,
            similarity_threshold=SIMILARITY_THRESHOLD,
        )

        # V4.2 SYS-V4.2-014: Circuit breaker check — fail fast if DashScope is down
        if not dashscope_breaker.allow_request():
            degraded_msg = (
                "服务暂时不可用，请稍后重试。" if language == "zh"
                else "Service temporarily unavailable, please try again later."
            )
            logger.warning("DashScope circuit breaker OPEN — returning degraded response")
            yield {"event": "token", "data": {"token": degraded_msg}}
            yield {"event": "done", "data": {}}
            return
        # Prevents Prompt Injection via malicious content stored in knowledge chunks.
        # Each chunk's content is checked against guardrails; injection-pattern lines
        # are stripped to prevent the LLM from following embedded instructions.
        sanitized_chunks = []
        for chunk in chunks:
            content = chunk["content"]
            if not self.guardrails.check_input(content):
                content = self._sanitize_content(content)
            sanitized_chunks.append({**chunk, "content": content})
        chunks = sanitized_chunks

        # Step 2b: If no good results, return fallback
        if not chunks:
            fallback = (
                "我没有足够的信息来回答此问题，请联系您的人力资源伙伴或HR团队。"
                if language == "zh"
                else "I don't have enough information to answer this question. Please contact your HR buddy or HR team."
            )
            yield {"event": "token", "data": {"token": fallback}}
            yield {"event": "citations", "data": []}
            yield {"event": "done", "data": {}}
            return

        # Step 3: Build citations data
        citations = self._build_citations(chunks)
        yield {"event": "citations", "data": citations}

        # Step 4: Build system prompt
        system_prompt = self.prompt_builder.build(
            context_chunks=chunks,
            conversation_history=conversation_history[-8:],  # Last 8 turns
            user_profile=user_profile,
            language=language,
        )

        # Step 5: Stream LLM response — V4.2 SYS-V4.2-014: circuit breaker wraps the call
        # On success: record_success() closes the circuit.
        # On failure: record_failure() counts toward opening the circuit.
        llm_success = False
        try:
            for token in self.llm.stream_chat(system_prompt, query):
                llm_success = True  # At least one token received = API is working
                yield {"event": "token", "data": {"token": token}}
            # Full success — record it to close/reset the circuit breaker
            if llm_success:
                dashscope_breaker.record_success()
        except Exception as e:
            # V4.2 SYS-V4.2-014: Record failure to count toward circuit opening
            dashscope_breaker.record_failure()
            logger.error("DashScope stream error: %s", e, exc_info=True)
            degraded_msg = (
                "服务暂时不可用，请稍后重试。" if language == "zh"
                else "Service temporarily unavailable, please try again later."
            )
            yield {"event": "token", "data": {"token": degraded_msg}}

        yield {"event": "done", "data": {}}

    def _build_citations(self, chunks):
        """Build citation data from retrieved chunks."""
        return [
            {
                "document_id": chunk["document_id"],
                "document_title": chunk["document_title"],
                "page_number": chunk.get("page_number"),
                "score": round(chunk["score"], 3),
                "quoted_text": chunk["content"][:200],
                "chunk_id": chunk["id"],
            }
            for chunk in chunks
        ]

    def _sanitize_content(self, content: str) -> str:
        """Remove injection-pattern lines from retrieved content — V4.1 KB-V4.1-005.

        Checks each line individually against guardrails. Lines that trigger
        injection detection (system commands, role overrides, etc.) are stripped.
        If all lines are flagged, returns a truncated safe excerpt.
        """
        lines = content.split("\n")
        clean_lines = [line for line in lines if self.guardrails.check_input(line)]
        if clean_lines:
            return "\n".join(clean_lines)
        # Fallback: if every line was flagged, return truncated content
        return content[:200] + "..."


class DocumentParser:
    """Parse documents using Docling with Unstructured fallback."""

    def parse(self, file_path: str, file_type: str) -> tuple[str, list[dict]]:
        """Parse a document file.

        Args:
            file_path: Path to the document file.
            file_type: File type ('pdf', 'docx', 'html', 'txt').

        Returns:
            Tuple of (full_text, list_of_page_metadata).
        """
        try:
            return self._parse_with_docling(file_path)
        except Exception as e:
            logger.warning(f"Docling failed: {e}, falling back to Unstructured")
            try:
                return self._parse_with_unstructured(file_path)
            except Exception as e2:
                logger.error(f"Both parsers failed: {e2}")
                return self._parse_as_text(file_path)

    def _parse_with_docling(self, file_path: str) -> tuple[str, list[dict]]:
        """Parse using Docling (best for PDF/DOCX)."""
        from docling.document_converter import DocumentConverter

        converter = DocumentConverter()
        result = converter.convert(file_path)

        # Get markdown text
        text = result.document.export_to_markdown()

        # Extract page metadata if available
        metadata = [{"page": None}]
        try:
            pages = getattr(result.document, "pages", None) or getattr(result, "pages", None)
            if pages:
                metadata = [{"page": i + 1} for i in range(len(pages))]
        except Exception:
            pass

        if not metadata:
            metadata = [{"page": None}]

        return text, metadata

    def _parse_with_unstructured(self, file_path: str) -> tuple[str, list[dict]]:
        """Fallback parsing using Unstructured."""
        from unstructured.partition.auto import partition

        elements = partition(filename=file_path)
        text = "\n".join([str(el) for el in elements])

        metadata = [{"page": getattr(el, "metadata", {}).get("page_number")} for el in elements]
        if not metadata:
            metadata = [{"page": None}]

        return text, metadata

    def _parse_as_text(self, file_path: str) -> tuple[str, list[dict]]:
        """Read as plain text file."""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return text, [{"page": None}]
