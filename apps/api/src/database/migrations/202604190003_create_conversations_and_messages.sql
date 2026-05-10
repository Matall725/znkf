-- up migration

CREATE TABLE app.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id varchar(160) NOT NULL,
  source varchar(20) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'bot_serving',
  assigned_agent_account_id uuid REFERENCES app.accounts (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CONSTRAINT conversations_source_known CHECK (source IN ('web', 'h5')),
  CONSTRAINT conversations_status_known CHECK (
    status IN (
      'bot_serving',
      'handoff_pending_confirmation',
      'waiting_agent',
      'agent_serving',
      'closed'
    )
  ),
  CONSTRAINT conversations_closed_at_matches_status CHECK (
    (status = 'closed' AND closed_at IS NOT NULL)
    OR (status <> 'closed' AND closed_at IS NULL)
  ),
  CONSTRAINT conversations_agent_required_for_agent_serving CHECK (
    status <> 'agent_serving'
    OR assigned_agent_account_id IS NOT NULL
  )
);

CREATE INDEX conversations_visitor_open_idx ON app.conversations (visitor_id, updated_at DESC)
WHERE
  status <> 'closed';

CREATE INDEX conversations_status_created_at_idx ON app.conversations (status, created_at DESC);

CREATE INDEX conversations_assigned_agent_account_id_idx ON app.conversations (
  assigned_agent_account_id
)
WHERE
  assigned_agent_account_id IS NOT NULL;

CREATE TABLE app.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES app.conversations (id) ON DELETE CASCADE,
  sender_type varchar(20) NOT NULL,
  sender_id varchar(160),
  message_type varchar(20) NOT NULL DEFAULT 'text',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_sender_type_known CHECK (sender_type IN ('visitor', 'bot', 'agent', 'system')),
  CONSTRAINT messages_message_type_known CHECK (message_type IN ('text', 'system')),
  CONSTRAINT messages_content_not_empty CHECK (length(btrim(content)) > 0)
);

CREATE INDEX messages_conversation_created_at_idx ON app.messages (
  conversation_id,
  created_at ASC,
  id ASC
);

-- down migration

DROP TABLE IF EXISTS app.messages;

DROP TABLE IF EXISTS app.conversations;
