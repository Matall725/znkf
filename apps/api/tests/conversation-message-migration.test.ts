import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../src/database/migrations/202604190003_create_conversations_and_messages.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('conversation and message migration contract', () => {
  it('defines conversations with visitor identity, source, status, agent, and close time', () => {
    expect(migration).toMatch(/CREATE TABLE app\.conversations/i);
    expect(migration).toMatch(/visitor_id varchar\(160\) NOT NULL/i);
    expect(migration).toMatch(/source varchar\(20\) NOT NULL/i);
    expect(migration).toMatch(
      /assigned_agent_account_id uuid REFERENCES app\.accounts \(id\) ON DELETE SET NULL/i,
    );
    expect(migration).toMatch(/closed_at timestamptz/i);
  });

  it('keeps conversation status aligned with the MVP handoff lifecycle', () => {
    expect(migration).toMatch(/status varchar\(40\) NOT NULL DEFAULT 'bot_serving'/i);
    expect(migration).toMatch(/'bot_serving'/i);
    expect(migration).toMatch(/'handoff_pending_confirmation'/i);
    expect(migration).toMatch(/'waiting_agent'/i);
    expect(migration).toMatch(/'agent_serving'/i);
    expect(migration).toMatch(/'closed'/i);
  });

  it('requires closed conversations to have a close time', () => {
    expect(migration).toMatch(/conversations_closed_at_matches_status CHECK/i);
    expect(migration).toMatch(/status = 'closed' AND closed_at IS NOT NULL/i);
    expect(migration).toMatch(/status <> 'closed' AND closed_at IS NULL/i);
  });

  it('defines messages with sender type, message type, content, and chronological lookup', () => {
    expect(migration).toMatch(/CREATE TABLE app\.messages/i);
    expect(migration).toMatch(
      /conversation_id uuid NOT NULL REFERENCES app\.conversations \(id\) ON DELETE CASCADE/i,
    );
    expect(migration).toMatch(
      /messages_sender_type_known CHECK \(sender_type IN \('visitor', 'bot', 'agent', 'system'\)\)/i,
    );
    expect(migration).toMatch(
      /messages_message_type_known CHECK \(message_type IN \('text', 'system'\)\)/i,
    );
    expect(migration).toMatch(/messages_conversation_created_at_idx/i);
    expect(migration).toMatch(/created_at ASC/i);
  });
});
