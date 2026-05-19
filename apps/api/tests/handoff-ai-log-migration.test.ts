import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../src/database/migrations/202605100001_add_handoff_and_ai_answer_logs.sql', import.meta.url),
  'utf8',
);

describe('handoff and ai answer log migration contract', () => {
  it('tracks whether a conversation has entered the handoff flow', () => {
    expect(migration).toMatch(/ALTER TABLE app\.conversations/i);
    expect(migration).toMatch(/ADD COLUMN handoff_requested_at timestamptz/i);
    expect(migration).toMatch(/conversations_handoff_requested_at_idx/i);
  });

  it('defines ai answer logs with matched knowledge and confidence level', () => {
    expect(migration).toMatch(/CREATE TABLE app\.ai_answer_logs/i);
    expect(migration).toMatch(/conversation_id uuid NOT NULL REFERENCES app\.conversations/i);
    expect(migration).toMatch(/visitor_message_id uuid NOT NULL REFERENCES app\.messages/i);
    expect(migration).toMatch(/matched_knowledge_article_id uuid REFERENCES app\.knowledge_articles/i);
    expect(migration).toMatch(/confidence_level varchar\(20\) NOT NULL/i);
    expect(migration).toMatch(/confidence_level IN \('high', 'low', 'none'\)/i);
  });
});
