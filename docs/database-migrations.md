# 数据库迁移机制

本项目使用 `node-pg-migrate` 管理 PostgreSQL 结构变更，使用 `pg` 作为 PostgreSQL 客户端依赖。该工具是项目外部成熟依赖，当前工程只保存迁移配置、迁移文件和校验脚本。

## 规则

- 所有长期存在的数据库结构变更必须通过迁移文件进入 `apps/api/src/database/migrations`。
- 不允许把手工修改数据库作为长期方案。
- 每个迁移文件必须包含 `-- up migration` 和 `-- down migration`。
- 业务表按后端模块归属逐步增加，不在步骤 7 提前创建账号、会话、消息或知识库表。
- 应用 schema 固定为 `app`，迁移历史表固定为 `app.schema_migrations`。

## 命令

```powershell
npm.cmd run db:migrate
npm.cmd run db:migrate:test
npm.cmd run db:migrate:down
npm.cmd run check:migrations
```

## 当前基础迁移

- `202604190001_create_app_schema_and_extensions.sql` 创建 `app` schema，并启用 `pgvector` 的 `vector` 扩展，供后续知识库向量检索使用。
- `202604190002_create_accounts_and_roles.sql` 创建后台账号、角色和账号角色关系结构，覆盖管理员、知识库运营和坐席三类角色。
- `202604190003_create_conversations_and_messages.sql` 创建会话与消息结构，覆盖访客标识、会话状态、来源、当前坐席、关闭时间、发送者类型和消息内容。
- `202604190004_create_knowledge_base.sql` 创建知识分类、标签、知识条目和条目标签关系，覆盖 FAQ、文档型内容、启停状态和关键词。
- `202604190005_create_ratings_and_audit_logs.sql` 创建满意度评价和审计日志结构，覆盖会话单次评分、知识条目新增/编辑/启停审计和坐席结束会话审计。
