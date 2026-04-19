import { existsSync, readdirSync, readFileSync } from 'node:fs';

const apiPackagePath = 'apps/api/package.json';
const rootPackagePath = 'package.json';
const migrationConfigPath = 'apps/api/migration.config.json';
const migrationsDirectory = 'apps/api/src/database/migrations';
const databaseDocs = ['apps/api/src/database/README.md', 'docs/database-migrations.md'];
const baseMigrationName = '202604190001_create_app_schema_and_extensions.sql';
const accountRoleMigrationName = '202604190002_create_accounts_and_roles.sql';
const conversationMessageMigrationName = '202604190003_create_conversations_and_messages.sql';
const knowledgeBaseMigrationName = '202604190004_create_knowledge_base.sql';
const ratingAuditMigrationName = '202604190005_create_ratings_and_audit_logs.sql';

const requiredFiles = [
  apiPackagePath,
  rootPackagePath,
  migrationConfigPath,
  migrationsDirectory,
  ...databaseDocs,
];

const missingFiles = requiredFiles.filter((path) => !existsSync(path));

if (missingFiles.length > 0) {
  console.error(`Missing database migration files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

const apiPackage = JSON.parse(readFileSync(apiPackagePath, 'utf8'));
const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
const migrationConfig = JSON.parse(readFileSync(migrationConfigPath, 'utf8'));
const migrationFiles = readdirSync(migrationsDirectory).filter((name) => name.endsWith('.sql'));

const checks = [
  ['pg dependency', Boolean(apiPackage.dependencies?.pg)],
  ['node-pg-migrate dependency', Boolean(apiPackage.devDependencies?.['node-pg-migrate'])],
  ['api db:migrate script', Boolean(apiPackage.scripts?.['db:migrate'])],
  ['api db:migrate:test script', Boolean(apiPackage.scripts?.['db:migrate:test'])],
  ['api db:migrate:down script', Boolean(apiPackage.scripts?.['db:migrate:down'])],
  ['api check:migrations script', Boolean(apiPackage.scripts?.['check:migrations'])],
  ['root db:migrate script', Boolean(rootPackage.scripts?.['db:migrate'])],
  ['root db:migrate:test script', Boolean(rootPackage.scripts?.['db:migrate:test'])],
  ['root db:migrate:down script', Boolean(rootPackage.scripts?.['db:migrate:down'])],
  ['root check:migrations script', Boolean(rootPackage.scripts?.['check:migrations'])],
  ['DATABASE_URL default source', !('database-url-var' in migrationConfig)],
  ['migration directory', migrationConfig['migrations-dir'] === 'src/database/migrations'],
  ['migration table', migrationConfig['migrations-table'] === 'schema_migrations'],
  ['application schema', migrationConfig.schema === 'app'],
  ['create schema enabled', migrationConfig['create-schema'] === true],
  ['migration schema', migrationConfig['migrations-schema'] === 'app'],
  ['create migrations schema enabled', migrationConfig['create-migrations-schema'] === true],
  ['SQL migration language', migrationConfig['migration-file-language'] === 'sql'],
  ['ordered migrations', migrationConfig['check-order'] === true],
  ['at least one migration', migrationFiles.length > 0],
  ['base schema migration exists', migrationFiles.includes(baseMigrationName)],
  ['account role migration exists', migrationFiles.includes(accountRoleMigrationName)],
  [
    'conversation message migration exists',
    migrationFiles.includes(conversationMessageMigrationName),
  ],
  ['knowledge base migration exists', migrationFiles.includes(knowledgeBaseMigrationName)],
  ['rating audit migration exists', migrationFiles.includes(ratingAuditMigrationName)],
];

const migrationChecks = migrationFiles.flatMap((file) => {
  const content = readFileSync(`${migrationsDirectory}/${file}`, 'utf8');

  return [
    [`${file} has up section`, /^--[\s-]*up migration/im.test(content)],
    [`${file} has down section`, /^--[\s-]*down migration/im.test(content)],
  ];
});

const baseMigration = readFileSync(`${migrationsDirectory}/${baseMigrationName}`, 'utf8');
const accountRoleMigration = readFileSync(
  `${migrationsDirectory}/${accountRoleMigrationName}`,
  'utf8',
);
const conversationMessageMigration = readFileSync(
  `${migrationsDirectory}/${conversationMessageMigrationName}`,
  'utf8',
);
const knowledgeBaseMigration = readFileSync(
  `${migrationsDirectory}/${knowledgeBaseMigrationName}`,
  'utf8',
);
const ratingAuditMigration = readFileSync(
  `${migrationsDirectory}/${ratingAuditMigrationName}`,
  'utf8',
);

const specificMigrationChecks = [
  ['base migration creates app schema', /CREATE SCHEMA IF NOT EXISTS app/i.test(baseMigration)],
  ['base migration enables pgvector', /CREATE EXTENSION IF NOT EXISTS vector/i.test(baseMigration)],
  [
    'account migration enables pgcrypto',
    /CREATE EXTENSION IF NOT EXISTS pgcrypto/i.test(accountRoleMigration),
  ],
  ['account table exists', /CREATE TABLE app\.accounts/i.test(accountRoleMigration)],
  ['role table exists', /CREATE TABLE app\.roles/i.test(accountRoleMigration)],
  ['account role table exists', /CREATE TABLE app\.account_roles/i.test(accountRoleMigration)],
  [
    'account status constraint',
    /accounts_status_known CHECK \(status IN \('enabled', 'disabled'\)\)/i.test(
      accountRoleMigration,
    ),
  ],
  [
    'role code constraint',
    /roles_code_known CHECK \(code IN \('admin', 'knowledge_operator', 'agent'\)\)/i.test(
      accountRoleMigration,
    ),
  ],
  ['account role composite key', /PRIMARY KEY \(account_id, role_id\)/i.test(accountRoleMigration)],
  [
    'account role has no account-only unique constraint',
    !/UNIQUE \(account_id\)/i.test(accountRoleMigration),
  ],
  [
    'conversation table exists',
    /CREATE TABLE app\.conversations/i.test(conversationMessageMigration),
  ],
  ['message table exists', /CREATE TABLE app\.messages/i.test(conversationMessageMigration)],
  [
    'conversation status includes pending confirmation',
    /'handoff_pending_confirmation'/i.test(conversationMessageMigration),
  ],
  ['conversation status includes closed', /'closed'/i.test(conversationMessageMigration)],
  [
    'conversation source constraint',
    /conversations_source_known CHECK \(source IN \('web', 'h5'\)\)/i.test(
      conversationMessageMigration,
    ),
  ],
  [
    'closed conversation requires closed_at',
    /status = 'closed' AND closed_at IS NOT NULL/i.test(conversationMessageMigration),
  ],
  [
    'message sender type constraint',
    /messages_sender_type_known CHECK \(sender_type IN \('visitor', 'bot', 'agent', 'system'\)\)/i.test(
      conversationMessageMigration,
    ),
  ],
  [
    'message chronological lookup index',
    /messages_conversation_created_at_idx/i.test(conversationMessageMigration),
  ],
  [
    'knowledge category table exists',
    /CREATE TABLE app\.knowledge_categories/i.test(knowledgeBaseMigration),
  ],
  ['knowledge tag table exists', /CREATE TABLE app\.knowledge_tags/i.test(knowledgeBaseMigration)],
  [
    'knowledge article table exists',
    /CREATE TABLE app\.knowledge_articles/i.test(knowledgeBaseMigration),
  ],
  [
    'knowledge article tag table exists',
    /CREATE TABLE app\.knowledge_article_tags/i.test(knowledgeBaseMigration),
  ],
  [
    'knowledge article type constraint',
    /knowledge_articles_type_known CHECK \(article_type IN \('faq', 'document'\)\)/i.test(
      knowledgeBaseMigration,
    ),
  ],
  [
    'knowledge article status constraint',
    /knowledge_articles_status_known CHECK \(status IN \('draft', 'enabled', 'disabled'\)\)/i.test(
      knowledgeBaseMigration,
    ),
  ],
  [
    'knowledge category status constraint',
    /knowledge_categories_status_known CHECK \(status IN \('enabled', 'disabled'\)\)/i.test(
      knowledgeBaseMigration,
    ),
  ],
  [
    'knowledge keywords array',
    /keywords text\[\] NOT NULL DEFAULT ARRAY\[\]::text\[\]/i.test(knowledgeBaseMigration),
  ],
  ['knowledge enabled-only index', /knowledge_articles_enabled_idx/i.test(knowledgeBaseMigration)],
  ['knowledge full text index', /knowledge_articles_full_text_idx/i.test(knowledgeBaseMigration)],
  [
    'satisfaction rating table exists',
    /CREATE TABLE app\.satisfaction_ratings/i.test(ratingAuditMigration),
  ],
  ['audit log table exists', /CREATE TABLE app\.audit_logs/i.test(ratingAuditMigration)],
  [
    'satisfaction rating references conversations',
    /conversation_id uuid NOT NULL REFERENCES app\.conversations \(id\) ON DELETE CASCADE/i.test(
      ratingAuditMigration,
    ),
  ],
  [
    'one rating per conversation',
    /satisfaction_ratings_conversation_unique UNIQUE \(conversation_id\)/i.test(
      ratingAuditMigration,
    ),
  ],
  [
    'satisfaction score range',
    /satisfaction_ratings_score_range CHECK \(score BETWEEN 1 AND 5\)/i.test(ratingAuditMigration),
  ],
  [
    'audit references actor account',
    /actor_account_id uuid REFERENCES app\.accounts \(id\) ON DELETE SET NULL/i.test(
      ratingAuditMigration,
    ),
  ],
  [
    'audit includes knowledge create action',
    /'knowledge_article_created'/i.test(ratingAuditMigration),
  ],
  [
    'audit includes knowledge update action',
    /'knowledge_article_updated'/i.test(ratingAuditMigration),
  ],
  [
    'audit includes knowledge enable action',
    /'knowledge_article_enabled'/i.test(ratingAuditMigration),
  ],
  [
    'audit includes knowledge disable action',
    /'knowledge_article_disabled'/i.test(ratingAuditMigration),
  ],
  ['audit includes agent close action', /'agent_conversation_closed'/i.test(ratingAuditMigration)],
  [
    'audit metadata is jsonb object',
    /metadata jsonb NOT NULL DEFAULT '\{\}'::jsonb/i.test(ratingAuditMigration) &&
      /jsonb_typeof\(metadata\) = 'object'/i.test(ratingAuditMigration),
  ],
  ['audit target index', /audit_logs_target_idx/i.test(ratingAuditMigration)],
  ['audit action index', /audit_logs_action_created_at_idx/i.test(ratingAuditMigration)],
];

const failed = [...checks, ...migrationChecks, ...specificMigrationChecks]
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length > 0) {
  console.error(`Database migration checks failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('[migrations] database migration configuration is complete.');
