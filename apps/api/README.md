# API Service

后端服务工作区。后续按模块化单体方式组织会话、消息、知识库、AI 编排、检索、转人工、坐席、权限、报表和审计能力。

当前已包含基础健康检查入口：

- `GET /health`：报告应用状态、PostgreSQL 连接状态和 Redis 连接状态。

当前 HTTP 入口已包含请求关联日志：

- 每个请求都会生成或复用 `x-request-id`，并在响应头中回传。
- 请求开始、响应完成和异常处理会记录结构化日志。
- 统一错误响应会返回 `error.requestId`，用于关联客户端错误和服务端日志。

当前后台登录入口：

- `POST /api/auth/login`：后台账号使用 `loginName` 和 `password` 登录，成功后返回 Bearer JWT、账号基础信息和后台角色。
- 密码哈希校验来自成熟外部依赖 `bcryptjs`。
- JWT 签发来自成熟外部依赖 `jsonwebtoken`。
- 账号与角色读取来自 PostgreSQL，使用成熟外部依赖 `pg` 执行真实查询。

尚未实现会话、消息、知识库管理、RBAC 权限或转人工业务接口。
