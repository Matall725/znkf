-- up migration

CREATE TABLE app.knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  slug varchar(140) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'enabled',
  created_by_account_id uuid REFERENCES app.accounts (id) ON DELETE SET NULL,
  updated_by_account_id uuid REFERENCES app.accounts (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_categories_slug_unique UNIQUE (slug),
  CONSTRAINT knowledge_categories_status_known CHECK (status IN ('enabled', 'disabled')),
  CONSTRAINT knowledge_categories_name_not_empty CHECK (length(btrim(name)) > 0),
  CONSTRAINT knowledge_categories_slug_not_empty CHECK (length(btrim(slug)) > 0)
);

CREATE INDEX knowledge_categories_status_idx ON app.knowledge_categories (status);

CREATE TABLE app.knowledge_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_tags_name_unique UNIQUE (name),
  CONSTRAINT knowledge_tags_name_not_empty CHECK (length(btrim(name)) > 0)
);

CREATE TABLE app.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_type varchar(20) NOT NULL DEFAULT 'faq',
  title varchar(240) NOT NULL,
  content text NOT NULL,
  category_id uuid REFERENCES app.knowledge_categories (id) ON DELETE SET NULL,
  keywords text[] NOT NULL DEFAULT ARRAY[]::text[],
  status varchar(20) NOT NULL DEFAULT 'draft',
  created_by_account_id uuid REFERENCES app.accounts (id) ON DELETE SET NULL,
  updated_by_account_id uuid REFERENCES app.accounts (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT knowledge_articles_type_known CHECK (article_type IN ('faq', 'document')),
  CONSTRAINT knowledge_articles_status_known CHECK (status IN ('draft', 'enabled', 'disabled')),
  CONSTRAINT knowledge_articles_title_not_empty CHECK (length(btrim(title)) > 0),
  CONSTRAINT knowledge_articles_content_not_empty CHECK (length(btrim(content)) > 0)
);

CREATE INDEX knowledge_articles_status_idx ON app.knowledge_articles (status);

CREATE INDEX knowledge_articles_category_status_idx ON app.knowledge_articles (category_id, status);

CREATE INDEX knowledge_articles_keywords_idx ON app.knowledge_articles USING GIN (keywords);

CREATE INDEX knowledge_articles_enabled_idx ON app.knowledge_articles (updated_at DESC)
WHERE
  status = 'enabled'
  AND deleted_at IS NULL;

CREATE INDEX knowledge_articles_full_text_idx ON app.knowledge_articles USING GIN (
  to_tsvector(
    'simple',
    coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || array_to_string(keywords, ' ')
  )
);

CREATE TABLE app.knowledge_article_tags (
  article_id uuid NOT NULL REFERENCES app.knowledge_articles (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES app.knowledge_tags (id) ON DELETE RESTRICT,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX knowledge_article_tags_tag_id_idx ON app.knowledge_article_tags (tag_id);

-- down migration

DROP TABLE IF EXISTS app.knowledge_article_tags;

DROP TABLE IF EXISTS app.knowledge_articles;

DROP TABLE IF EXISTS app.knowledge_tags;

DROP TABLE IF EXISTS app.knowledge_categories;
