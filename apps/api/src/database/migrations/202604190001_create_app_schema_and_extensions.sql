-- up migration

CREATE SCHEMA IF NOT EXISTS app;

COMMENT ON SCHEMA app IS 'Application-owned schema for znkfxt modular monolith objects.';

CREATE EXTENSION IF NOT EXISTS vector;

-- down migration

DROP EXTENSION IF EXISTS vector;

DROP SCHEMA IF EXISTS app CASCADE;
