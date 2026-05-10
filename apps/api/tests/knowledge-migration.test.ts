import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../src/database/migrations/202604190004_create_knowledge_base.sql', import.meta.url),
  'utf8',
);

describe('knowledge base migration contract', () => {
  it('defines categories with enable and disable states', () => {
    expect(migration).toMatch(/CREATE TABLE app\.knowledge_categories/i);
    expect(migration).toMatch(/status varchar\(20\) NOT NULL DEFAULT 'enabled'/i);
    expect(migration).toMatch(
      /knowledge_categories_status_known CHECK \(status IN \('enabled', 'disabled'\)\)/i,
    );
  });

  it('defines FAQ and document knowledge articles with lifecycle state', () => {
    expect(migration).toMatch(/CREATE TABLE app\.knowledge_articles/i);
    expect(migration).toMatch(/article_type varchar\(20\) NOT NULL DEFAULT 'faq'/i);
    expect(migration).toMatch(
      /knowledge_articles_type_known CHECK \(article_type IN \('faq', 'document'\)\)/i,
    );
    expect(migration).toMatch(
      /knowledge_articles_status_known CHECK \(status IN \('draft', 'enabled', 'disabled'\)\)/i,
    );
    expect(migration).toMatch(/keywords text\[\] NOT NULL DEFAULT ARRAY\[\]::text\[\]/i);
  });

  it('defines tags and article tag relationships', () => {
    expect(migration).toMatch(/CREATE TABLE app\.knowledge_tags/i);
    expect(migration).toMatch(/CREATE TABLE app\.knowledge_article_tags/i);
    expect(migration).toMatch(
      /article_id uuid NOT NULL REFERENCES app\.knowledge_articles \(id\) ON DELETE CASCADE/i,
    );
    expect(migration).toMatch(
      /tag_id uuid NOT NULL REFERENCES app\.knowledge_tags \(id\) ON DELETE RESTRICT/i,
    );
    expect(migration).toMatch(/PRIMARY KEY \(article_id, tag_id\)/i);
  });

  it('supports available knowledge filtering without returning disabled or deleted entries', () => {
    expect(migration).toMatch(/knowledge_articles_enabled_idx/i);
    expect(migration).toMatch(/status = 'enabled'/i);
    expect(migration).toMatch(/deleted_at IS NULL/i);
    expect(migration).toMatch(/knowledge_articles_full_text_idx/i);
  });
});
