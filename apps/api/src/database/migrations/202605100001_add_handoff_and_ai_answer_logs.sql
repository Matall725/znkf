-- up migration

ALTER TABLE app.conversations
ADD COLUMN handoff_requested_at timestamptz;

CREATE INDEX conversations_handoff_requested_at_idx ON app.conversations (handoff_requested_at DESC)
WHERE
  handoff_requested_at IS NOT NULL;

CREATE TABLE app.ai_answer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES app.conversations (id) ON DELETE CASCADE,
  visitor_message_id uuid NOT NULL REFERENCES app.messages (id) ON DELETE CASCADE,
  bot_message_id uuid REFERENCES app.messages (id) ON DELETE SET NULL,
  matched_knowledge_article_id uuid REFERENCES app.knowledge_articles (id) ON DELETE SET NULL,
  matched boolean NOT NULL,
  needs_handoff boolean NOT NULL,
  confidence_level varchar(20) NOT NULL,
  failure_reason varchar(120),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_answer_logs_confidence_level_known CHECK (
    confidence_level IN ('high', 'low', 'none')
  ),
  CONSTRAINT ai_answer_logs_failure_reason_not_empty CHECK (
    failure_reason IS NULL
    OR length(btrim(failure_reason)) > 0
  )
);

CREATE INDEX ai_answer_logs_conversation_created_at_idx ON app.ai_answer_logs (
  conversation_id,
  created_at DESC
);

CREATE INDEX ai_answer_logs_visitor_message_id_idx ON app.ai_answer_logs (visitor_message_id);

CREATE INDEX ai_answer_logs_matched_knowledge_article_id_idx ON app.ai_answer_logs (
  matched_knowledge_article_id
)
WHERE
  matched_knowledge_article_id IS NOT NULL;

-- down migration

DROP TABLE IF EXISTS app.ai_answer_logs;

DROP INDEX IF EXISTS app.conversations_handoff_requested_at_idx;

ALTER TABLE app.conversations
DROP COLUMN IF EXISTS handoff_requested_at;
