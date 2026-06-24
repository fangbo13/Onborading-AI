# UX 优化实施计划（v3 审计报告 — 覆盖重写）

> 本计划基于 `ux_audit_output/UX_Audit_Report_v3.pptx`（15 页、18 个问题、评分 5.5/10）覆盖重写。
> 旧版计划（v1/v2 的 12 个问题）已完成，v3 新增 6 个问题并深化了已有问题描述。

---

## 问题清单（从 v3 审计报告提取）

| # | 问题简述 | 严重程度 | 建议方案 | 优先级 | 状态 |
|---|----------|----------|----------|--------|------|
| P0-1 | 个人设置入口重复（侧边栏导航 + 顶部用户头像下拉） | 🔴 高 | 移除侧边栏 Profile 菜单项，仅保留顶部用户下拉中的设置入口 | 立即 | ✅ 已完成 |
| P0-2 | 侧边栏仅为导航菜单，缺少对话列表（DeepSeek 设计目标） | 🔴 高 | 侧边栏新增对话列表区域，按时间分组，DeepSeek 风格固定双栏布局 | 立即 | ✅ 已完成 |
| P0-3 | 缺少全局 ErrorBoundary，单点故障导致全页白屏 | 🔴 高 | App 根层添加 ErrorBoundary，Markdown 渲染加独立边界 | 立即 | ✅ 已完成 |
| P0-4 | 无断网检测与离线提示 | 🔴 高 | navigator.onLine 检测 + 断网横幅 + 发送前网络检查 | 立即 | ✅ 已完成 |
| #5 | 对话标题截断无 tooltip 完整展示 | 🟡 中 | CSS text-overflow + Antd Tooltip，hover 显示完整标题 | 短期 | ✅ 已完成 |
| #6 | 移动端消息操作按钮（长按）无视觉反馈 | 🟡 中 | 长按时高亮边框 + 缩放动画 + 触觉反馈 | 短期 | ✅ 已完成 |
| #7 | 知识管理页面硬编码英文字符串（未用 i18n） | 🟡 中 | admin.json 添加翻译 key，替换硬编码为 t() | 短期 | ✅ 已完成 |
| #8 | 消息加载仅 Spinner，无骨架屏（Skeleton） | 🟡 中 | 3-5 条模拟消息气泡 Skeleton，shimmer 动画 | 短期 | ✅ 已完成 |
| #9 | 切换对话无 loading 过渡动画 | 🟡 中 | 200ms 淡入淡出过渡或 skeleton 过渡态 | 短期 | ✅ 已完成 |
| #10 | 侧边栏内无对话搜索能力 | 🟡 中 | 侧边栏顶部集成搜索胶囊，300ms debounce 实时过滤 | 短期 | ✅ 已完成 |
| #11 | 响应式断点不统一（768px vs 800px） | 🟡 中 | 统一 useBreakpoint hook，定义全局 breakpoints | 短期 | ✅ 已完成 |
| #12 | aria-live 文本裁切不当（slice(-100) 硬截断） | 🟡 中 | 改为按句子边界裁切，保留完整最新消息块 | 短期 | ✅ 已完成 |
| #13 | WelcomeScreen 卡片 hover 动画非 CSS 过渡（生硬） | 🟢 低 | CSS 类 + transition: all 0.2s ease，globals.css 定义 | 镆期 | ✅ 已完成 |
| #14 | Skip-to-content 使用内联 JS 而非 CSS 类 | 🟢 低 | .skip-link CSS 类 + :focus-visible 伪类 | 镆期 | ✅ 已完成 |
| #15 | HistoryPage 无分页，大量对话时性能风险 | 🟢 低 | react-window 虚拟滚动或分页加载（每页 20 条） | 镆期 | ✅ 已完成 |
| #16 | 流式滚动用 instant 非 smooth（跳动） | 🟢 低 | 智能 500ms 节流或 scroll-behavior: smooth CSS | 镆期 | ✅ 已完成 |
| #17 | 边缘状态处理缺失（断网/SSE超时/长文本等） | 🟡 中 | 逐项添加：SSE 超时提示、长文本截断、发送按钮禁用 | 短期 | ✅ 已完成 |
| #18 | 认知负荷过高（Hick/Fitts/Miller 定律违规） | 🟡 中 | 搜索过滤减少选择、列表项增至 44px、时间组可折叠 | 短期 | ✅ 已完成 |

---

## 代码改动摘要

### P0 关键改动

**P0-1: 合并重复个人设置入口** — `AppLayout.tsx`
- 侧边栏底部用户区移除 Dropdown（包含个人设置+退出），改为直接显示退出按钮
- 顶部 Header 用户下拉保留完整菜单（知识库+个人设置+退出）
- 符合审计报告方案 A（推荐）

**P0-2: 侧边栏对话列表增强** — `AppLayout.tsx`
- 会话项添加 Tooltip（显示完整标题 + 日期信息）
- 非活跃会话项透明度降低至 0.6（DeepSeek 风格，减少视觉竞争）
- 搜索胶囊、时间分组、折叠功能已存在

**P0-3: 全局 ErrorBoundary + Markdown 独立边界** — `MessageBubble.tsx`
- 在 ReactMarkdown 渲染外围添加独立 ErrorBoundary
- 防止 Markdown 解析异常导致整页崩溃
- 已有根层 ErrorBoundary（包裹 Outlet）

**P0-4: 断网检测与发送保护** — `ChatPage.tsx`, `chatStore.ts`
- ChatPage 添加 useOnlineStatus hook
- 发送按钮断网时 disabled
- handleSend 中断网检查 + Toast 提示
- SSE 超时监控：10s 无 token 显示"仍在思考中...", 30s 自动断开

### P1 中等改动

**#7: 知识管理页面 i18n 硬编码清理** — `KnowledgeBasePage.tsx`
- 表格列头从硬编码英文（'Title', 'Category', 'Type', 'Chunks', 'Created', 'Actions'）改为 i18n t() 调用
- 新增 zh/en common.json 翻译 key（kb_title, kb_category 等）

**#5: Tooltip 增强** — `AppLayout.tsx`
- 会话项 Tooltip 显示完整标题 + 日期信息

**#6-#12: 已在之前迭代中完成**
- #6: 长按视觉反馈（scale动画 + navigator.vibrate）
- #8: Skeleton 骨架屏加载态
- #9: 切换对话过渡动画（isTransitioning + opacity fade）
- #10: 侧边栏搜索胶囊 + debounce
- #11: 统一 useBreakpoint hook
- #12: clipForScreenReader 按句子边界裁切

**#17: SSE 超时处理** — `chatStore.ts`
- 添加 thinkingCheckInterval 监控 SSE idle
- 10s 无 token 显示"仍在思考中..."提示
- 30s 无 token 自动断开并提示

### P2 低优先级改动

**#16: 流式滚动行为统一** — `ChatPage.tsx`
- 流式期间从 'instant' 改为 'smooth'
- throttle(200ms) 仍然限制滚动频率

**#13-#15: 已在之前迭代中完成**
- #13: .welcome-card CSS hover transition
- #14: .skip-link CSS 类 + :focus-visible
- #15: HistoryPage Pagination 分页

---

## 验收报告

见 `ux_improvement_report/UX优化成果汇报.md`
