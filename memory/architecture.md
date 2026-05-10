# 架构与文件职责记录

本文档记录当前项目的目录结构、文件职责和模块边界。每次实施步骤涉及新增或修改文件时，必须同步更新本文档，供后续开发者快速理解项目内容。

## 总体结构

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `README.md` | 仓库入口说明，描述工作区划分、当前约束、已具备的基础能力、申请材料和文档位置。 | 申请演示补强更新 |
| `package.json` | npm workspaces 根配置、统一校验脚本、API 启动脚本、TypeScript、格式检查、测试、环境配置校验、模块边界检查、本地服务配置检查和数据库迁移脚本入口。 | 步骤 12 更新 |
| `package-lock.json` | npm 依赖锁文件，锁定 TypeScript、Prettier、Vitest、jsdom、dotenv、zod、express、pino、ioredis、pg、node-pg-migrate、supertest、bcryptjs、jsonwebtoken、Node 类型等依赖版本及 workspace 依赖图。 | 步骤 15 更新 |
| `.editorconfig` | 编辑器基础风格规则，统一 UTF-8、LF、2 空格缩进和末尾换行。 | 步骤 2 新增 |
| `.gitignore` | 忽略依赖、构建产物、覆盖率、npm 缓存和 TypeScript 构建信息。 | 步骤 2 新增 |
| `.prettierrc.json` | Prettier 格式化规则。 | 步骤 2 新增 |
| `.prettierignore` | Prettier 忽略规则，避免格式化依赖、构建产物、锁文件、SQL 迁移文件和 `memory` 权威文档。 | 步骤 7 更新 |
| `tsconfig.base.json` | 全局 TypeScript 严格模式、模块解析、路径别名和共享编译选项。 | 步骤 2 新增 |
| `tsconfig.json` | 根类型检查入口，覆盖全部 `apps/*/src` 与 `packages/*/src` 源码。 | 步骤 2 新增 |
| `config/env/.env.local.example` | 本地开发环境配置示例。 | 步骤 4 新增 |
| `config/env/.env.test.example` | 测试环境配置示例。 | 步骤 4 新增 |
| `config/env/.env.production.example` | 生产环境配置示例，不包含真实密钥。 | 步骤 4 新增 |
| `docker-compose.yml` | 本地 Docker Compose 编排，定义 PostgreSQL/pgvector、Redis、API、worker 和前端静态服务配置；默认用于本地开发，不承担生产高可用职责。 | 步骤 6 新增 |
| `e2e/tests/health.test.ts` | 端到端测试入口健康用例，验证 E2E 测试套件可被根脚本执行。 | 步骤 3 新增 |
| `docs/environment.md` | 环境变量规范文档，说明必填项、示例文件和校验命令。 | 步骤 4 新增 |
| `docs/database-migrations.md` | 数据库迁移机制文档，记录 `node-pg-migrate` 规则、命令、schema、基础迁移、账号角色、会话消息、知识库、评价和审计迁移。 | 步骤 11 更新 |
| `docs/mimo-application.md` | MiMo 百万亿计划项目说明，记录项目简介、当前能力、Credits 使用计划、证明材料清单和演示接口。 | 申请演示补强新增 |
| `docs/module-boundaries.md` | 后端模块和前端应用边界检查清单，定义每个模块唯一主职责。 | 步骤 5 新增 |
| `scripts/check-module-boundaries.mjs` | 模块边界文档检查脚本，验证必需模块条目完整且没有万能模块条目。 | 步骤 5 新增 |
| `scripts/check-local-services.mjs` | 本地服务编排静态检查脚本，验证 Docker Compose 与 Nginx 配置包含必需服务、healthcheck、依赖关系和静态路由。 | 步骤 6 新增 |
| `scripts/check-database-migrations.mjs` | 数据库迁移配置静态检查脚本，验证迁移工具依赖、脚本、配置和 SQL 迁移文件完整性，当前覆盖基础、账号角色、会话消息、知识库、评价和审计迁移。 | 步骤 11 更新 |
| `scripts/run-web-widget-tests.mjs` | web-widget 测试启动脚本，清理 Vitest 缓存并固定 `INIT_CWD`，避免全量测试在沙箱路径映射下读取原始 D 盘测试路径。 | 申请演示补强新增 |
| `infra/local/README.md` | 本地基础服务说明，记录 PostgreSQL、Redis、API、worker 和静态服务的本地启动方式与当前步骤边界。 | 步骤 6 新增 |
| `infra/local/nginx.conf` | 本地前端静态服务 Nginx 配置，后续用于暴露 `web-widget`、`agent-console` 和 `admin-console` 构建产物。 | 步骤 6 新增 |
| `apps/api` | 后端 API 服务工作区，后续承载模块化单体后端能力；当前已包含基础 HTTP 健康检查入口。 | 步骤 12 更新 |
| `apps/api/README.md` | API 工作区说明，记录当前健康检查入口和未实现的后续业务接口边界。 | 步骤 12 更新 |
| `apps/api/package.json` | API 工作区包配置，记录后端依赖、启动、测试、环境配置校验和数据库迁移脚本；当前运行依赖包含 `pino`、`bcryptjs` 和 `jsonwebtoken`。 | 步骤 15 更新 |
| `apps/api/migration.config.json` | `node-pg-migrate` 配置，定义迁移目录、应用 schema、迁移历史表和 SQL 迁移规则。 | 步骤 7 新增 |
| `apps/web-widget` | 网站 / H5 客服组件工作区，后续独立打包为嵌入式聊天组件。 | 步骤 1 新增空工作区 |
| `apps/agent-console` | 坐席工作台工作区，后续处理待接入会话和人工回复。 | 步骤 1 新增空工作区 |
| `apps/admin-console` | 管理后台工作区，后续维护知识库、账号、会话记录和基础看板。 | 步骤 1 新增空工作区 |
| `packages/contracts` | 共享契约工作区，后续维护 API 类型、枚举、状态和事件定义。 | 步骤 1 新增空工作区 |
| `packages/shared-ui` | 前端共享 UI 工作区，后续沉淀跨前端应用复用的基础 UI 能力。 | 步骤 1 新增空工作区 |
| `docs` | 工程说明文档目录，当前指向 `memory` 中的权威实施上下文。 | 步骤 1 新增 |
| `memory/implementation-plan.md` | 分步实施计划。每次实施前必须阅读，步骤之间不得跨越。 | 已存在 |
| `memory/system-design.md` | 系统设计与业务边界。 | 已存在 |
| `memory/tech-stack.md` | 技术栈与工程形态。 | 已存在 |
| `memory/progress.md` | 逐步实施记录。每步完成后必须更新。 | 步骤 1 初始化 |
| `memory/architecture.md` | 本文件，记录文件职责和结构变化。 | 步骤 1 初始化 |

## 工作区 TypeScript 入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/tsconfig.json` | 后端服务工作区 TypeScript 配置，继承根严格配置。 | 步骤 2 新增 |
| `apps/api/src/index.ts` | 后端服务编译入口，当前导出后台登录、健康检查、统一错误响应、请求日志/关联标识、知识库管理、最小知识问答和 API 服务创建入口。 | 申请演示补强更新 |
| `apps/api/src/main.ts` | API 进程启动入口，创建 HTTP 服务并监听 `PORT`，默认端口为 `3000`。 | 步骤 12 新增 |
| `apps/api/src/server.ts` | API HTTP 应用创建入口，装配请求关联上下文、请求日志、JSON 解析、健康检查、后台登录、最小知识问答、知识库管理、可测试扩展路由、404 处理和统一错误处理中间件。 | 申请演示补强更新 |
| `apps/web-widget/tsconfig.json` | 客服组件工作区 TypeScript 配置，继承根严格配置并启用 React JSX。 | 步骤 2 新增 |
| `apps/web-widget/package.json` | 客服组件工作区包配置，当前测试脚本让 Vitest 在工作区内自动发现测试文件，避免沙箱路径映射导致的显式文件路径失效。 | 申请演示补强更新 |
| `apps/web-widget/src/index.ts` | 客服组件编译入口占位，仅用于空项目类型检查，不包含业务逻辑。 | 步骤 2 新增 |
| `apps/agent-console/tsconfig.json` | 坐席工作台 TypeScript 配置，继承根严格配置并启用 React JSX。 | 步骤 2 新增 |
| `apps/agent-console/src/index.ts` | 坐席工作台编译入口占位，仅用于空项目类型检查，不包含业务逻辑。 | 步骤 2 新增 |
| `apps/admin-console/tsconfig.json` | 管理后台 TypeScript 配置，继承根严格配置并启用 React JSX。 | 步骤 2 新增 |
| `apps/admin-console/src/index.ts` | 管理后台编译入口占位，仅用于空项目类型检查，不包含业务逻辑。 | 步骤 2 新增 |
| `packages/contracts/tsconfig.json` | 共享契约包 TypeScript 配置，继承根严格配置。 | 步骤 2 新增 |
| `packages/contracts/src/index.ts` | 共享契约包导出入口，导出账号、角色、登录响应、会话、消息、知识库、评价、审计和错误响应共享契约。 | 步骤 15 更新 |
| `packages/shared-ui/tsconfig.json` | 共享 UI 包 TypeScript 配置，继承根严格配置并启用 React JSX。 | 步骤 2 新增 |
| `packages/shared-ui/src/index.ts` | 共享 UI 包编译入口占位，仅用于空项目类型检查，不包含业务逻辑。 | 步骤 2 新增 |

## 测试入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/tests/health.test.ts` | 后端测试框架健康用例，验证 API 工作区 Vitest node 环境可运行。 | 步骤 3 新增 |
| `apps/web-widget/tests/health.test.ts` | 客服组件测试框架健康用例，验证 web-widget 工作区 Vitest jsdom 环境可运行。 | 步骤 3 新增 |
| `e2e/tests/health.test.ts` | 端到端测试框架健康用例，验证根 E2E 测试入口可运行。 | 步骤 3 新增 |

测试脚本入口：

- `npm.cmd run test`：串行运行后端、客服组件和 E2E 健康测试。
- `npm.cmd run test:api`：运行 `apps/api` 后端健康测试。
- `npm.cmd run test:web-widget`：运行 `apps/web-widget` 客服组件健康测试。
- `npm.cmd run test:e2e`：运行 `e2e` 健康测试。
- Vitest 在当前 Windows 沙箱中使用 `--pool threads`，避免默认 fork worker 被系统拒绝。

## 环境配置入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/config/environment.ts` | API 工作区环境配置 schema、`.env` 文件解析、配置分组和错误类型。 | 步骤 4 新增 |
| `apps/api/src/config/check-environment.ts` | 环境配置命令行校验入口，可校验指定 `.env` 文件或当前进程环境。 | 步骤 4 新增 |
| `apps/api/src/config/runtime-environment.ts` | API 运行时环境加载入口，优先使用进程环境，缺少 `APP_ENV` 时加载本地示例环境并复用既有配置校验。 | 步骤 12 新增 |
| `apps/api/tests/environment.test.ts` | 环境配置单元测试，覆盖完整配置解析和缺失配置失败。 | 步骤 4 新增 |
| `apps/api/tests/fixtures/missing-required.env` | 缺失必填环境变量的失败校验 fixture。 | 步骤 4 新增 |

环境校验覆盖：

- 数据库：`DATABASE_URL`
- Redis：`REDIS_URL`
- AI 服务：`AI_PROVIDER`、`AI_API_BASE_URL`、`AI_API_KEY`、`AI_CHAT_MODEL`、`AI_EMBEDDING_MODEL`
- 鉴权：`JWT_SECRET`
- 前端 API 地址：`VITE_API_BASE_URL`
- 日志级别：`LOG_LEVEL`
- 环境类型：`APP_ENV`

## 模块边界检查入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `docs/module-boundaries.md` | 记录后端 `conversation`、`message`、`knowledge`、`retrieval`、`ai-orchestration`、`handoff`、`agent`、`auth`、`metrics`、`audit` 模块边界，以及 `web-widget`、`agent-console`、`admin-console`、`shared-ui`、`contracts` 前端/共享边界。 | 步骤 5 新增 |
| `scripts/check-module-boundaries.mjs` | 检查模块边界文档是否包含所有必需模块和前端区域，并阻止文档出现显式万能模块条目。 | 步骤 5 新增 |

## 本地基础服务配置

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `docker-compose.yml` | 定义本地开发基础服务：`postgres`、`redis` 默认可单独启动；`api`、`worker`、`static` 通过 profile 描述后续应用进程配置。 | 步骤 6 新增 |
| `infra/local/README.md` | 说明本地基础服务的启动命令、应用 profile 和步骤 6 未覆盖的后续健康检查边界。 | 步骤 6 新增 |
| `infra/local/nginx.conf` | Nginx 静态服务配置，按前端应用拆分静态资源路径。 | 步骤 6 新增 |
| `scripts/check-local-services.mjs` | 读取本地服务配置并执行静态完整性检查，避免缺失基础服务、healthcheck 或静态路由。 | 步骤 6 新增 |

本地服务边界：

- PostgreSQL 与 Redis 是当前可独立启动的基础依赖。
- `api`、`worker` 和 `static` 是本地编排配置，实际可用性依赖后续后端服务、worker 脚本和前端构建产物实现。
- 后端依赖健康检查 API 不在步骤 6 实现，已按实施计划在步骤 12 补齐。

## 后端健康检查入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/health/health.types.ts` | 健康检查共享类型，定义依赖状态、整体状态、应用状态和健康报告结构。 | 步骤 12 新增 |
| `apps/api/src/health/dependency-checks.ts` | PostgreSQL 与 Redis 依赖探测实现，分别复用 `pg` 和 `ioredis` 执行真实连接检查，并把底层连接错误转为可读消息。 | 步骤 12 新增 |
| `apps/api/src/health/health.service.ts` | 健康检查编排服务，汇总应用、数据库和 Redis 状态，任一依赖失败时整体为 `degraded`。 | 步骤 12 新增 |
| `apps/api/src/health/health.router.ts` | Express 健康检查路由，暴露 `GET /health`，健康返回 HTTP 200，依赖异常返回 HTTP 503。 | 步骤 12 新增 |
| `apps/api/tests/health-service.test.ts` | 健康检查服务单元测试，覆盖全部依赖正常和数据库异常场景。 | 步骤 12 新增 |
| `apps/api/tests/health-route.test.ts` | 健康检查 HTTP 路由测试，使用 `supertest` 覆盖 HTTP 200 和 HTTP 503 响应。 | 步骤 12 新增 |

后端健康检查边界：

- HTTP 路由能力来自外部依赖 `express`，数据库检查来自外部依赖 `pg`，Redis 检查来自外部依赖 `ioredis`。
- `GET /health` 只报告应用、PostgreSQL 和 Redis 状态，不承载业务接口、鉴权、日志关联标识或统一错误响应。
- 当前环境未运行 PostgreSQL 和 Redis 时，`GET /health` 返回 HTTP 503 并分别报告数据库和 Redis 连接失败，这是步骤 12 的预期依赖异常验证结果。

## 统一错误响应入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/errors/api-error.ts` | API 错误类型定义，提供统一错误码到 HTTP 状态码的映射，以及参数错误、未登录、无权限、资源不存在和状态冲突错误类。 | 步骤 13 新增 |
| `apps/api/src/errors/error.middleware.ts` | Express 错误处理中间件，负责归一化未知异常、处理 JSON 解析错误、生成 404 错误、记录错误日志，并输出带 `requestId` 的统一错误响应。 | 步骤 14 更新 |
| `apps/api/tests/error-response.test.ts` | 统一错误响应接口测试，覆盖 400、401、403、404、409 和 500 响应格式，并校验错误响应包含请求关联标识。 | 步骤 14 更新 |

统一错误响应边界：

- 错误响应结构由 `packages/contracts/src/error.ts` 共享给前后端。
- 业务代码后续应抛出 `ApiError` 子类或让中间件将未知异常归一化为 `INTERNAL_ERROR`。
- 步骤 14 已补齐请求关联标识和请求日志；认证和权限判断仍从步骤 15/16 继续补齐。

## 请求日志与关联标识入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/logging/logger.ts` | API 日志适配入口，定义最小 `AppLogger` 接口，并复用外部依赖 `pino` 输出结构化日志。 | 步骤 14 新增 |
| `apps/api/src/logging/request-context.ts` | 请求上下文定义，维护 `x-request-id` 头名称、请求 ID 和请求开始时间，并通过 Express Request 扩展保存上下文。 | 步骤 14 新增 |
| `apps/api/src/logging/request-context.middleware.ts` | 请求上下文中间件，复用传入的 `x-request-id` 或通过 `crypto.randomUUID()` 生成新 ID，并写回响应头。 | 步骤 14 新增 |
| `apps/api/src/logging/request-logging.middleware.ts` | 请求日志中间件，记录 `request.start` 和 `request.finish` 结构化日志，包含请求 ID、方法、路径、响应状态和耗时。 | 步骤 14 新增 |
| `apps/api/tests/request-logging.test.ts` | 请求日志与关联标识测试，覆盖请求 ID 生成、请求 ID 复用、成功请求日志和失败请求错误日志。 | 步骤 14 新增 |

请求日志边界：
- 日志输出能力来自外部依赖 `pino`；当前项目只维护最小日志适配和中间件编排。
- 请求关联标识统一使用 `x-request-id`；错误响应中的 `error.requestId` 与响应头保持一致。
- 请求日志当前覆盖 HTTP 入口层，不替代后续业务审计日志；知识库变更、坐席结束会话等业务审计仍归属 `audit` 模块后续实现。

## 后台登录入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/auth/account.repository.ts` | 后台登录账号仓储，使用外部依赖 `pg` 从 `app.accounts`、`app.account_roles` 和 `app.roles` 读取真实账号、密码哈希、启用状态和角色。 | 步骤 15 新增 |
| `apps/api/src/auth/password-verifier.ts` | 密码校验适配入口，使用外部依赖 `bcryptjs` 对明文密码和 bcrypt 哈希执行真实校验。 | 步骤 15 新增 |
| `apps/api/src/auth/access-token.ts` | 访问令牌签发与校验入口，使用外部依赖 `jsonwebtoken` 签发并验证 Bearer JWT；通过 Node `createRequire` 加载 CommonJS 包以兼容真实运行入口，并复用 `zod` 校验令牌载荷结构。 | 步骤 16 更新 |
| `apps/api/src/auth/authenticated-account.ts` | 当前后台账号请求上下文入口，通过 Express Request 扩展保存已认证账号，供后续业务路由和权限中间件读取。 | 步骤 16 新增 |
| `apps/api/src/auth/auth.middleware.ts` | Bearer 认证中间件，解析 `Authorization` 请求头并调用真实 JWT 校验器，将认证账号写入请求上下文。 | 步骤 16 新增 |
| `apps/api/src/auth/permissions.ts` | RBAC 权限策略入口，按后台角色映射账号管理、知识库、会话处理、会话查看和指标查看权限，并提供权限校验中间件。 | 步骤 16 新增 |
| `apps/api/src/auth/auth.service.ts` | 后台登录编排服务，负责参数检查、账号查询、密码校验、禁用账号拦截、角色检查和令牌响应组装。 | 步骤 15 新增 |
| `apps/api/src/auth/auth.router.ts` | Express 后台登录路由，暴露 `POST /api/auth/login` 并复用统一错误响应。 | 步骤 15 新增 |
| `apps/api/tests/auth-login.test.ts` | 后台登录接口测试，覆盖正确账号登录、错误密码失败和禁用账号失败，并验证 JWT 可由真实依赖校验。 | 步骤 15 新增 |
| `apps/api/tests/rbac.test.ts` | 角色权限校验测试，使用真实 `jsonwebtoken` 签发与校验 JWT，通过测试扩展路由验证坐席不能编辑知识库、知识库运营可以编辑知识库、未登录访问受保护路由失败以及坐席可处理会话。 | 步骤 16 新增 |

后台登录边界：
- 密码哈希算法来自外部依赖 `bcryptjs`，JWT 能力来自外部依赖 `jsonwebtoken`，数据库查询来自外部依赖 `pg`，HTTP 路由来自外部依赖 `express`。
- 当前项目只编排登录流程和输入输出适配，不实现密码算法、JWT 算法、HTTP 框架或数据库客户端内部逻辑。
- 登录接口只覆盖后台账号获取访问令牌；步骤 16 已补齐 JWT 解析中间件、当前用户上下文和 RBAC 权限策略。
- 当前 RBAC 只提供认证与授权胶水能力，未提前实现知识库 CRUD、坐席接入或管理后台业务接口。

## 知识分类管理入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/knowledge/category.repository.ts` | 知识分类 PostgreSQL 仓储，使用外部依赖 `pg` 直接读写 `app.knowledge_categories`，覆盖创建、编辑、停用、按 ID 查询和按状态列表查询。 | 步骤 17 新增 |
| `apps/api/src/knowledge/category.service.ts` | 知识分类编排服务，负责分类创建、编辑、查询、停用、slug 冲突归一化，以及校验分类是否可用于新知识条目。 | 步骤 17 新增 |
| `apps/api/src/knowledge/category.router.ts` | Express 知识分类路由，暴露 `GET/POST /api/admin/knowledge/categories`、`PUT /api/admin/knowledge/categories/:id` 和 `POST /api/admin/knowledge/categories/:id/disable`，并复用 Bearer 认证与 RBAC 权限中间件。 | 步骤 17 新增 |
| `apps/api/tests/knowledge-category.test.ts` | 知识分类接口测试，覆盖创建后查询、编辑、停用后不再出现在启用分类查询中、禁用分类不能用于新知识条目、重复 slug 冲突和权限拒绝。 | 步骤 17 新增 |

知识分类管理边界：

- 数据库读写能力来自外部依赖 `pg`，HTTP 路由能力来自外部依赖 `express`，请求校验来自外部依赖 `zod`，认证与权限复用步骤 16 的真实 JWT 与 RBAC 中间件。
- 当前项目只编排分类管理流程和输入输出适配，不实现数据库客户端、HTTP 框架、JWT 算法或业务检索算法。
- 步骤 17 只实现知识分类管理；知识条目创建已在步骤 18 实现，编辑已在步骤 19 实现，启停、查询、导入导出和检索仍按后续步骤推进。

## 知识条目管理入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/knowledge/article.repository.ts` | 知识条目 PostgreSQL 仓储，使用外部依赖 `pg` 写入和更新 `app.knowledge_articles`、`app.knowledge_tags` 与 `app.knowledge_article_tags`，创建和编辑时维护标签关联，并为最小问答闭环提供启用知识检索。 | 申请演示补强更新 |
| `apps/api/src/knowledge/article.service.ts` | 知识条目编排服务，负责创建/编辑输入归一化、分类可用性复用校验、文章仓储调用和审计写入。 | 步骤 19 更新 |
| `apps/api/src/knowledge/article.router.ts` | Express 知识条目路由，暴露 `POST /api/admin/knowledge/articles` 和 `PUT /api/admin/knowledge/articles/:id`，并复用 Bearer 认证与 RBAC 权限中间件。 | 步骤 19 更新 |
| `apps/api/src/audit/audit.repository.ts` | 审计 PostgreSQL 仓储，使用外部依赖 `pg` 写入 `app.audit_logs`，当前接入知识条目创建与编辑流程。 | 步骤 19 更新 |
| `apps/api/tests/knowledge-article-create.test.ts` | 知识条目接口测试，覆盖创建、编辑、必填校验、停用分类拒绝、审计记录和权限拒绝。 | 步骤 19 更新 |

知识条目创建与编辑边界：

- `POST /api/admin/knowledge/articles` 暴露后台知识条目创建入口，受 Bearer JWT 与 `knowledge:write` 权限保护。
- `PUT /api/admin/knowledge/articles/:id` 暴露后台知识条目编辑入口，受 Bearer JWT 与 `knowledge:write` 权限保护。
- 创建请求支持 FAQ/文档类型、标题、正文、分类、关键词、标签和初始状态；编辑请求支持修改标题、正文、分类、关键词、标签和状态。
- 分类可用性复用 `KnowledgeCategoryService.ensureCategoryCanBeUsedForNewArticle`，不重新实现分类存在性或启停状态判断。
- 生产路径通过成熟外部依赖 `pg` 写入和更新 `app.knowledge_articles`、`app.knowledge_tags`、`app.knowledge_article_tags` 和 `app.audit_logs`；HTTP 路由来自 `express`，输入校验来自 `zod`，JWT 校验来自 `jsonwebtoken`。
- 当前项目只编排请求校验、分类可用性检查、文章落库/更新、标签关联替换和审计写入调用，不实现数据库客户端、HTTP 框架、JWT 算法、向量化或大模型回答生成。
- 本步骤不实现知识条目启停专用入口、后台列表查询、删除、导入导出、全文检索或向量检索；这些仍按步骤 20 及后续步骤推进。

## 最小知识问答入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/src/knowledge/answer.service.ts` | 演示级知识问答编排服务，修剪访客问题、拦截订单/物流/账号等具体业务数据意图、检索启用知识条目、选择最佳知识并返回答案或转人工建议。 | 申请演示补强新增 |
| `apps/api/src/knowledge/answer.router.ts` | Express 最小知识问答路由，暴露 `POST /api/knowledge/answer`，输入为 `question`，输出包含答案、命中状态、是否建议转人工和来源知识条目。 | 申请演示补强新增 |
| `apps/api/tests/knowledge-answer.test.ts` | 最小知识问答接口测试，覆盖启用知识命中、未命中兜底、敏感业务数据不编造答案和空问题校验。 | 申请演示补强新增 |

最小知识问答边界：

- 当前问答闭环用于申请演示和后续大模型接入前的可验证路径，只基于启用知识条目的标题、正文、关键词和标签做轻量匹配。
- 命中知识时直接返回知识条目正文，不生成超出知识库的业务结论。
- 未命中知识或涉及订单、物流、账号等具体业务数据时返回转人工建议。
- 该入口不创建会话、不保存消息、不执行向量检索、不调用真实大模型；完整会话、消息、AI 编排和转人工流程仍按实施计划后续步骤推进。

## 数据库迁移入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `apps/api/migration.config.json` | `node-pg-migrate` 配置文件，使用 `DATABASE_URL` 环境变量连接数据库，将迁移文件读取自 `src/database/migrations`，迁移历史写入 `app.schema_migrations`。 | 步骤 7 新增 |
| `apps/api/src/database/README.md` | API 数据库迁移说明，要求所有长期结构变更通过迁移文件管理。 | 步骤 7 新增 |
| `apps/api/src/database/migrations/202604190001_create_app_schema_and_extensions.sql` | 基础迁移，创建 `app` schema 并启用 `pgvector` 的 `vector` 扩展；未创建任何业务表。 | 步骤 7 新增 |
| `apps/api/src/database/migrations/202604190002_create_accounts_and_roles.sql` | 账号与角色迁移，创建 `accounts`、`roles`、`account_roles`，表达后台账号启用状态和多角色关系。 | 步骤 8 新增 |
| `apps/api/src/database/migrations/202604190003_create_conversations_and_messages.sql` | 会话与消息迁移，创建 `conversations`、`messages`，表达访客会话、状态、当前坐席、关闭时间和消息归档。 | 步骤 9 新增 |
| `apps/api/src/database/migrations/202604190004_create_knowledge_base.sql` | 知识库迁移，创建 `knowledge_categories`、`knowledge_tags`、`knowledge_articles`、`knowledge_article_tags`，表达 FAQ/文档型知识、分类、标签、关键词、启停状态和软删除字段。 | 步骤 10 新增 |
| `apps/api/src/database/migrations/202604190005_create_ratings_and_audit_logs.sql` | 评价与审计迁移，创建 `satisfaction_ratings` 和 `audit_logs`，表达会话单次评分、知识条目新增/编辑/启停审计和坐席结束会话审计。 | 步骤 11 新增 |
| `apps/api/tests/account-role-migration.test.ts` | 账号与角色迁移契约测试，静态验证账号状态、三类后台角色和账号多角色关系。 | 步骤 8 新增 |
| `apps/api/tests/conversation-message-migration.test.ts` | 会话与消息迁移契约测试，静态验证会话状态、关闭时间约束、消息发送者类型和消息排序索引。 | 步骤 9 新增 |
| `apps/api/tests/knowledge-migration.test.ts` | 知识库迁移契约测试，静态验证分类状态、知识类型、知识状态、标签关系和可用知识过滤索引。 | 步骤 10 新增 |
| `apps/api/tests/rating-audit-migration.test.ts` | 评价与审计迁移契约测试，静态验证会话单次评价、评分范围、审计动作、审计目标和 metadata 结构。 | 步骤 11 新增 |
| `docs/database-migrations.md` | 面向开发者的迁移机制说明，记录命令、规则以及基础、账号角色、会话消息、知识库、评价和审计迁移。 | 步骤 11 更新 |
| `scripts/check-database-migrations.mjs` | 静态检查迁移工具依赖、根脚本、API 工作区脚本、迁移配置和 SQL 文件结构，当前覆盖基础、账号角色、会话消息、知识库、评价和审计迁移。 | 步骤 11 更新 |

数据库迁移边界：

- 迁移执行能力来自外部依赖 `node-pg-migrate`，PostgreSQL 连接能力来自外部依赖 `pg`。
- 当前项目不实现迁移框架内部逻辑，只提供配置、迁移文件和静态完整性检查。
- 账号、角色和账号角色关系已在步骤 8 通过迁移新增；会话和消息已在步骤 9 通过迁移新增；知识库分类、标签、条目和条目标签关系已在步骤 10 通过迁移新增；评价和审计表已在步骤 11 通过迁移新增。

## 共享契约入口

| 路径 | 职责 | 当前状态 |
| --- | --- | --- |
| `packages/contracts/src/auth.ts` | 共享账号状态、后台角色代码、后台权限代码和后台登录响应契约，当前包含 `enabled`、`disabled`、`admin`、`knowledge_operator`、`agent`、`account:manage`、`knowledge:read`、`knowledge:write`、`conversation:read`、`conversation:handle`、`metrics:read`、`LoginRequest`、`AuthenticatedAccount` 和 `LoginResponse`。 | 步骤 16 更新 |
| `packages/contracts/src/audit.ts` | 共享审计契约，当前包含审计操作者角色、知识条目新增/编辑/启停和坐席结束会话动作、审计目标类型，以及审计记录实体。 | 步骤 18 更新 |
| `packages/contracts/src/conversation.ts` | 共享会话状态、来源、消息发送者类型和消息类型契约，包含用户确认新增的 `handoff_pending_confirmation` 状态。 | 步骤 9 新增 |
| `packages/contracts/src/error.ts` | 共享错误响应契约，定义统一错误码和带可选 `requestId` 的 `ApiErrorResponse` 结构。 | 步骤 14 更新 |
| `packages/contracts/src/feedback.ts` | 共享评价契约，当前包含 1 到 5 分满意度评分范围。 | 步骤 11 新增 |
| `packages/contracts/src/knowledge.ts` | 共享知识库契约，当前包含知识分类实体、分类创建/编辑/列表响应契约、知识分类启停状态、FAQ/文档型知识类型、草稿/启用/停用状态、知识条目实体、知识条目创建/编辑请求，以及最小知识问答请求和响应契约。 | 申请演示补强更新 |
| `packages/contracts/src/index.ts` | 共享契约包导出入口，当前导出账号、角色、会话、消息、知识库、评价、审计和错误响应契约。 | 步骤 13 更新 |

账号与角色数据边界：

- `accounts`、`roles`、`account_roles` 归属后端 `auth` 模块的数据结构。
- `agent` 角色会被后续坐席模块使用，但坐席在线状态、接待记录和人工回复不在步骤 8 创建。
- 访客身份仍按实施文档使用匿名 visitor id，不进入后台账号表。

会话与消息数据边界：

- `conversations` 归属后端 `conversation` 模块，保存访客标识、来源、状态、当前坐席账号和关闭时间。
- `messages` 归属后端 `message` 模块，保存访客、机器人、坐席和系统消息。
- 转人工待确认状态只作为会话状态存在；转人工请求记录、队列和坐席接入流程后续由 `handoff` 与 `agent` 模块实现。

知识库数据边界：

- `knowledge_categories`、`knowledge_tags`、`knowledge_articles` 和 `knowledge_article_tags` 归属后端 `knowledge` 模块的数据结构；知识条目创建和编辑已通过 `pg` 生产仓储写入和更新这些表。
- 可用知识过滤以 `status = 'enabled'` 且 `deleted_at IS NULL` 为基础；具体检索、排序、向量化和 AI 编排不在步骤 10 实现。
- `deleted_at` 只为后续删除知识能力提供数据基础；当前未实现知识删除接口、导入导出或后台知识管理页面。

评价与审计数据边界：

- `satisfaction_ratings` 归属后端 `metrics` 模块的数据结构，保存会话单次满意度评分和可选文字反馈，后续用于满意度统计与会话详情展示。
- `audit_logs` 归属后端 `audit` 模块的数据结构，保存操作者、动作、目标和 JSON 元数据；当前动作范围覆盖知识条目新增/编辑/启停和坐席结束会话。
- 审计写入生产仓储已在步骤 18 接入知识条目创建流程，并在步骤 19 接入知识条目编辑流程；评价提交接口、知识启停审计和坐席结束会话审计仍按后续步骤推进。

## 已确认架构决策

- 当 AGENTS 约束与实施文档冲突时，以 `memory/implementation-plan.md` 为主。
- MVP 首期采用轮询同步访客端、坐席端和后台状态，不实现 WebSocket / Socket.IO。
- AI 建议转人工时需要新增待确认转人工状态，用户确认后才进入待坐席接入状态。
- 账号管理、知识导入导出、删除知识、超时关闭和留言能力纳入 MVP 补充范围，后续进入对应模块时实现。
- 用户已要求后续不等待人工测试确认，按实施文档连续实施；每步开始前仍必须重新阅读 `memory` 并在完成后更新 `progress.md` 与 `architecture.md`。

## 当前模块边界

- 后端业务能力后续集中在 `apps/api`，但必须按会话、消息、知识库、AI 编排、检索、转人工、坐席、权限、报表和审计拆分模块。
- 访客端、坐席端和管理后台分别位于独立应用工作区，避免前端能力混在单一页面或单一应用中。
- 共享类型和状态枚举后续进入 `packages/contracts`，共享 UI 进入 `packages/shared-ui`。
- 当前已建立统一 TypeScript 严格模式、格式化规则、基础测试入口、环境配置校验、模块边界检查清单、本地基础服务编排、数据库迁移机制、账号/角色/会话/消息/知识库/评价/审计基础数据结构、后端健康检查入口、统一错误响应、请求关联日志、后台登录、RBAC 权限校验、知识分类管理、知识条目创建/编辑以及最小知识问答；仍未实现客服会话业务逻辑、知识条目启停/查询、通用数据库访问层、Redis 业务队列或状态机。
