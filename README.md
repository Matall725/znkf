# 智能客服系统

本仓库用于实现网站 / H5 智能客服 MVP。当前已建立工作区、基础工程规范、数据层迁移、后端健康检查、统一错误响应、请求关联日志和后台登录能力，业务闭环接口仍按 `memory/implementation-plan.md` 分步推进。

## 工作区

- `apps/api`：Node.js/TypeScript 后端服务，后续承载会话、消息、知识库、AI 编排、转人工、坐席、权限、报表与审计模块。
- `apps/web-widget`：网站 / H5 客服聊天组件，后续独立打包为可嵌入资源。
- `apps/agent-console`：坐席工作台，后续用于待接入会话、人工回复和结束会话。
- `apps/admin-console`：管理后台，后续用于知识库、账号、会话记录和基础看板。
- `packages/contracts`：前后端共享类型、枚举和 API 契约。
- `packages/shared-ui`：前端共享 UI 基础能力。
- `docs`：工程说明文档。
- `memory`：实施计划、设计、技术栈、进度与架构记录。

## 当前约束

- 每次只实施 `memory/implementation-plan.md` 中的一个步骤。
- 每步实施前必须阅读 `memory` 文档。
- 每步实施时必须同步维护 `memory/progress.md` 和 `memory/architecture.md`。
- 用户最新要求为连续实施；每步完成后运行当前环境可执行的自动化验证并记录结果。
