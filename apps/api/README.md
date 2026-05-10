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

当前后台权限入口：

- Bearer JWT 校验来自成熟外部依赖 `jsonwebtoken`，当前项目只做请求头解析、令牌校验调用和账号上下文装配。
- RBAC 权限策略按后台角色映射：管理员拥有全部后台权限，知识库运营拥有知识库维护与基础数据查看权限，坐席拥有会话处理权限。
- 权限中间件已可被后续知识库、坐席和管理后台路由直接装配；当前步骤未提前实现知识库 CRUD 或坐席业务接口。

当前知识分类管理入口：

- `GET /api/admin/knowledge/categories`：查询知识分类，支持用 `status=enabled|disabled` 过滤。
- `POST /api/admin/knowledge/categories`：创建知识分类，默认启用。
- `PUT /api/admin/knowledge/categories/:id`：编辑知识分类名称和 slug。
- `POST /api/admin/knowledge/categories/:id/disable`：停用知识分类，不改动历史知识条目。
- 数据库读写来自 PostgreSQL，使用成熟外部依赖 `pg` 执行真实查询；HTTP 路由来自 `express`，输入校验来自 `zod`，权限校验复用 RBAC 中间件。

当前知识条目创建入口：

- `POST /api/admin/knowledge/articles`：创建知识条目，支持 `articleType`、标题、正文、分类、关键词、标签和初始状态。
- `PUT /api/admin/knowledge/articles/:id`：编辑知识条目，支持修改标题、正文、分类、关键词、标签和状态。
- 创建前会复用知识分类服务确认分类存在且未停用；创建成功后写入 `knowledge_article_created` 审计记录。
- 编辑时同样复用知识分类服务确认新分类存在且未停用；编辑成功后写入 `knowledge_article_updated` 审计记录。
- 知识条目、标签关系和审计记录的生产读写来自 PostgreSQL，使用成熟外部依赖 `pg` 执行真实查询；HTTP 路由来自 `express`，输入校验来自 `zod`，权限校验复用 RBAC 中间件。

当前最小知识问答入口：

- `POST /api/knowledge/answer`：访客传入 `question` 后，系统从启用知识条目中检索匹配内容并返回答案。
- 命中知识条目时返回 `answer`、`matched = true`、`needsHandoff = false` 和来源知识条目。
- 未命中知识库时返回兜底提示，并标记 `needsHandoff = true`。
- 订单、物流、账号等具体业务数据问题不会编造答案，会直接建议人工客服核实。
- 当前问答策略是演示级关键词/文本匹配闭环，尚未接入真实大模型生成、向量检索或完整会话状态。

尚未实现会话、消息、知识条目启停/查询或转人工业务接口。
