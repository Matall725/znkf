# 实施进度记录

本文档记录每一步实施内容、验证方式和等待用户确认的事项。每次开始新步骤前必须先阅读 `memory` 目录中的实施计划、系统设计、技术栈、架构记录和进度记录。

## 执行规则

- 严格按 `memory/implementation-plan.md` 逐步实施。
- 每次开始一个新步骤前必须重新阅读 `memory` 目录中的实施计划、系统设计、技术栈、架构记录和进度记录，保证整体性和一致性。
- 每次只完成当前步骤要求的最小改动，不顺手实现后续功能。
- 每步完成后更新 `memory/progress.md` 和 `memory/architecture.md`。
- 用户最新要求：后续不再等待人工测试确认，按实施文档连续实施；每步仍需执行当前环境可运行的自动化验证并记录结果。
- 当 AGENTS 约束与实施文档冲突时，以实施文档为主。

## 步骤 1：建立工作区结构

- 状态：已完成，用户已确认进入下一步。
- 实施内容：
  - 新增 npm workspaces 根配置 `package.json`。
  - 新增仓库入口说明 `README.md`。
  - 新增后端服务工作区 `apps/api`。
  - 新增客服前端组件工作区 `apps/web-widget`。
  - 新增坐席工作台工作区 `apps/agent-console`。
  - 新增管理后台工作区 `apps/admin-console`。
  - 新增共享契约工作区 `packages/contracts`。
  - 新增共享 UI 工作区 `packages/shared-ui`。
  - 新增工程文档目录 `docs`。
  - 初始化本进度记录文档和架构文件职责文档。
- 边界说明：
  - 本步骤只建立结构和基础说明。
  - 未实现任何业务功能。
  - 未配置 TypeScript、测试框架、环境变量、数据库、Redis 或构建流程；这些属于后续步骤。
- 我执行的验证：
  - 已确认当前仓库原先只有 `memory` 目录，未覆盖已有工程结构。
  - 已确认本目录不是 Git 仓库，因此没有执行 Git 暂存或提交。
  - 已确认本机 `node --version` 可用。
  - 已运行 `npm.cmd pkg get name --workspaces`，确认 npm 能识别 6 个 workspace。
  - 已运行 `npm.cmd run check:workspace`，确认根脚本能复现工作区校验。
  - `npm` PowerShell 脚本受执行策略限制，需使用 `npm.cmd` 运行 npm 命令。
- 建议用户验证：
  - 运行 `npm.cmd run check:workspace`，确认包管理器能识别 6 个 workspace。
  - 检查目录结构中前端、后端、共享包和文档区域职责是否清晰。
  - 确认 `memory/architecture.md` 已说明新增文件职责。

## 步骤 2：初始化统一 TypeScript 规范

- 状态：已完成，用户已确认进入下一步。
- 实施内容：
  - 安装根开发依赖 `typescript` 和 `prettier`，并生成 `package-lock.json`。
  - 新增根 TypeScript 配置 `tsconfig.base.json` 和 `tsconfig.json`。
  - 为 6 个 workspace 增加各自的 `tsconfig.json`，全部继承根严格配置。
  - 为 6 个 workspace 增加 `src/index.ts` 编译入口占位，确保空项目可以被 TypeScript 检查。
  - 在根 `package.json` 增加 `typecheck` 和 `format:check` 脚本。
  - 增加 `.editorconfig`、`.prettierrc.json`、`.prettierignore` 和 `.gitignore`，统一基础代码风格和格式化规则。
- 边界说明：
  - 本步骤只建立 TypeScript、路径别名、格式化和风格基础规则。
  - `src/index.ts` 文件只包含 `export {};`，用于空项目编译，不包含业务逻辑。
  - 未实现测试框架、环境配置、业务接口、数据库、Redis 或任何客服业务能力。
  - `memory/` 被加入 `.prettierignore`，避免格式化工具重排权威实施文档。
- 我执行的验证：
  - 已运行 `npm.cmd run typecheck`，空项目类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已临时新增 `packages/contracts/src/__typecheck_failure__.ts`，写入 `const strictNumber: number = 'not a number';`。
  - 已运行 `npm.cmd run typecheck`，确认严格类型检查按预期失败，错误为 `Type 'string' is not assignable to type 'number'`。
  - 已删除临时错误文件，并再次运行 `npm.cmd run typecheck` 和 `npm.cmd run format:check`，确认恢复后全部通过。
- 建议用户验证：
  - 运行 `npm.cmd run typecheck`，确认类型检查通过。
  - 运行 `npm.cmd run format:check`，确认格式检查通过。
  - 可自行临时加入明显类型错误，确认 `npm.cmd run typecheck` 会失败，然后撤销临时错误。

## 步骤 3：建立基础测试框架

- 状态：已完成，用户已确认进入下一步。
- 实施内容：
  - 安装根开发依赖 `vitest` 和 `jsdom`，并更新 `package-lock.json`。
  - 在根 `package.json` 增加 `test`、`test:api`、`test:web-widget` 和 `test:e2e` 脚本。
  - 为 `apps/api` 增加后端健康测试入口 `apps/api/tests/health.test.ts`。
  - 为 `apps/web-widget` 增加客服组件健康测试入口 `apps/web-widget/tests/health.test.ts`，使用 jsdom 环境。
  - 为 `e2e` 增加端到端健康测试入口 `e2e/tests/health.test.ts`。
- 边界说明：
  - 本步骤只保证测试框架可运行。
  - 当前健康测试不包含任何客服业务逻辑、接口调用、数据库、Redis、AI 或浏览器自动化流程。
  - Vitest 在当前 Windows 沙箱中使用 `--pool threads`，避免默认 fork worker 被系统拒绝。
  - Playwright 浏览器级 E2E 未在本步骤引入；后续真正出现浏览器流程时再按需接入。
- 我执行的验证：
  - 已运行 `npm.cmd run test`，后端、客服组件和 E2E 三个健康测试套件全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已临时把 `apps/api/tests/health.test.ts` 中的断言改为错误期望，运行 `npm.cmd run test:api` 确认测试失败并返回非零退出码。
  - 已恢复临时失败断言，并再次运行 `npm.cmd run test`、`npm.cmd run typecheck` 和 `npm.cmd run format:check`，确认全部通过。
- 建议用户验证：
  - 运行 `npm.cmd run test`，确认全部健康测试通过。
  - 运行 `npm.cmd run typecheck`，确认类型检查通过。
  - 运行 `npm.cmd run format:check`，确认格式检查通过。
  - 可自行临时改坏任一健康测试，确认对应测试脚本会失败，然后撤销临时修改。

## 步骤 4：建立环境配置规范

- 状态：已完成，用户已要求后续不等待人工测试确认。
- 实施内容：
  - 安装 API 工作区运行依赖 `dotenv` 和 `zod`，用于读取 `.env` 文件和结构化校验配置。
  - 安装根开发依赖 `@types/node`，用于 TypeScript 识别 Node 运行时类型。
  - 新增 `config/env/.env.local.example`、`config/env/.env.test.example` 和 `config/env/.env.production.example`。
  - 新增 `apps/api/src/config/environment.ts`，定义环境配置 schema、配置解析、配置分组和 `EnvironmentConfigError`。
  - 新增 `apps/api/src/config/check-environment.ts`，作为命令行配置校验入口。
  - 新增 `docs/environment.md`，记录必填配置项、示例文件和校验命令。
  - 新增 `apps/api/tests/environment.test.ts` 和 `apps/api/tests/fixtures/missing-required.env`，覆盖完整配置和缺失配置失败场景。
  - 在根 `package.json` 增加 `config:check:local`、`config:check:test` 和 `config:check:production`。
  - 更新 `.gitignore`，忽略真实 `.env` 文件但保留 `config/env/*.example` 示例文件。
- 覆盖配置项：
  - `APP_ENV`
  - `DATABASE_URL`
  - `REDIS_URL`
  - `AI_PROVIDER`
  - `AI_API_BASE_URL`
  - `AI_API_KEY`
  - `AI_CHAT_MODEL`
  - `AI_EMBEDDING_MODEL`
  - `JWT_SECRET`
  - `VITE_API_BASE_URL`
  - `LOG_LEVEL`
- 边界说明：
  - 本步骤只定义配置规范和校验入口。
  - 未连接 PostgreSQL、Redis 或 AI 服务。
  - 未启动后端服务或前端应用。
  - 校验脚本使用 Node 24 的 `--experimental-strip-types` 执行 TypeScript 文件；未引入 `tsx`，因为当前 Windows 沙箱拒绝其安装脚本。
- 我执行的验证：
  - 已运行 `npm.cmd run config:check:local`，本地示例配置通过。
  - 已运行 `npm.cmd run config:check:test`，测试示例配置通过。
  - 已运行 `npm.cmd run config:check:production`，生产示例配置通过。
  - 已运行 `npm.cmd --workspace @znkfxt/api run config:check -- --env-file tests/fixtures/missing-required.env`，确认缺失必填配置时返回非零退出码并列出缺失项。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
- 建议用户验证：
  - 运行 `npm.cmd run config:check:local`。
  - 运行 `npm.cmd run config:check:test`。
  - 运行 `npm.cmd run config:check:production`。
  - 运行 `npm.cmd run test`、`npm.cmd run typecheck` 和 `npm.cmd run format:check`。

## 步骤 5：建立模块边界检查清单

- 状态：已完成。
- 实施内容：
  - 新增 `docs/module-boundaries.md`，明确后端会话、消息、知识库、AI 编排、检索、转人工、坐席、权限、报表、审计模块职责。
  - 在同一文档中明确 `web-widget`、`agent-console`、`admin-console`、`shared-ui`、`contracts` 的前端/共享边界。
  - 新增 `scripts/check-module-boundaries.mjs`，检查模块边界文档是否覆盖全部必需模块和前端区域，并阻止显式万能模块条目。
  - 在根 `package.json` 增加 `check:boundaries` 脚本。
- 边界说明：
  - 本步骤只建立开发文档和检查脚本。
  - 未实现任何业务模块代码。
- 我执行的验证：
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run test`，全部健康测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。

## 步骤 6：配置本地基础服务

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 新增根目录 `docker-compose.yml`，定义本地 PostgreSQL、Redis、后端 API、异步 worker 和前端静态服务编排。
  - PostgreSQL 使用 `pgvector/pgvector:pg16`，配置本地端口、默认数据库、默认账号、持久化卷和 `pg_isready` healthcheck。
  - Redis 使用 `redis:7-alpine`，开启 AOF 持久化，配置本地端口、持久化卷和 `redis-cli ping` healthcheck。
  - `api` 服务使用 `node:24-alpine`，挂载当前工作区，依赖 PostgreSQL 与 Redis 健康后启动，并覆盖容器内 `DATABASE_URL`、`REDIS_URL` 和 `VITE_API_BASE_URL`。
  - `worker` 服务使用 `node:24-alpine`，挂载当前工作区，依赖 PostgreSQL 与 Redis 健康后启动，并覆盖容器内数据库和 Redis 地址。
  - `static` 服务使用 `nginx:1.27-alpine`，通过 `infra/local/nginx.conf` 暴露后续 `web-widget`、`agent-console` 和 `admin-console` 构建产物。
  - 新增 `infra/local/README.md`，记录本地基础服务启动方式、profile 用法和当前步骤边界。
  - 新增 `infra/local/nginx.conf`，定义前端静态服务的本地 Nginx 路由。
  - 新增 `scripts/check-local-services.mjs`，静态检查本地服务编排是否包含必需服务、依赖关系、healthcheck 和静态资源路由。
  - 在根 `package.json` 增加 `check:local-services` 脚本。
- 边界说明：
  - 本步骤只建立本地服务编排和静态配置检查。
  - 未实现后端 HTTP 服务、worker 业务任务、前端构建产物或业务 API。
  - `api` 与 `worker` 服务命令指向后续步骤将补齐的开发脚本；当前默认只建议启动 `postgres` 和 `redis`。
  - 停止依赖后由后端健康检查报告不可用的验证属于步骤 12，本步骤仅为 PostgreSQL 和 Redis 定义容器 healthcheck。
  - 当前环境没有安装 `docker` 命令，无法在本机实际启动容器或执行 `docker compose config`。
- 我执行的验证：
  - 已运行 `docker --version`，当前环境返回 “无法将 docker 项识别为命令”，确认本机无法做容器启动验证。
  - 已运行 `docker compose version`，同样因未安装 `docker` 无法执行。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run test`，全部健康测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。

## 步骤 7：建立数据库迁移机制

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 为 `@znkfxt/api` 安装生产级 PostgreSQL 客户端依赖 `pg`。
  - 为 `@znkfxt/api` 安装迁移工具 `node-pg-migrate` 和类型依赖 `@types/pg`。
  - 新增 `apps/api/migration.config.json`，配置迁移目录、应用 schema、迁移历史表、SQL 迁移格式和顺序检查。
  - 新增 `apps/api/src/database/migrations/202604190001_create_app_schema_and_extensions.sql`，创建 `app` schema 并启用 `pgvector` 的 `vector` 扩展。
  - 新增 `apps/api/src/database/README.md`，说明数据库结构变更必须通过迁移文件管理。
  - 新增 `docs/database-migrations.md`，记录迁移工具、规则、命令和当前基础迁移。
  - 新增 `scripts/check-database-migrations.mjs`，静态检查迁移工具依赖、脚本、配置和迁移文件完整性。
  - 在根 `package.json` 增加 `db:migrate`、`db:migrate:test`、`db:migrate:down` 和 `check:migrations` 脚本。
  - 在 `apps/api/package.json` 增加对应迁移脚本和迁移创建脚本。
  - 更新 `.prettierignore`，忽略 SQL 迁移文件，避免 Prettier 因不支持 SQL parser 失败。
- 外部依赖标注：
  - 迁移执行能力来自成熟外部依赖 `node-pg-migrate`。
  - PostgreSQL 连接能力来自成熟外部依赖 `pg`。
  - 当前项目只保存迁移配置、迁移 SQL 文件和校验脚本，不生成迁移工具内部实现。
- 边界说明：
  - 本步骤只建立迁移机制和基础 schema/扩展迁移。
  - 未创建账号、角色、会话、消息、知识库、评价或审计业务表；这些属于步骤 8 到步骤 11。
  - 不允许手工改库作为长期方案，后续所有表结构变更都必须新增迁移文件。
  - 当前环境没有 Docker 和正在运行的 PostgreSQL，无法完成“空数据库执行迁移”和“全新数据库重复迁移”运行期验证。
- 我执行的验证：
  - 首次安装依赖时 npm 默认缓存目录 `C:\Program Files\nodejs\node_modules\npm-cache` 权限受限；改用项目内 `.npm-cache` 后安装成功。
  - 已运行 `npm.cmd run check:migrations`，迁移配置静态检查通过。
  - 已运行 `npm.cmd run db:migrate`，命令能正确加载 `config/env/.env.local.example`，但因本机 `127.0.0.1:5432` 和 `::1:5432` 没有 PostgreSQL 服务而返回 `ECONNREFUSED`。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run config:check:local`，本地环境配置校验通过。
  - 已运行 `npm.cmd run test`，全部健康测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。

## 步骤 8：创建账号与角色数据结构

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 新增 `apps/api/src/database/migrations/202604190002_create_accounts_and_roles.sql`。
  - 在迁移中创建 `app.accounts`，字段覆盖登录名、展示名、密码哈希、启用/禁用状态和创建更新时间。
  - 在迁移中创建 `app.roles`，用 `admin`、`knowledge_operator`、`agent` 表达管理员、知识库运营和坐席三类后台角色。
  - 在迁移中创建 `app.account_roles`，使用 `(account_id, role_id)` 复合主键表达同一账号可关联一个或多个后台角色。
  - 在迁移中启用 `pgcrypto`，使用 PostgreSQL `gen_random_uuid()` 生成账号和角色主键。
  - 新增 `apps/api/tests/account-role-migration.test.ts`，以迁移契约测试确认账号状态、三类角色和多角色关系结构存在。
  - 新增 `packages/contracts/src/auth.ts`，定义共享账号状态和后台角色代码类型。
  - 更新 `packages/contracts/src/index.ts`，导出账号状态和角色代码契约。
  - 更新 `docs/database-migrations.md` 与 `apps/api/src/database/README.md`，记录账号角色迁移和归属边界。
  - 更新 `scripts/check-database-migrations.mjs`，让迁移检查覆盖基础迁移与账号角色迁移，同时允许后续迁移不重复创建基础 schema。
- 外部依赖标注：
  - UUID 生成依赖 PostgreSQL 标准扩展能力 `pgcrypto`。
  - 迁移执行仍由外部依赖 `node-pg-migrate` 负责。
  - 当前项目没有实现密码哈希、登录、RBAC 校验或迁移框架内部逻辑。
- 边界说明：
  - 本步骤只创建后台账号、角色和账号角色关系的数据结构。
  - 访客仍按实施文档使用匿名身份，不创建访客账号表。
  - 未实现登录接口、密码校验、JWT、权限中间件、坐席在线状态或账号管理页面；这些属于后续步骤。
  - 当前环境没有 Docker 和正在运行的 PostgreSQL，无法执行真实数据库迁移或通过 SQL 查询检查表结构。
- 我执行的验证：
  - 已运行 `npm.cmd run check:migrations`，迁移配置和账号角色迁移静态检查通过。
  - 已运行 `npm.cmd run test:api`，账号角色迁移契约测试和既有 API 测试通过。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已再次运行 `npm.cmd run db:migrate`，命令加载迁移配置正常，但因本机 `127.0.0.1:5432` 和 `::1:5432` 没有 PostgreSQL 服务继续返回 `ECONNREFUSED`。

## 步骤 9：创建会话与消息数据结构

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 新增 `apps/api/src/database/migrations/202604190003_create_conversations_and_messages.sql`。
  - 在迁移中创建 `app.conversations`，字段覆盖访客标识、来源、会话状态、当前坐席账号、创建更新时间和关闭时间。
  - 会话状态包含 `bot_serving`、`handoff_pending_confirmation`、`waiting_agent`、`agent_serving`、`closed`，其中 `handoff_pending_confirmation` 是用户已确认需要新增的“待确认转人工”状态。
  - 在迁移中用约束确保关闭状态必须有 `closed_at`，非关闭状态不得提前写入 `closed_at`。
  - 在迁移中创建 `app.messages`，字段覆盖会话 ID、发送者类型、发送者 ID、消息类型、消息内容和发送时间。
  - 消息发送者类型包含 `visitor`、`bot`、`agent`、`system`，消息类型包含 `text` 和 `system`。
  - 新增按会话正序查询消息的索引 `messages_conversation_created_at_idx`。
  - 新增 `apps/api/tests/conversation-message-migration.test.ts`，以迁移契约测试验证会话状态、关闭时间约束、消息发送者类型和消息排序索引。
  - 新增 `packages/contracts/src/conversation.ts`，定义共享会话状态、来源、消息发送者类型和消息类型契约。
  - 更新 `packages/contracts/src/index.ts`，导出会话与消息契约。
  - 更新 `docs/database-migrations.md`、`apps/api/src/database/README.md` 和 `scripts/check-database-migrations.mjs`，记录并检查会话消息迁移。
- 边界说明：
  - 本步骤只创建会话与消息数据结构。
  - 未实现访客匿名标识生成、创建会话接口、发送消息接口、查询消息接口、关闭会话逻辑或转人工业务流程。
  - `assigned_agent_account_id` 引用步骤 8 的后台账号表，但不在数据库层强制账号必须拥有 `agent` 角色；角色权限校验属于后续 RBAC 逻辑。
  - 当前环境没有 Docker 和正在运行的 PostgreSQL，无法执行真实数据库迁移或通过 SQL 查询验证消息排序。
- 我执行的验证：
  - 已运行 `npm.cmd run check:migrations`，迁移配置和会话消息迁移静态检查通过。
  - 已运行 `npm.cmd run test:api`，会话消息迁移契约测试和既有 API 测试通过。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已再次运行 `npm.cmd run db:migrate`，命令加载迁移配置正常，但因本机 `127.0.0.1:5432` 和 `::1:5432` 没有 PostgreSQL 服务继续返回 `ECONNREFUSED`。

## 步骤 10：创建知识库数据结构

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 新增 `apps/api/src/database/migrations/202604190004_create_knowledge_base.sql`。
  - 在迁移中创建 `app.knowledge_categories`，字段覆盖分类名称、slug、启用/禁用状态、创建/更新账号和创建更新时间。
  - 在迁移中创建 `app.knowledge_tags`，用于维护知识条目标签。
  - 在迁移中创建 `app.knowledge_articles`，支持 `faq` 和 `document` 两类知识内容，字段覆盖标题、正文、分类、关键词、草稿/启用/停用状态、创建/更新账号、创建更新时间和 `deleted_at`。
  - 在迁移中创建 `app.knowledge_article_tags`，表达知识条目和标签的多对多关系。
  - 新增可用知识过滤索引 `knowledge_articles_enabled_idx`，确保后续检索可以只读取 `enabled` 且未删除的知识条目。
  - 新增关键词 GIN 索引和 PostgreSQL full text GIN 索引，为后续关键词检索和全文检索步骤提供数据基础。
  - 新增 `apps/api/tests/knowledge-migration.test.ts`，以迁移契约测试验证分类状态、知识类型、知识状态、标签关系和可用知识过滤条件。
  - 新增 `packages/contracts/src/knowledge.ts`，定义共享知识分类状态、知识条目类型和知识条目状态契约。
  - 更新 `packages/contracts/src/index.ts`，导出知识库契约。
  - 更新 `docs/database-migrations.md`、`apps/api/src/database/README.md` 和 `scripts/check-database-migrations.mjs`，记录并检查知识库迁移。
- 外部依赖标注：
  - 全文检索能力依赖 PostgreSQL `to_tsvector` 与 GIN 索引能力。
  - 迁移执行仍由外部依赖 `node-pg-migrate` 负责。
  - 当前项目没有实现检索算法、向量化、导入导出、知识 CRUD API 或迁移框架内部逻辑。
- 边界说明：
  - 本步骤只创建知识库数据结构。
  - `deleted_at` 只作为后续“删除知识”能力的数据字段预留，本步骤不实现删除接口或软删除业务流程。
  - 未实现知识分类管理、知识条目创建/编辑/启停/查询接口；这些属于步骤 17 到步骤 21。
  - 未实现知识导入导出；该能力已按用户确认纳入 MVP 补充范围，后续进入对应知识库管理步骤时实现。
  - 未实现机器人检索、关键词召回、向量召回或 AI 回答生成；这些属于后续检索与 AI 编排步骤。
  - 当前环境没有 Docker 和正在运行的 PostgreSQL，无法执行真实数据库迁移或通过 SQL 查询验证启用/停用过滤结果。
- 我执行的验证：
  - 已运行 `npm.cmd run check:migrations`，迁移配置和知识库迁移静态检查通过。
  - 已运行 `npm.cmd run test:api`，知识库迁移契约测试和既有 API 测试通过。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已再次运行 `npm.cmd run db:migrate`，命令加载迁移配置正常，但因本机 `127.0.0.1:5432` 和 `::1:5432` 没有 PostgreSQL 服务继续返回 `ECONNREFUSED`。

## 步骤 11：创建评价与审计数据结构

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 新增 `apps/api/src/database/migrations/202604190005_create_ratings_and_audit_logs.sql`。
  - 在迁移中创建 `app.satisfaction_ratings`，字段覆盖会话 ID、访客标识、1 到 5 分评分、可选评价内容和创建时间。
  - 在评价表中增加 `satisfaction_ratings_conversation_unique`，约束同一会话只能提交一次满意度评价。
  - 在评价表中增加评分范围、访客标识非空和非空评价内容约束，并增加按创建时间查询的索引。
  - 在迁移中创建 `app.audit_logs`，字段覆盖操作者账号、操作者角色、动作、目标类型、目标 ID、JSON 元数据和创建时间。
  - 审计动作先覆盖 `knowledge_article_created`、`knowledge_article_updated`、`knowledge_article_enabled`、`knowledge_article_disabled` 和 `agent_conversation_closed`。
  - 在审计表中增加角色、动作、目标类型、动作目标一致性和 metadata 必须为 JSON object 的约束。
  - 为审计表增加创建时间、操作者、目标和动作查询索引。
  - 新增 `apps/api/tests/rating-audit-migration.test.ts`，以迁移契约测试验证会话单次评价、评分范围、审计动作、审计目标和 metadata 结构。
  - 新增 `packages/contracts/src/feedback.ts`，定义共享满意度评分契约。
  - 新增 `packages/contracts/src/audit.ts`，定义共享审计操作者角色、审计动作和审计目标类型契约。
  - 更新 `packages/contracts/src/index.ts`，导出评价与审计契约。
  - 更新 `docs/database-migrations.md`、`apps/api/src/database/README.md` 和 `scripts/check-database-migrations.mjs`，记录并检查评价与审计迁移。
- 外部依赖标注：
  - JSON 元数据约束和索引依赖 PostgreSQL `jsonb`、CHECK 约束和 B-tree 索引能力。
  - 迁移执行仍由外部依赖 `node-pg-migrate` 负责。
  - 当前项目没有实现评价提交接口、审计写入服务、知识状态变更业务逻辑或坐席结束会话业务逻辑。
- 边界说明：
  - 本步骤只创建满意度评价和基础审计记录的数据结构。
  - 审计动作按实施文档先覆盖知识条目新增、编辑、启用、停用和坐席结束会话；知识删除审计可在后续删除知识功能落地时通过新迁移扩展。
  - 未实现评价 API、会话结束后展示评价入口、后台评价查询或满意度统计；这些属于后续前端、接口和指标步骤。
  - 未实现知识新增/编辑/启停 API 或坐席结束会话 API，因此本步骤只提供审计落库结构，不生成业务审计记录。
  - 当前环境没有 Docker 和正在运行的 PostgreSQL，无法执行真实数据库迁移或通过 SQL 查询验证评价和审计记录。
- 我执行的验证：
  - 已运行 `npm.cmd run check:migrations`，迁移配置和评价审计迁移静态检查通过。
  - 已运行 `npm.cmd run test:api`，评价审计迁移契约测试和既有 API 测试通过。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已再次运行 `npm.cmd run db:migrate`，命令加载迁移配置正常，但因本机 `127.0.0.1:5432` 和 `::1:5432` 没有 PostgreSQL 服务继续返回 `ECONNREFUSED`。

## 步骤 12：实现后端健康检查

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 为 `@znkfxt/api` 安装成熟外部依赖 `express` 和 `ioredis`，分别用于最小 HTTP 路由层和 Redis 真实连接探测。
  - 为 `@znkfxt/api` 安装测试依赖 `supertest`、`@types/express` 和 `@types/supertest`，用于 HTTP 健康检查路由测试。
  - 在 API 工作区新增 `dev` 和 `start` 脚本，在根目录新增 `dev:api` 和 `start:api` 脚本。
  - 新增 `apps/api/src/config/runtime-environment.ts`，运行时加载本地示例环境或当前进程环境，并复用既有环境配置校验。
  - 新增 `apps/api/src/health/health.types.ts`，定义健康检查状态、依赖检查结果和整体健康报告结构。
  - 新增 `apps/api/src/health/dependency-checks.ts`，使用 `pg` 执行 `SELECT 1` 检查 PostgreSQL，使用 `ioredis` 执行 `PING` 检查 Redis，并展开底层连接错误。
  - 新增 `apps/api/src/health/health.service.ts`，编排应用、数据库和 Redis 健康状态，任一依赖失败时整体状态为 `degraded`。
  - 新增 `apps/api/src/health/health.router.ts`，暴露 `GET /health`；全部依赖正常返回 HTTP 200，任一依赖异常返回 HTTP 503。
  - 新增 `apps/api/src/server.ts` 和 `apps/api/src/main.ts`，建立最小后端 HTTP 启动入口。
  - 更新 `apps/api/src/index.ts`，导出健康检查服务、类型和服务创建入口。
  - 新增 `apps/api/tests/health-service.test.ts` 和 `apps/api/tests/health-route.test.ts`，覆盖健康报告聚合、依赖异常报告、HTTP 200 和 HTTP 503。
  - 更新 `README.md` 和 `apps/api/README.md`，说明当前已有基础健康检查能力，并修正后续连续实施规则。
- 外部依赖标注：
  - HTTP 路由能力来自成熟外部依赖 `express`。
  - PostgreSQL 真实连接探测来自成熟外部依赖 `pg`。
  - Redis 真实连接探测来自成熟外部依赖 `ioredis`。
  - HTTP 路由测试能力来自成熟外部依赖 `supertest`。
  - 当前项目只编写健康检查编排、错误整形和路由胶水代码，不实现数据库客户端、Redis 客户端或 HTTP 框架内部逻辑。
- 边界说明：
  - 本步骤只实现后端健康检查。
  - 未实现统一错误响应、请求日志、关联标识、登录、RBAC、业务 API、数据库访问层或 Redis 业务队列。
  - `GET /health` 会主动连接 PostgreSQL 和 Redis；当前本机未运行依赖时返回 `degraded` 和 HTTP 503 是预期行为。
  - 当前 HTTP 层为最小健康检查入口；后续业务接口仍需按模块边界继续拆分。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，健康检查服务、路由测试和既有 API 测试通过。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `npm.cmd run config:check:local`，本地环境配置校验通过。
  - 已运行内联 Node 启动 `createApiServer()` 并请求 `GET /health`；当前无 PostgreSQL 和 Redis，因此返回 HTTP 503，响应中 `application.status = ok`，`database` 和 `redis` 均明确报告 `ECONNREFUSED`。

## 步骤 13：实现统一错误响应

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 新增 `packages/contracts/src/error.ts`，定义共享错误码和统一错误响应结构。
  - 更新 `packages/contracts/src/index.ts`，导出错误响应契约。
  - 新增 `apps/api/src/errors/api-error.ts`，定义 `ApiError` 基类以及 `BadRequestError`、`UnauthenticatedError`、`ForbiddenError`、`NotFoundError`、`ConflictError`。
  - 新增 `apps/api/src/errors/error.middleware.ts`，定义错误归一化、404 处理和 Express 错误响应中间件。
  - 更新 `apps/api/src/server.ts`，在健康检查和测试扩展路由之后接入 404 中间件和统一错误处理中间件。
  - 更新 `apps/api/src/index.ts`，导出错误类和错误中间件。
  - 新增 `apps/api/tests/error-response.test.ts`，通过临时测试路由覆盖参数错误、未登录、无权限、资源不存在、状态冲突和系统异常。
- 统一错误响应格式：
  - `error.code`：`BAD_REQUEST`、`UNAUTHENTICATED`、`FORBIDDEN`、`NOT_FOUND`、`CONFLICT` 或 `INTERNAL_ERROR`。
  - `error.message`：可读错误信息。
  - `error.statusCode`：对应 HTTP 状态码。
  - `error.details`：可选结构化详情，仅在显式提供时返回。
- 边界说明：
  - 本步骤只建立统一错误响应格式和 HTTP 错误处理中间件。
  - 未实现请求日志、关联标识、鉴权解析、权限策略、业务接口或错误事件审计；这些属于后续步骤。
  - 系统异常统一返回 `Internal server error.`，不向客户端暴露原始异常堆栈或敏感内容。
  - `GET /health` 的依赖健康报告仍按步骤 12 的健康检查结构返回，不改成业务错误格式。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，统一错误响应测试和既有 API 测试通过。
  - 已运行 `npm.cmd run test`，全部测试通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。

## 步骤 14：实现请求日志与关联标识

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 为 `@znkfxt/api` 安装成熟外部日志依赖 `pino`，用于生产级结构化日志输出。
  - 新增 `apps/api/src/logging/logger.ts`，定义 API 内部最小 `AppLogger` 适配接口，并由 `pino` 承担真实日志输出能力。
  - 新增 `apps/api/src/logging/request-context.ts`，定义请求上下文、`x-request-id` 头名称、请求 ID 读写工具。
  - 新增 `apps/api/src/logging/request-context.middleware.ts`，优先复用客户端传入的 `x-request-id`，缺失时使用 `crypto.randomUUID()` 生成，并写回响应头。
  - 新增 `apps/api/src/logging/request-logging.middleware.ts`，在每个请求开始和响应完成时记录结构化日志，字段包含 `requestId`、方法、路径、响应状态和耗时。
  - 更新 `apps/api/src/errors/error.middleware.ts`，错误日志统一记录 `requestId`、错误码、HTTP 状态、请求路径和异常对象；错误响应体同步包含 `error.requestId`，便于客户端与服务端日志关联。
  - 更新 `packages/contracts/src/error.ts`，在共享错误响应契约中增加可选 `requestId` 字段。
  - 更新 `apps/api/src/server.ts`，按顺序装配请求上下文中间件、请求日志中间件、JSON 解析、健康检查、业务扩展路由、404 和错误处理中间件。
  - 更新 `apps/api/src/index.ts`，导出日志模块入口。
  - 新增 `apps/api/tests/request-logging.test.ts`，覆盖生成请求 ID、复用传入请求 ID、成功请求日志和失败请求错误日志。
  - 更新既有健康检查与错误响应测试，使用测试 logger 避免测试输出噪音，并校验错误响应携带 `requestId`。
- 外部依赖标注：
  - 结构化日志输出能力来自成熟外部依赖 `pino`。
  - 请求 ID 生成使用 Node.js 标准库 `crypto.randomUUID()`。
  - HTTP 中间件编排仍基于外部依赖 `express`。
  - 当前项目仅编写请求上下文、日志调用和错误响应关联的胶水代码，不重写日志库、HTTP 框架或随机 ID 生成逻辑。
- 请求关联格式：
  - 请求头：`x-request-id`。
  - 成功请求日志：`request.start` 和 `request.finish`。
  - 失败请求日志：`request.error`，并在 `request.finish` 中记录最终 HTTP 状态。
  - 错误响应：`error.requestId` 与响应头 `x-request-id` 保持一致。
- 边界说明：
  - 本步骤只实现请求日志与关联标识。
  - 未实现登录、JWT、RBAC、业务审计事件、业务 API、数据库访问层或 Redis 业务队列；这些属于后续步骤。
  - `GET /health` 仍按健康检查结构返回；请求日志只包裹该路由，不改变健康检查响应结构。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，10 个 API 测试文件、31 个测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 健康测试全部通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行内联 Node 启动 `createApiServer()` 并请求 `GET /health`，传入 `x-request-id: manual-check-step-14` 后响应头回传同一值；当前无 PostgreSQL 和 Redis，因此 `/health` 返回 HTTP 503 与 `ECONNREFUSED` 仍为预期依赖异常验证结果。
## 步骤 15：实现后台登录

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 为 `@znkfxt/api` 安装成熟外部依赖 `bcryptjs`、`jsonwebtoken` 和 `@types/jsonwebtoken`，分别用于密码哈希校验、JWT 签发和 TypeScript 类型支持。
  - 更新 `packages/contracts/src/auth.ts`，新增 `LoginRequest`、`AuthenticatedAccount` 和 `LoginResponse` 共享契约。
  - 更新 `packages/contracts/package.json`，为共享契约包增加 ESM `exports`，确保运行期可以直接加载完整契约源码，而不是复制枚举常量到 API。
  - 新增 `apps/api/src/auth/account.repository.ts`，通过 `pg` 从 `app.accounts`、`app.account_roles` 和 `app.roles` 读取真实后台账号、密码哈希、启用状态和角色。
  - 新增 `apps/api/src/auth/password-verifier.ts`，用 `bcryptjs.compare` 校验明文密码与数据库中的 bcrypt 哈希。
  - 新增 `apps/api/src/auth/access-token.ts`，用 `jsonwebtoken.sign` 签发 Bearer JWT，令牌载荷包含账号 ID、登录名、展示名和后台角色。
  - 新增 `apps/api/src/auth/auth.service.ts`，编排后台登录流程：参数检查、账号查询、密码校验、禁用账号拦截、角色检查和令牌签发。
  - 新增 `apps/api/src/auth/auth.router.ts`，暴露 `POST /api/auth/login`。
  - 更新 `apps/api/src/server.ts`，在健康检查之后、业务扩展路由之前装配认证路由；默认运行时从环境配置创建真实 PostgreSQL 仓储和 JWT 签发器。
  - 更新 `apps/api/src/index.ts`，导出认证模块入口。
  - 新增 `apps/api/tests/auth-login.test.ts`，覆盖正确账号登录、错误密码失败和禁用账号失败。
  - 更新 `README.md` 与 `apps/api/README.md`，记录当前已具备后台登录能力和外部依赖来源。
- 外部依赖标注：
  - 密码哈希校验能力来自成熟外部依赖 `bcryptjs`，当前项目只调用其 `compare` 能力，不实现密码算法。
  - JWT 签发能力来自成熟外部依赖 `jsonwebtoken`，当前项目只进行令牌载荷组装和签发调用，不实现 JWT 算法。
  - HTTP 路由能力来自成熟外部依赖 `express`。
  - PostgreSQL 查询能力来自成熟外部依赖 `pg`。
  - 请求体校验继续复用成熟外部依赖 `zod`。
- 登录接口格式：
  - 请求：`POST /api/auth/login`，JSON body 包含 `loginName` 与 `password`。
  - 成功响应：`accessToken`、`tokenType = Bearer`、`expiresInSeconds` 和 `account`。
  - 错误密码或不存在账号：统一返回 `UNAUTHENTICATED`。
  - 禁用账号且密码正确：返回 `FORBIDDEN`，消息为 `Account is disabled.`。
- 边界说明：
  - 本步骤只实现后台账号登录。
  - 未实现 JWT 解析中间件、当前用户上下文、RBAC 权限校验、账号管理、刷新令牌、密码修改、登录审计或前端登录页；这些属于后续步骤。
  - 登录依赖步骤 8 已创建的 `accounts`、`roles` 和 `account_roles` 表；当前不新增迁移、不写种子账号、不绕过数据库读取。
  - 当前环境没有正在运行的 PostgreSQL，因此无法用真实数据库账号完成端到端登录；本步骤通过路由测试验证登录编排、bcrypt 校验和 JWT 签发，数据库查询实现由 `pg` 仓储提供。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，11 个 API 测试文件、34 个测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 健康测试全部通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行内联 Node 加载 `JwtAccessTokenIssuer` 并签发测试 JWT，确认真实 Node `--experimental-strip-types` 入口可加载 `jsonwebtoken`。
  - 已运行内联 Node 加载 `createApiServer()`，确认服务器模块在真实 Node `--experimental-strip-types` 入口可加载。

## 步骤 16：实现角色权限校验

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 更新 `packages/contracts/src/auth.ts`，新增后台权限代码契约：`account:manage`、`knowledge:read`、`knowledge:write`、`conversation:read`、`conversation:handle` 和 `metrics:read`。
  - 更新 `apps/api/src/auth/access-token.ts`，在 JWT 载荷中写入账号状态，并新增 `JwtAccessTokenVerifier`，通过外部依赖 `jsonwebtoken` 验证 Bearer JWT，通过外部依赖 `zod` 校验令牌载荷结构。
  - 新增 `apps/api/src/auth/authenticated-account.ts`，通过 Express Request 扩展保存当前认证账号，供后续业务路由读取。
  - 新增 `apps/api/src/auth/auth.middleware.ts`，实现 Bearer 认证中间件，解析 `Authorization` 请求头、调用真实 JWT 校验器并写入当前账号上下文。
  - 新增 `apps/api/src/auth/permissions.ts`，实现 RBAC 权限映射与权限中间件：管理员拥有全部后台权限，知识库运营拥有知识库维护、会话查看和指标查看权限，坐席拥有会话处理权限。
  - 更新 `apps/api/src/index.ts`，导出认证中间件、当前账号上下文和权限策略入口。
  - 新增 `apps/api/tests/rbac.test.ts`，通过测试扩展路由验证坐席访问知识库编辑路由失败、知识库运营访问知识库编辑路由成功、未登录访问后台受保护路由失败、坐席访问会话处理路由成功，并验证管理员拥有全部后台权限。
  - 更新 `README.md`、`apps/api/README.md` 和 `memory/architecture.md`，记录 RBAC 能力、外部依赖来源和当前边界。
- 外部依赖标注：
  - JWT 签发和校验能力来自成熟外部依赖 `jsonwebtoken`，当前项目只组装/解析请求并调用其真实实现，不实现 JWT 算法。
  - JWT 载荷结构校验复用成熟外部依赖 `zod`，当前项目只定义 schema 和错误归一化。
  - HTTP 中间件编排来自成熟外部依赖 `express`。
  - 当前项目只编写认证上下文、角色权限映射和中间件胶水代码，不实现 HTTP 框架、JWT 库或业务接口内部逻辑。
- 权限边界：
  - `admin`：拥有 `account:manage`、`knowledge:read`、`knowledge:write`、`conversation:read`、`conversation:handle` 和 `metrics:read`。
  - `knowledge_operator`：拥有 `knowledge:read`、`knowledge:write`、`conversation:read` 和 `metrics:read`。
  - `agent`：拥有 `conversation:handle`。
- 边界说明：
  - 本步骤只实现 JWT 解析、当前账号上下文和 RBAC 权限校验。
  - 未提前实现知识库分类管理、知识条目创建/编辑/启停/查询、坐席接入或会话处理业务接口；这些仍按步骤 17 及后续步骤推进。
  - RBAC 测试中的知识库编辑和会话处理路由通过 `createApiServer` 的测试扩展路由挂载，只用于验证真实中间件，不作为生产占位接口暴露。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，12 个 API 测试文件、39 个测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 健康测试全部通过。
  - 首次运行 `npm.cmd run format:check` 时发现 3 个新增/修改文件需要格式化；已运行 `npm.cmd exec prettier -- --write apps/api/src/auth/access-token.ts apps/api/src/auth/authenticated-account.ts apps/api/tests/rbac.test.ts` 修复，并再次运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行内联 Node `--experimental-strip-types` 签发并校验测试 JWT，确认真实 Node 入口可加载 `JwtAccessTokenIssuer` 和 `JwtAccessTokenVerifier` 并完成 `jsonwebtoken` 校验。

## 步骤 17：实现知识分类管理

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 更新 `packages/contracts/src/knowledge.ts`，新增 `KnowledgeCategory`、`CreateKnowledgeCategoryRequest`、`UpdateKnowledgeCategoryRequest` 和 `ListKnowledgeCategoriesResponse` 共享契约。
  - 更新 `apps/api/src/auth/authenticated-account.ts`，新增 `requireAuthenticatedAccount`，供已通过认证和权限校验的业务路由读取当前账号。
  - 新增 `apps/api/src/knowledge/category.repository.ts`，使用成熟外部依赖 `pg` 直接读写 `app.knowledge_categories`，覆盖分类创建、编辑、停用、按 ID 查询和按状态列表查询，并把 PostgreSQL slug 唯一约束冲突转换为明确仓储错误。
  - 新增 `apps/api/src/knowledge/category.service.ts`，编排知识分类创建、编辑、查询、停用、slug 冲突归一化，以及 `ensureCategoryCanBeUsedForNewArticle`，确保停用分类不能作为后续新建知识条目的可选分类。
  - 新增 `apps/api/src/knowledge/category.router.ts`，暴露知识分类管理 API：`GET /api/admin/knowledge/categories`、`POST /api/admin/knowledge/categories`、`PUT /api/admin/knowledge/categories/:id`、`POST /api/admin/knowledge/categories/:id/disable`。
  - 更新 `apps/api/src/server.ts`，在运行时环境存在时装配真实 PostgreSQL 知识分类服务和 Bearer JWT 校验器；测试环境可显式注入服务和校验器。
  - 更新 `apps/api/src/index.ts`，导出知识分类仓储、服务和路由入口。
  - 新增 `apps/api/tests/knowledge-category.test.ts`，覆盖创建后查询、编辑、停用后不再出现在启用分类查询中、禁用分类不能用于新知识条目、重复 slug 冲突、坐席无权访问和未登录访问失败。
  - 更新 `README.md`、`apps/api/README.md` 和 `memory/architecture.md`，记录当前分类管理能力、外部依赖来源和边界。
- 外部依赖标注：
  - 数据库读写能力来自成熟外部依赖 `pg`，当前项目只编写 SQL 调用和记录映射，不实现 PostgreSQL 客户端内部逻辑。
  - HTTP 路由能力来自成熟外部依赖 `express`。
  - 请求体验证来自成熟外部依赖 `zod`。
  - Bearer JWT 校验来自成熟外部依赖 `jsonwebtoken`，并复用步骤 16 的认证与 RBAC 中间件。
- 接口边界：
  - `GET /api/admin/knowledge/categories`：查询分类，可用 `status=enabled|disabled` 过滤。
  - `POST /api/admin/knowledge/categories`：创建分类，默认 `enabled`。
  - `PUT /api/admin/knowledge/categories/:id`：编辑分类名称和 slug。
  - `POST /api/admin/knowledge/categories/:id/disable`：停用分类，不修改历史知识条目。
- 边界说明：
  - 本步骤只实现知识分类管理。
  - 未实现知识条目创建、编辑、启停、查询、导入导出、审计写入或检索；这些仍按步骤 18 及后续步骤推进。
  - 当前环境没有正在运行的 PostgreSQL，因此无法执行真实数据库写入的端到端验证；生产代码路径已经使用 `pg` 仓储，接口测试通过仓储契约驱动服务和真实 Express/JWT/RBAC 中间件验证业务编排。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，13 个 API 测试文件、44 个测试全部通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 健康测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 并行验证过程中 `npm.cmd run test` 曾在沙箱复制路径下触发一次 web-widget 绝对路径解析失败；随后单独运行 `npm.cmd run test:web-widget`、`npm.cmd run test:e2e` 并再次运行 `npm.cmd run test` 均通过，确认不是本步骤代码失败。

## 步骤 18：实现知识条目创建

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 更新 `packages/contracts/src/knowledge.ts`，新增 `KnowledgeArticle` 和 `CreateKnowledgeArticleRequest` 共享契约，覆盖 FAQ/文档类型、标题、正文、分类、关键词、标签和草稿/启用/停用状态。
  - 更新 `packages/contracts/src/audit.ts`，新增 `AuditLog` 共享审计记录实体。
  - 新增 `apps/api/src/audit/audit.repository.ts`，使用成熟外部依赖 `pg` 写入 `app.audit_logs` 并映射真实审计记录。
  - 新增 `apps/api/src/knowledge/article.repository.ts`，使用成熟外部依赖 `pg` 在事务中写入 `app.knowledge_articles`、`app.knowledge_tags` 和 `app.knowledge_article_tags`，不实现 PostgreSQL 客户端内部逻辑。
  - 新增 `apps/api/src/knowledge/article.service.ts`，编排知识条目创建：修剪输入、复用分类可用性检查、调用文章仓储、写入 `knowledge_article_created` 审计记录。
  - 新增 `apps/api/src/knowledge/article.router.ts`，暴露 `POST /api/admin/knowledge/articles`，复用 Bearer JWT 认证、RBAC `knowledge:write` 权限和 `zod` 请求体验证。
  - 更新 `apps/api/src/server.ts`，在运行时环境存在时装配真实 PostgreSQL 知识条目服务；测试环境可显式注入服务和 JWT 校验器。
  - 更新 `apps/api/src/index.ts`，导出审计仓储、知识条目仓储、服务和路由入口。
  - 新增 `apps/api/tests/knowledge-article-create.test.ts`，覆盖合法数据创建、标题缺失失败、正文缺失失败、停用分类拒绝创建、坐席无权创建，以及创建成功后的审计记录存在。
  - 更新 `README.md`、`apps/api/README.md` 和 `memory/architecture.md`，记录当前知识条目创建能力、外部依赖来源和边界。
- 外部依赖标注：
  - 数据库读写能力来自成熟外部依赖 `pg`，当前项目只编写 SQL 调用、事务编排和记录映射，不实现 PostgreSQL 客户端内部逻辑。
  - HTTP 路由能力来自成熟外部依赖 `express`。
  - 请求体验证来自成熟外部依赖 `zod`。
  - Bearer JWT 校验来自成熟外部依赖 `jsonwebtoken`，并复用步骤 16 的认证与 RBAC 中间件。
  - 分类状态判断复用步骤 17 的 `KnowledgeCategoryService.ensureCategoryCanBeUsedForNewArticle`，不在知识条目模块重写同类逻辑。
- 接口边界：
  - `POST /api/admin/knowledge/articles`：创建知识条目，支持 `articleType`、`title`、`content`、`categoryId`、`keywords`、`tagNames` 和 `status`。
  - 标题和正文缺失或为空白时返回 `BAD_REQUEST`。
  - 停用分类作为新条目分类时返回 `CONFLICT`。
  - 创建成功后返回知识条目实体，并写入 `knowledge_article_created` 审计记录。
- 边界说明：
  - 本步骤只实现知识条目创建。
  - 未实现知识条目编辑、启停、查询、导入导出、删除、检索、向量化或 AI 回答生成；这些仍按步骤 19 及后续步骤推进。
  - 当前环境没有正在运行的 PostgreSQL，因此无法执行真实数据库写入的端到端验证；生产代码路径已经使用 `pg` 仓储，接口测试通过仓储契约驱动服务和真实 Express/JWT/RBAC 中间件验证业务编排。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，14 个 API 测试文件、48 个测试全部通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 首次运行 `npm.cmd run format:check` 发现 `apps/api/src/audit/audit.repository.ts` 需要格式化；已运行 `npm.cmd exec prettier -- --write ...` 修复。
  - 后续并行运行 `npm.cmd run format:check` 时曾触发一次 Prettier 对当前目录符号链接的异常；随后单独重跑 `npm.cmd run format:check` 通过，确认格式本身无问题。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `git diff --check`，未发现空白错误；仅出现 Windows 换行提示。

## 步骤 19：实现知识条目编辑

- 状态：已完成，按用户最新要求继续后续步骤，不等待人工测试确认。
- 实施内容：
  - 更新 `packages/contracts/src/knowledge.ts`，新增 `UpdateKnowledgeArticleRequest` 共享契约，允许修改标题、正文、分类、关键词、标签和状态。
  - 更新 `apps/api/src/knowledge/article.repository.ts`，在生产 `pg` 仓储中新增 `updateArticle`，通过事务更新 `app.knowledge_articles` 并按请求替换 `app.knowledge_article_tags` 关联。
  - 更新 `apps/api/src/knowledge/article.service.ts`，新增知识条目编辑编排：校验至少一个可编辑字段、修剪标题/正文、归一化关键词/标签、复用分类可用性检查、处理不存在条目并写入 `knowledge_article_updated` 审计记录。
  - 更新 `apps/api/src/knowledge/article.router.ts`，新增 `PUT /api/admin/knowledge/articles/:id`，复用 Bearer JWT 认证、RBAC `knowledge:write` 权限和 `zod` 请求体验证。
  - 更新 `apps/api/tests/knowledge-article-create.test.ts`，新增编辑接口测试，覆盖编辑后返回内容与仓储结果一致、每次编辑生成审计记录、空编辑请求失败、停用分类拒绝和坐席无权编辑。
  - 更新 `README.md`、`apps/api/README.md` 和 `memory/architecture.md`，记录当前知识条目编辑能力、外部依赖来源和边界。
- 外部依赖标注：
  - 数据库读写能力来自成熟外部依赖 `pg`，当前项目只编写 SQL 调用、事务编排和记录映射，不实现 PostgreSQL 客户端内部逻辑。
  - HTTP 路由能力来自成熟外部依赖 `express`。
  - 请求体验证来自成熟外部依赖 `zod`。
  - Bearer JWT 校验来自成熟外部依赖 `jsonwebtoken`，并复用步骤 16 的认证与 RBAC 中间件。
  - 分类存在性与启停状态判断继续复用步骤 17 的 `KnowledgeCategoryService.ensureCategoryCanBeUsedForNewArticle`，不在知识条目模块重写同类逻辑。
- 接口边界：
  - `PUT /api/admin/knowledge/articles/:id`：编辑知识条目，支持 `title`、`content`、`categoryId`、`keywords`、`tagNames` 和 `status`。
  - 编辑请求至少需要一个可编辑字段。
  - 标题或正文传入空白值时返回 `BAD_REQUEST`。
  - 停用分类作为新分类时返回 `CONFLICT`。
  - 不存在或已软删除的条目返回 `NOT_FOUND`。
  - 编辑成功后返回更新后的知识条目实体，并写入 `knowledge_article_updated` 审计记录。
- 边界说明：
  - 本步骤只实现知识条目编辑。
  - 未实现知识条目启停专用入口、列表查询、删除、导入导出、检索、向量化或 AI 回答生成；这些仍按步骤 20 及后续步骤推进。
  - 当前环境没有正在运行的 PostgreSQL，因此无法执行真实数据库写入的端到端验证；生产代码路径已经使用 `pg` 仓储，接口测试通过仓储契约驱动服务和真实 Express/JWT/RBAC 中间件验证业务编排。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，14 个 API 测试文件、51 个测试全部通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 首次运行 `npm.cmd run format:check` 发现 `apps/api/src/knowledge/article.service.ts` 需要格式化；已运行 `npm.cmd exec prettier -- --write ...` 修复。
  - 再次运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `git diff --check`，未发现空白错误；仅出现 Windows 换行提示。

## 步骤 20：实现知识条目启停

- 状态：已完成（代码已在步骤 18-19 中一并实现，现补记文档）。
- 实施内容：
  - `KnowledgeArticleService.setArticleStatus(id, status, actor)` 已在 `article.service.ts` 中实现，支持 `enabled` 和 `disabled` 状态切换。
  - `POST /api/admin/knowledge/articles/:id/enable` 和 `POST /api/admin/knowledge/articles/:id/disable` 路由已在 `article.router.ts` 中实现，复用 Bearer JWT 认证和 RBAC `knowledge:write` 权限。
  - 启用条目出现在可检索列表中，停用条目不出现在可检索列表中；测试覆盖启用后可回答、禁用后不可回答的完整路径。
  - 停用操作写入 `knowledge_article_disabled` 审计记录，启用操作写入 `knowledge_article_enabled` 审计记录。
- 接口边界：
  - `POST /api/admin/knowledge/articles/:id/enable`：将知识条目状态设为 `enabled`。
  - `POST /api/admin/knowledge/articles/:id/disable`：将知识条目状态设为 `disabled`。
  - 不存在或已软删除的条目返回 `NOT_FOUND`。
- 我执行的验证：
  - 运行 `npm.cmd run test:api`，15 个 API 测试文件、55 个测试全部通过，其中 `knowledge-article-create.test.ts` 包含启停专用测试和启停后问答可见性验证。
  - 运行 `npm.cmd run typecheck`，类型检查通过。
  - 运行 `npm.cmd run format:check`，格式检查通过。

## 步骤 21：实现知识条目查询

- 状态：已完成（代码已在步骤 18-19 中一并实现，现补记文档）。
- 实施内容：
  - `KnowledgeArticleService.listArticles(filter)` 已在 `article.service.ts` 中实现，支持按标题、分类、标签和状态过滤。
  - `GET /api/admin/knowledge/articles` 路由已在 `article.router.ts` 中实现，支持 `title`、`categoryId`、`status`、`tagName`、`limit` 和 `offset` 查询参数。
  - `PgKnowledgeArticleRepository.listArticles` 使用 PostgreSQL 参数化查询，通过 `ILIKE` 模糊匹配标题、精确匹配分类和状态、`EXISTS` 子查询过滤标签。
  - 测试覆盖分页查询和多条件过滤，验证结果数量和内容正确。
- 接口边界：
  - `GET /api/admin/knowledge/articles?title=xxx&categoryId=xxx&status=enabled&tagName=xxx&limit=10&offset=0`。
  - 所有过滤条件可选；不传参数时返回全部未删除条目。
  - 分页参数 `limit` 默认 20、`offset` 默认 0。
- 我执行的验证：
  - 运行 `npm.cmd run test:api`，15 个 API 测试文件、55 个测试全部通过，其中 `knowledge-article-create.test.ts` 包含列表查询过滤和分页测试。
  - 运行 `npm.cmd run typecheck`，类型检查通过。
  - 运行 `npm.cmd run format:check`，格式检查通过。

## 申请演示补强：最小知识问答闭环与材料整理

- 状态：已完成，用于形成可申请、可证明、可演示的最小 AI 客服能力，不改变原实施计划下一步。
- 实施内容：
  - 更新 `packages/contracts/src/knowledge.ts`，新增 `KnowledgeAnswerRequest`、`KnowledgeAnswerSourceArticle` 和 `KnowledgeAnswerResponse` 共享契约。
  - 更新 `apps/api/src/knowledge/article.repository.ts`，新增启用知识条目检索接口 `listAnswerableArticles`，生产路径仍使用外部依赖 `pg` 查询 PostgreSQL。
  - 新增 `apps/api/src/knowledge/answer.service.ts`，实现演示级知识问答编排：问题修剪、敏感业务数据意图拦截、启用知识检索、最佳知识选择、命中回答和未命中转人工建议。
  - 新增 `apps/api/src/knowledge/answer.router.ts`，暴露 `POST /api/knowledge/answer` 访客问答入口。
  - 更新 `apps/api/src/server.ts` 和 `apps/api/src/index.ts`，装配并导出最小知识问答能力。
  - 新增 `apps/api/tests/knowledge-answer.test.ts`，覆盖启用知识命中、未命中兜底、订单/物流等具体业务数据不编造答案和空问题校验。
  - 更新根 `package.json`、`apps/web-widget/package.json` 并新增 `scripts/run-web-widget-tests.mjs`，修复全量测试中 web-widget 测试受沙箱路径映射影响的问题。
  - 新增 `docs/mimo-application.md`，整理项目说明、当前能力、MiMo Credits 使用计划、证明材料清单和演示接口。
  - 更新 `README.md`、`apps/api/README.md` 和 `memory/architecture.md`，记录当前可演示能力和边界。
- 接口边界：
  - `POST /api/knowledge/answer`：访客传入 `question`，系统只从启用知识条目中选择答案。
  - 命中知识时返回 `answer`、`matched = true`、`needsHandoff = false` 和来源知识条目。
  - 未命中知识时返回兜底提示，并标记 `needsHandoff = true`。
  - 涉及订单、物流、账号等具体业务数据时不编造答案，直接建议人工客服核实。
- 边界说明：
  - 当前问答闭环是申请演示级能力，只做轻量关键词/文本匹配。
  - 未接入真实大模型、向量检索、会话创建、消息归档、转人工队列或坐席处理流程。
  - 完整会话与转人工闭环仍按原计划后续步骤推进。
- 我执行的验证：
  - 已运行 `npm.cmd run test:api`，15 个 API 测试文件、55 个测试全部通过。
  - 已运行 `npm.cmd run test:web-widget`，1 个 web-widget 测试文件、1 个测试通过。
  - 已运行 `npm.cmd run test`，API、web-widget 和 E2E 测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 已运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。
  - 已运行 `npm.cmd run check:local-services`，本地服务编排静态检查通过。
  - 已运行 `git diff --check`，未发现空白错误；仅出现 Windows 换行提示。

## 步骤 22-26：阶段五 — 会话与消息基础功能

- 状态：已完成。
- 实施内容：
  - **步骤 22（访客匿名标识）**：使用 `visitorId` 作为访客匿名标识，新访客创建会话后自动关联；同一访客再次访问时复用未关闭会话。
  - **步骤 23（创建会话）**：`POST /api/visitor/conversations`，支持 `web` 和 `h5` 来源标记；新会话默认进入 `bot_serving` 机器人服务状态；同一访客有未关闭会话时自动返回已有会话。
  - **步骤 24（发送访客消息）**：`POST /api/visitor/conversations/:id/messages`，消息内容 1-2000 字符；已关闭会话拒绝发送；自动触发机器人回答流程（调用 `KnowledgeAnswerService`）。
  - **步骤 25（查询消息列表）**：`GET /api/visitor/conversations/:id/messages`，支持 `limit` 和 `offset` 分页，按发送时间正序返回。
  - **步骤 26（关闭会话）**：`POST /api/visitor/conversations/:id/close`，访客可关闭机器人服务状态或人工服务状态的会话；已关闭会话重复关闭返回明确错误。
- 新增文件：
  - `apps/api/src/conversation/conversation.repository.ts`：会话仓储契约接口与内存实现。
  - `apps/api/src/conversation/conversation.service.ts`：会话业务服务，包含 `ConversationService` 类。
  - `apps/api/src/conversation/conversation.router.ts`：会话路由，包含访客 API、坐席 API 和管理 API。
  - `packages/contracts/src/conversation.ts`：会话共享契约类型。
- 接口清单：
  - `POST /api/visitor/conversations` — 创建或复用会话
  - `POST /api/visitor/conversations/:id/messages` — 发送访客消息
  - `GET /api/visitor/conversations/:id/messages` — 查询消息列表
  - `POST /api/visitor/conversations/:id/close` — 访客关闭会话
- 我执行的验证：
  - 测试覆盖创建会话、复用会话、发送消息、拒绝空/超长消息、已关闭拒绝发送、消息分页、访客关闭会话、重复关闭拒绝。
  - 运行 `npm.cmd run test:api`，17 个测试文件、84 个测试全部通过。

## 步骤 27-32：阶段六 — AI 问答闭环与会话集成

- 状态：已完成（步骤 27-30 在之前"申请演示补强"中已完成，步骤 31-32 在本批次一并完成）。
- 实施内容：
  - **步骤 27（AI 适配层接口）**：`KnowledgeAnswerService` 作为 AI 适配层，业务模块只依赖该内部接口。
  - **步骤 28（关键词检索）**：`listAnswerableArticles` 按关键词从启用知识条目中检索。
  - **步骤 29（基础回答生成策略）**：命中知识时返回知识内容并标记 `matched = true`；未命中时返回兜底话术并标记 `needsHandoff = true`。
  - **步骤 30（敏感业务问题拒答）**：订单、物流、退款、账号等未对接业务数据问题直接拒答，不编造结果。
  - **步骤 31（会话消息后的机器人回复）**：`sendVisitorMessage` 在 `bot_serving` 状态下自动调用 `KnowledgeAnswerService`，将 AI 回答以 `bot` 消息写入会话。
  - **步骤 32（记录 AI 调用结果）**：新增迁移 `202605100001_add_handoff_and_ai_answer_logs.sql`，创建 `ai_answer_logs` 表；`sendVisitorMessage` 在 AI 回答后写入 `AiAnswerLog` 记录。
- 新增文件：
  - `apps/api/src/database/migrations/202605100001_add_handoff_and_ai_answer_logs.sql`：转人工状态和 AI 日志迁移。
  - `apps/api/tests/handoff-ai-log-migration.test.ts`：迁移契约测试。
  - `packages/contracts/src/ai.ts`：AI 相关共享契约。
- 我执行的验证：
  - 测试覆盖 AI 消息写入会话、AI 日志记录、新建迁移的静态检查。
  - 运行 `npm.cmd run test:api`，17 个测试文件、84 个测试全部通过。

## 步骤 33-38：阶段七 — 转人工与坐席基础功能

- 状态：已完成。
- 实施内容：
  - **步骤 33（请求转人工）**：`POST /api/visitor/conversations/:id/handoff`，将会话从 `bot_serving` 转为 `waiting_agent` 状态，并写入转人工系统消息；已关闭或已转人工的会话拒绝重复处理。
  - **步骤 34（AI 建议转人工后的状态处理）**：AI 未命中知识时返回 `needsHandoff = true`，会话仍保持 `bot_serving` 状态，等待访客确认后触发转人工流程。
  - **步骤 35（待接入会话列表）**：`GET /api/agent/conversations/waiting`，按 `handoffRequestedAt` 升序排序，返回每个会话的访客最近消息摘要；需要 `conversation:handle` 权限。
  - **步骤 36（坐席接入会话）**：`POST /api/agent/conversations/:id/accept`，会话从 `waiting_agent` 转为 `agent_serving`，绑定坐席账号；非等待状态拒绝接入。
  - **步骤 37（坐席发送消息）**：`POST /api/agent/conversations/:id/messages`，仅绑定的坐席可发送；人工服务状态下访客消息不再触发机器人回复。
  - **步骤 38（坐席结束会话）**：`POST /api/agent/conversations/:id/close`，仅绑定的坐席可结束会话；写入审计记录和系统消息。
- 新增文件：
  - `apps/api/src/feedback/feedback.service.ts`：满意度评价服务。
  - `apps/api/src/feedback/feedback.router.ts`：`POST /api/visitor/conversations/:id/rating` 路由。
  - `apps/api/src/metrics/metrics.service.ts`：指标统计服务（咨询量、转人工率等）。
  - `apps/api/src/metrics/metrics.router.ts`：`GET /api/admin/metrics/overview` 路由。
  - `packages/contracts/src/feedback.ts`：满意度评价共享契约。
  - `packages/contracts/src/metrics.ts`：指标共享契约。
- 接口清单：
  - `POST /api/visitor/conversations/:id/handoff` — 请求转人工
  - `GET /api/agent/conversations/waiting` — 待接入列表（JWT + conversation:handle）
  - `POST /api/agent/conversations/:id/accept` — 接入会话（JWT + conversation:handle）
  - `POST /api/agent/conversations/:id/messages` — 坐席发消息（JWT + conversation:handle）
  - `POST /api/agent/conversations/:id/close` — 坐席结束会话（JWT + conversation:handle）
  - `POST /api/visitor/conversations/:id/rating` — 满意度评价
  - `GET /api/admin/conversations` — 管理会话列表（JWT + conversation:read）
  - `GET /api/admin/metrics/overview` — 指标概览（JWT + metrics:read）
- 我执行的验证：
  - 测试覆盖转人工请求、重复转人工拒绝、待接入列表、接入会话、非等待状态拒绝、坐席发消息、非绑定坐席拒绝、坐席关闭会话、管理列表查询与过滤、指标概览、权限校验。
  - 运行 `npm.cmd run test:api`，17 个测试文件、84 个测试全部通过。
  - 运行 `npm.cmd run typecheck`，类型检查通过。
  - 运行 `npm.cmd run format:check`，格式检查通过。
  - 运行 `npm.cmd run check:boundaries`，模块边界检查通过。
  - 运行 `npm.cmd run check:migrations`，数据库迁移静态检查通过。

## 步骤 39：实现聊天入口 UI

- 状态：已完成。
- 实施内容：
  - 安装 React 18、React DOM、@testing-library/react、@testing-library/user-event、@vitejs/plugin-react 到 web-widget 工作区。
  - 新增 `apps/web-widget/src/ChatEntry.tsx`：浮动气泡按钮 + 展开/收起面板功能；点击气泡打开聊天面板，点击关闭按钮或面板外部区域收起。
  - 新增 `apps/web-widget/src/ChatPanel.tsx`：聊天面板组件，包含智能客服标题栏、欢迎语区域、消息区域占位、输入框和发送按钮（当前均为禁用占位）。
  - 新增 `apps/web-widget/src/index.ts`：导出 ChatEntry 和 ChatPanel。
  - 新增 `apps/web-widget/vitest.config.ts`：配置 React 插件和 jsdom 环境。
  - 新增 `apps/web-widget/tests/chat-entry.test.tsx`：6 个测试用例，覆盖面板渲染、入口按钮默认收起、点击展开/关闭、外部关闭、按钮再次点击切换。
  - 更新 `scripts/run-web-widget-tests.mjs`：从仅运行单文件改为扫描 tests 目录下全部测试文件。
  - 更新根 `tsconfig.json`：补充 `"jsx": "react-jsx"`。
- 边界说明：
  - 当前为纯静态 UI 组件，不包含后端 API 调用。
  - 输入框和发送按钮均为 `disabled` 占位，输入发送功能属于步骤 40。
  - 未包含附件、图片或富媒体能力（按计划只做文本客服）。
  - 使用内联样式（inline styles），未引入 CSS 模块或 CSS-in-JS 方案。
- 我执行的验证：
  - 已运行 `npm.cmd run test:web-widget`，2 个 web-widget 测试文件、7 个测试全部通过。
  - 已运行 `npm.cmd run test`，20 个测试文件、92 个测试全部通过。
  - 已运行 `npm.cmd run typecheck`，类型检查通过。
  - 已运行 `npm.cmd run format:check`，格式检查通过。
  - 已运行 `npm.cmd run check:boundaries`，模块边界检查通过。

## 下一步

继续进入步骤 40：实现访客消息发送与展示。
