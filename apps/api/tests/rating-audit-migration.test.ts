import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../src/database/migrations/202604190005_create_ratings_and_audit_logs.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('rating and audit migration contract', () => {
  it('defines one satisfaction rating per conversation', () => {
    expect(migration).toMatch(/CREATE TABLE app\.satisfaction_ratings/i);
    expect(migration).toMatch(
      /conversation_id uuid NOT NULL REFERENCES app\.conversations \(id\) ON DELETE CASCADE/i,
    );
    expect(migration).toMatch(
      /satisfaction_ratings_conversation_unique UNIQUE \(conversation_id\)/i,
    );
  });

  it('limits satisfaction scores to the MVP rating range', () => {
    expect(migration).toMatch(/score smallint NOT NULL/i);
    expect(migration).toMatch(/satisfaction_ratings_score_range CHECK \(score BETWEEN 1 AND 5\)/i);
    expect(migration).toMatch(/satisfaction_ratings_created_at_idx/i);
  });

  it('defines audit logs for knowledge changes and agent conversation close', () => {
    expect(migration).toMatch(/CREATE TABLE app\.audit_logs/i);
    expect(migration).toMatch(
      /actor_account_id uuid REFERENCES app\.accounts \(id\) ON DELETE SET NULL/i,
    );
    expect(migration).toMatch(/'knowledge_article_created'/i);
    expect(migration).toMatch(/'knowledge_article_updated'/i);
    expect(migration).toMatch(/'knowledge_article_enabled'/i);
    expect(migration).toMatch(/'knowledge_article_disabled'/i);
    expect(migration).toMatch(/'agent_conversation_closed'/i);
  });

  it('keeps audit targets and metadata queryable', () => {
    expect(migration).toMatch(/target_type IN \('knowledge_article', 'conversation'\)/i);
    expect(migration).toMatch(/metadata jsonb NOT NULL DEFAULT '\{\}'::jsonb/i);
    expect(migration).toMatch(/jsonb_typeof\(metadata\) = 'object'/i);
    expect(migration).toMatch(/audit_logs_target_idx/i);
    expect(migration).toMatch(/audit_logs_action_created_at_idx/i);
  });
});
