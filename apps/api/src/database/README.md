# Database Migrations

Database schema changes are managed by `node-pg-migrate`. Do not change long-lived database structure manually.

## Commands

Run from the repository root:

```powershell
npm.cmd run db:migrate
npm.cmd run db:migrate:test
npm.cmd run db:migrate:down
npm.cmd run check:migrations
```

`db:migrate` uses `config/env/.env.local.example` and `db:migrate:test` uses `config/env/.env.test.example`. Real `.env` files are still ignored by git and can be passed later through environment variables or a copied local env file.

## Boundaries

- Migration files live in `apps/api/src/database/migrations`.
- Each migration must include both `-- up migration` and `-- down migration` sections.
- Business tables added in later steps must be introduced through new migration files, grouped by the owning backend module.
- The application schema is `app`; migration history is stored in `app.schema_migrations`.
- Account and role structures belong to the `auth` module, with agent role usage shared by the later `agent` module.
- Conversation and message structures belong to the `conversation` and `message` modules. Handoff-specific state is represented by conversation status, but handoff records are added later.
- Knowledge category, tag, and article structures belong to the `knowledge` module. Retrieval behavior is implemented later by the `retrieval` module.
- Satisfaction rating structures belong to the `metrics` module for later reporting, while audit log structures belong to the `audit` module.
