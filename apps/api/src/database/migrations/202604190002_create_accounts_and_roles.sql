-- up migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login_name varchar(120) NOT NULL,
  display_name varchar(120) NOT NULL,
  password_hash text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'enabled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounts_login_name_unique UNIQUE (login_name),
  CONSTRAINT accounts_status_known CHECK (status IN ('enabled', 'disabled'))
);

CREATE INDEX accounts_status_idx ON app.accounts (status);

CREATE TABLE app.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL,
  name varchar(120) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_code_unique UNIQUE (code),
  CONSTRAINT roles_code_known CHECK (code IN ('admin', 'knowledge_operator', 'agent'))
);

INSERT INTO
  app.roles (code, name, description)
VALUES
  ('admin', 'Administrator', 'System administrator with full backend permissions.'),
  (
    'knowledge_operator',
    'Knowledge Operator',
    'Operator responsible for maintaining knowledge base content.'
  ),
  ('agent', 'Agent', 'Customer service agent handling handoff conversations.')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

CREATE TABLE app.account_roles (
  account_id uuid NOT NULL REFERENCES app.accounts (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES app.roles (id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, role_id)
);

CREATE INDEX account_roles_role_id_idx ON app.account_roles (role_id);

-- down migration

DROP TABLE IF EXISTS app.account_roles;

DROP TABLE IF EXISTS app.roles;

DROP TABLE IF EXISTS app.accounts;

DROP EXTENSION IF EXISTS pgcrypto;
