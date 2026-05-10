-- up migration

CREATE TABLE app.satisfaction_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES app.conversations (id) ON DELETE CASCADE,
  visitor_id varchar(160) NOT NULL,
  score smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT satisfaction_ratings_conversation_unique UNIQUE (conversation_id),
  CONSTRAINT satisfaction_ratings_score_range CHECK (score BETWEEN 1 AND 5),
  CONSTRAINT satisfaction_ratings_visitor_id_not_empty CHECK (length(btrim(visitor_id)) > 0),
  CONSTRAINT satisfaction_ratings_comment_not_empty CHECK (
    comment IS NULL
    OR length(btrim(comment)) > 0
  )
);

CREATE INDEX satisfaction_ratings_created_at_idx ON app.satisfaction_ratings (created_at DESC);

CREATE TABLE app.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id uuid REFERENCES app.accounts (id) ON DELETE SET NULL,
  actor_role_code varchar(40),
  action varchar(80) NOT NULL,
  target_type varchar(60) NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_actor_role_known CHECK (
    actor_role_code IS NULL
    OR actor_role_code IN ('admin', 'knowledge_operator', 'agent')
  ),
  CONSTRAINT audit_logs_action_known CHECK (
    action IN (
      'knowledge_article_created',
      'knowledge_article_updated',
      'knowledge_article_enabled',
      'knowledge_article_disabled',
      'agent_conversation_closed'
    )
  ),
  CONSTRAINT audit_logs_target_type_known CHECK (
    target_type IN ('knowledge_article', 'conversation')
  ),
  CONSTRAINT audit_logs_action_target_consistent CHECK (
    (
      action IN (
        'knowledge_article_created',
        'knowledge_article_updated',
        'knowledge_article_enabled',
        'knowledge_article_disabled'
      )
      AND target_type = 'knowledge_article'
    )
    OR (
      action = 'agent_conversation_closed'
      AND target_type = 'conversation'
    )
  ),
  CONSTRAINT audit_logs_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX audit_logs_created_at_idx ON app.audit_logs (created_at DESC);

CREATE INDEX audit_logs_actor_created_at_idx ON app.audit_logs (actor_account_id, created_at DESC)
WHERE
  actor_account_id IS NOT NULL;

CREATE INDEX audit_logs_target_idx ON app.audit_logs (target_type, target_id, created_at DESC);

CREATE INDEX audit_logs_action_created_at_idx ON app.audit_logs (action, created_at DESC);

-- down migration

DROP TABLE IF EXISTS app.audit_logs;

DROP TABLE IF EXISTS app.satisfaction_ratings;
