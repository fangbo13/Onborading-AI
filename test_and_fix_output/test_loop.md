# EY Onboarding AI - 测试循环文档 (Test LOOP)

## 测试环境
- **浏览器:** Chromium (Headless) via Playwright
- **视口:** 1280x800 (桌面), 375x667 (移动端)
- **语言:** 英文 (en-US) / 中文 (zh)
- **主题:** 浅色 / 深色

## 测试分类

### Category A – 视觉与主题
- [x] A1: 登录页面浅色模式渲染
- [x] A2: 登录表单i18n占位符检查
- [x] A3: 登录表单验证消息i18n
- [x] A4: 登录流程
- [x] A5: 深色模式切换
- [x] A6: 快速主题切换 x20
- [x] A7: 移动端视口响应式

### Category B – 国际化 (i18n)
- [x] B1: 缺失翻译键控制台检查
- [x] B2: 历史页面
- [x] B3: 个人设置页面
- [x] B4: 语言切换为中文
- [x] B5: 保存后导航语言验证
- [x] B6: 刷新后语言持久性
- [x] B7: 知识库表格列标题国际化

### Category C – 核心对话/Q&A
- [x] C1: 聊天页面加载
- [x] C2: 欢迎屏幕快捷操作
- [x] C3: 空消息发送按钮状态
- [x] C4: 有内容时发送按钮显示

### Category D – 历史与持久化
- [x] D1: History页面导航方式
- [x] D2: 选择历史对话后消息加载

### Category E – UI组件
- [x] E1: 错误警报标题国际化
- [x] E2: 发送按钮文字行为

### Category F – 表单与验证
- [x] F1: Profile页面字段显示
- [x] F2: 主题持久性检查

### Category G – 错误与边界情况
- [x] G1: 系统主题与ConfigProvider同步
- [x] G2: 登出API依赖
- [x] G3: 知识库成功提示i18n键

### Category H – 性能
- [x] H1: 全局CSS过渡性能
- [x] H2: 应用概览截图

## 代码审查额外发现
- [x] R1: 重试功能消息选择
- [x] R2: finishStreamingMessage未使用参数
- [x] R3: 菜单高亮路径匹配
