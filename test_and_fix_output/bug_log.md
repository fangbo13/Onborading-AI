# Bug Log - EY Onboarding AI

Generated: 2026-06-22T19:27:42.213291

Total bugs: 10
Critical: 1
Major: 1
Minor: 8

---

## BUG-001 - 登录表单硬编码英文占位符

- **Severity:** Minor
- **Category:** i18n
- **Status:** open
- **Description:** 登录页面的Email和密码输入框占位符硬编码为英文，不随i18n语言切换
- **Reproduction Steps:**
  1. 打开登录页面
  2. 检查输入框占位符
- **Expected:** 占位符应通过i18n翻译（如中文显示"请输入你的邮箱"）
- **Actual:** 占位符硬编码为："your.email@ey.com" 和 "Enter your password"
- **Screenshots:** screenshots/01-login-light.png

---

## BUG-002 - 登录表单验证消息硬编码英文

- **Severity:** Minor
- **Category:** i18n
- **Status:** open
- **Description:** Ant Design Form的rules中message硬编码为英文
- **Reproduction Steps:**
  1. 打开登录页面
  2. 清空邮箱字段
  3. 点击登录
  4. 查看错误提示
- **Expected:** 验证消息应使用i18n翻译
- **Actual:** 显示英文验证消息: Please enter your email
- **Screenshots:** screenshots/02-login-validation-errors.png

---

## BUG-003 - 选择历史对话后不加载消息

- **Severity:** Critical
- **Category:** history
- **Status:** open
- **Description:** HistoryPage只设置activeSessionId并导航到/chat，但ChatPage没有逻辑从API加载该会话的历史消息。用户看到空白页面。
- **Reproduction Steps:**
  1. 创建对话并发送消息
  2. 进入History
  3. 点击该对话
  4. 观察内容
- **Expected:** 应加载并显示完整的消息历史
- **Actual:** 消息列表为空，ChatPage未调用getMessages API
- **Screenshots:** None

---

## BUG-004 - 聊天错误警报标题未国际化

- **Severity:** Minor
- **Category:** i18n
- **Status:** open
- **Description:** ChatPage中错误Alert的message属性硬编码为"Error"英文字符串
- **Reproduction Steps:**
  1. 触发聊天错误
  2. 检查错误警报标题
- **Expected:** 应使用t()翻译
- **Actual:** 显示硬编码"Error"
- **Screenshots:** None

---

## BUG-005 - 系统主题变化时ConfigProvider未响应更新

- **Severity:** Major
- **Category:** theme
- **Status:** open
- **Description:** useTheme hook在mode=system时监听系统主题变化并更新data-theme，但effective React state不更新，ConfigProvider的theme prop不变
- **Reproduction Steps:**
  1. 设置主题为System
  2. 更改系统主题
  3. 观察Ant Design组件
- **Expected:** Ant Design组件主题应跟随系统变化
- **Actual:** 只有CSS变量切换，ConfigProvider不变
- **Screenshots:** None

---

## BUG-006 - 知识库删除和重建索引使用错误的成功提示

- **Severity:** Minor
- **Category:** i18n
- **Status:** open
- **Description:** handleReindex和handleDelete成功后调用message.success(t("upload_success"))而非正确的翻译键
- **Reproduction Steps:**
  1. 进入知识库
  2. 删除一个文档
  3. 观察成功提示
- **Expected:** 应显示"删除成功"或类似消息
- **Actual:** 显示"上传成功"(upload_success)
- **Screenshots:** screenshots/10-knowledge-base-page.png

---

## BUG-007 - 全局!important过渡动画影响性能

- **Severity:** Minor
- **Category:** performance
- **Status:** open
- **Description:** globals.css中*选择器应用了transition !important，影响所有元素
- **Reproduction Steps:**
  1. 打开应用
  2. DevTools Performance录制
  3. 切换页面
- **Expected:** 过渡应仅应用于需要的元素
- **Actual:** * { transition: ... !important }
- **Screenshots:** None

---

## BUG-008 - 重试功能可能选择错误的用户消息

- **Severity:** Minor
- **Category:** ux
- **Status:** open
- **Description:** handleRetry用reverse().find()找最后一条user消息，多条连续用户消息时可能选错
- **Reproduction Steps:**
  1. 连续发两条消息
  2. 第二条出错
  3. 点重试
- **Expected:** 应重试最后失败的消息
- **Actual:** 可能重试了非预期的消息
- **Screenshots:** None

---

## BUG-009 - finishStreamingMessage的sessionId参数未使用

- **Severity:** Minor
- **Category:** code-quality
- **Status:** open
- **Description:** sessionId参数带_前缀标记未使用，流式完成后不更新activeSessionId
- **Reproduction Steps:**
  代码审查
- **Expected:** 应用于更新activeSessionId
- **Actual:** 参数被忽略
- **Screenshots:** None

---

## BUG-010 - 根路径重定向时侧边栏菜单高亮不匹配

- **Severity:** Minor
- **Category:** ui
- **Status:** open
- **Description:** 访问/时Redirect到/chat，但location.pathname仍是/，selectedKeys=["/"]不匹配任何菜单项key
- **Reproduction Steps:**
  1. 访问/
  2. 观察菜单高亮
- **Expected:** Chat菜单项应高亮
- **Actual:** 无菜单项高亮
- **Screenshots:** None

---

