import type {
  KnowledgeArticle,
  KnowledgeArticleStatus,
  KnowledgeArticleType,
} from '@znkfxt/contracts';
import { Pool, type PoolClient } from 'pg';

export interface CreateKnowledgeArticleInput {
  articleType: KnowledgeArticleType;
  title: string;
  content: string;
  categoryId: string | null;
  keywords: string[];
  tagNames: string[];
  status: KnowledgeArticleStatus;
  actorAccountId: string;
}

export interface UpdateKnowledgeArticleInput {
  id: string;
  title?: string | undefined;
  content?: string | undefined;
  categoryId?: string | null | undefined;
  keywords?: string[] | undefined;
  tagNames?: string[] | undefined;
  status?: KnowledgeArticleStatus | undefined;
  actorAccountId: string;
}

export interface SetKnowledgeArticleStatusInput {
  id: string;
  status: KnowledgeArticleStatus;
  actorAccountId: string;
}

export interface ListKnowledgeArticlesFilter {
  title?: string | undefined;
  categoryId?: string | undefined;
  tagName?: string | undefined;
  status?: KnowledgeArticleStatus | undefined;
  limit: number;
  offset: number;
}

export interface ListAnswerableArticlesInput {
  terms: string[];
  limit: number;
}

export interface KnowledgeArticleRepository {
  createArticle(input: CreateKnowledgeArticleInput): Promise<KnowledgeArticle>;
  updateArticle(input: UpdateKnowledgeArticleInput): Promise<KnowledgeArticle | null>;
  setArticleStatus(input: SetKnowledgeArticleStatusInput): Promise<KnowledgeArticle | null>;
  findArticleById(id: string): Promise<KnowledgeArticle | null>;
  listArticles(
    filter: ListKnowledgeArticlesFilter,
  ): Promise<{ articles: KnowledgeArticle[]; total: number }>;
}

export interface KnowledgeArticleSearchRepository {
  listAnswerableArticles(input: ListAnswerableArticlesInput): Promise<KnowledgeArticle[]>;
}

interface KnowledgeArticleRow {
  id: string;
  article_type: KnowledgeArticleType;
  title: string;
  content: string;
  category_id: string | null;
  keywords: string[];
  status: KnowledgeArticleStatus;
  created_by_account_id: string | null;
  updated_by_account_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface KnowledgeTagRow {
  id: string;
  name: string;
}

const articleSelectColumns = `
  id::text,
  article_type,
  title,
  content,
  category_id::text,
  keywords,
  status,
  created_by_account_id::text,
  updated_by_account_id::text,
  created_at,
  updated_at
`;

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toKnowledgeArticle(row: KnowledgeArticleRow, tagNames: string[]): KnowledgeArticle {
  return {
    id: row.id,
    articleType: row.article_type,
    title: row.title,
    content: row.content,
    categoryId: row.category_id,
    keywords: row.keywords,
    tagNames,
    status: row.status,
    createdByAccountId: row.created_by_account_id,
    updatedByAccountId: row.updated_by_account_id,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export class PgKnowledgeArticleRepository
  implements KnowledgeArticleRepository, KnowledgeArticleSearchRepository
{
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static fromConnectionString(connectionString: string): PgKnowledgeArticleRepository {
    return new PgKnowledgeArticleRepository(
      new Pool({
        connectionString,
      }),
    );
  }

  async createArticle(input: CreateKnowledgeArticleInput): Promise<KnowledgeArticle> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const articleRow = await this.insertArticle(client, input);
      const tagNames = await this.upsertTagsForArticle(client, articleRow.id, input.tagNames);
      const article = toKnowledgeArticle(articleRow, tagNames);

      await client.query('COMMIT');

      return article;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateArticle(input: UpdateKnowledgeArticleInput): Promise<KnowledgeArticle | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const articleRow = await this.updateArticleRow(client, input);

      if (!articleRow) {
        await client.query('COMMIT');
        return null;
      }

      const tagNames =
        input.tagNames === undefined
          ? await this.listTagNamesForArticle(client, articleRow.id)
          : await this.replaceTagsForArticle(client, articleRow.id, input.tagNames);
      const article = toKnowledgeArticle(articleRow, tagNames);

      await client.query('COMMIT');

      return article;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setArticleStatus(input: SetKnowledgeArticleStatusInput): Promise<KnowledgeArticle | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query<KnowledgeArticleRow>(
        `
          UPDATE app.knowledge_articles
          SET
            status = $2,
            updated_by_account_id = $3,
            updated_at = now()
          WHERE id = $1
            AND deleted_at IS NULL
          RETURNING ${articleSelectColumns}
        `,
        [input.id, input.status, input.actorAccountId],
      );
      const row = result.rows[0];

      if (!row) {
        return null;
      }

      return toKnowledgeArticle(row, await this.listTagNamesForArticle(client, row.id));
    } finally {
      client.release();
    }
  }

  async findArticleById(id: string): Promise<KnowledgeArticle | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query<KnowledgeArticleRow>(
        `
          SELECT ${articleSelectColumns}
          FROM app.knowledge_articles
          WHERE id = $1
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [id],
      );
      const row = result.rows[0];

      if (!row) {
        return null;
      }

      return toKnowledgeArticle(row, await this.listTagNamesForArticle(client, row.id));
    } finally {
      client.release();
    }
  }

  async listArticles(
    filter: ListKnowledgeArticlesFilter,
  ): Promise<{ articles: KnowledgeArticle[]; total: number }> {
    const client = await this.pool.connect();

    try {
      const queryValues = [
        filter.title ? `%${filter.title}%` : null,
        filter.categoryId ?? null,
        filter.status ?? null,
        filter.tagName ? filter.tagName.trim() : null,
        filter.limit,
        filter.offset,
      ];

      const [countResult, rowsResult] = await Promise.all([
        client.query<{ count: string }>(
          `
            SELECT COUNT(*)::text AS count
            FROM app.knowledge_articles articles
            WHERE articles.deleted_at IS NULL
              AND ($1::text IS NULL OR articles.title ILIKE $1)
              AND ($2::uuid IS NULL OR articles.category_id = $2)
              AND ($3::text IS NULL OR articles.status = $3)
              AND (
                $4::text IS NULL
                OR EXISTS (
                  SELECT 1
                  FROM app.knowledge_article_tags article_tags
                  INNER JOIN app.knowledge_tags tags ON tags.id = article_tags.tag_id
                  WHERE article_tags.article_id = articles.id
                    AND tags.name = $4
                )
              )
          `,
          queryValues.slice(0, 4),
        ),
        client.query<KnowledgeArticleRow>(
          `
            SELECT ${articleSelectColumns}
            FROM app.knowledge_articles articles
            WHERE articles.deleted_at IS NULL
              AND ($1::text IS NULL OR articles.title ILIKE $1)
              AND ($2::uuid IS NULL OR articles.category_id = $2)
              AND ($3::text IS NULL OR articles.status = $3)
              AND (
                $4::text IS NULL
                OR EXISTS (
                  SELECT 1
                  FROM app.knowledge_article_tags article_tags
                  INNER JOIN app.knowledge_tags tags ON tags.id = article_tags.tag_id
                  WHERE article_tags.article_id = articles.id
                    AND tags.name = $4
                )
              )
            ORDER BY articles.updated_at DESC, articles.id DESC
            LIMIT $5
            OFFSET $6
          `,
          queryValues,
        ),
      ]);
      const tagNamesByArticleId = await this.listTagNamesByArticleIds(
        client,
        rowsResult.rows.map((row) => row.id),
      );
      const articles = rowsResult.rows.map((row) =>
        toKnowledgeArticle(row, tagNamesByArticleId.get(row.id) ?? []),
      );

      return {
        articles,
        total: Number(countResult.rows[0]?.count ?? 0),
      };
    } finally {
      client.release();
    }
  }

  async listAnswerableArticles(input: ListAnswerableArticlesInput): Promise<KnowledgeArticle[]> {
    if (input.terms.length === 0) {
      return [];
    }

    const client = await this.pool.connect();

    try {
      const result = await client.query<KnowledgeArticleRow>(
        `
          SELECT ${articleSelectColumns}
          FROM app.knowledge_articles articles
          WHERE articles.status = 'enabled'
            AND articles.deleted_at IS NULL
            AND EXISTS (
              SELECT 1
              FROM unnest($1::text[]) search_terms(term)
              WHERE articles.title ILIKE '%' || search_terms.term || '%'
                OR articles.content ILIKE '%' || search_terms.term || '%'
                OR EXISTS (
                  SELECT 1
                  FROM unnest(articles.keywords) article_keywords(keyword)
                  WHERE search_terms.term ILIKE '%' || article_keywords.keyword || '%'
                    OR article_keywords.keyword ILIKE '%' || search_terms.term || '%'
                )
            )
          ORDER BY articles.updated_at DESC
          LIMIT $2
        `,
        [input.terms, input.limit],
      );
      const tagNamesByArticleId = await this.listTagNamesByArticleIds(
        client,
        result.rows.map((row) => row.id),
      );

      return result.rows.map((row) =>
        toKnowledgeArticle(row, tagNamesByArticleId.get(row.id) ?? []),
      );
    } finally {
      client.release();
    }
  }

  private async insertArticle(
    client: PoolClient,
    input: CreateKnowledgeArticleInput,
  ): Promise<KnowledgeArticleRow> {
    const result = await client.query<KnowledgeArticleRow>(
      `
        INSERT INTO app.knowledge_articles (
          article_type,
          title,
          content,
          category_id,
          keywords,
          status,
          created_by_account_id,
          updated_by_account_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING ${articleSelectColumns}
      `,
      [
        input.articleType,
        input.title,
        input.content,
        input.categoryId,
        input.keywords,
        input.status,
        input.actorAccountId,
      ],
    );

    return result.rows[0] as KnowledgeArticleRow;
  }

  private async updateArticleRow(
    client: PoolClient,
    input: UpdateKnowledgeArticleInput,
  ): Promise<KnowledgeArticleRow | null> {
    const result = await client.query<KnowledgeArticleRow>(
      `
        UPDATE app.knowledge_articles
        SET
          title = COALESCE($2, title),
          content = COALESCE($3, content),
          category_id = CASE WHEN $4::boolean THEN $5::uuid ELSE category_id END,
          keywords = CASE WHEN $6::boolean THEN $7::text[] ELSE keywords END,
          status = COALESCE($8, status),
          updated_by_account_id = $9,
          updated_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING ${articleSelectColumns}
      `,
      [
        input.id,
        input.title ?? null,
        input.content ?? null,
        input.categoryId !== undefined,
        input.categoryId ?? null,
        input.keywords !== undefined,
        input.keywords ?? null,
        input.status ?? null,
        input.actorAccountId,
      ],
    );

    return result.rows[0] ?? null;
  }

  private async upsertTagsForArticle(
    client: PoolClient,
    articleId: string,
    tagNames: string[],
  ): Promise<string[]> {
    const persistedTagNames: string[] = [];

    for (const tagName of tagNames) {
      const tagResult = await client.query<KnowledgeTagRow>(
        `
          INSERT INTO app.knowledge_tags (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE
          SET name = EXCLUDED.name
          RETURNING id::text, name
        `,
        [tagName],
      );
      const tag = tagResult.rows[0] as KnowledgeTagRow;

      await client.query(
        `
          INSERT INTO app.knowledge_article_tags (article_id, tag_id)
          VALUES ($1, $2)
          ON CONFLICT (article_id, tag_id) DO NOTHING
        `,
        [articleId, tag.id],
      );
      persistedTagNames.push(tag.name);
    }

    return persistedTagNames;
  }

  private async replaceTagsForArticle(
    client: PoolClient,
    articleId: string,
    tagNames: string[],
  ): Promise<string[]> {
    await client.query(
      `
        DELETE FROM app.knowledge_article_tags
        WHERE article_id = $1
      `,
      [articleId],
    );

    return this.upsertTagsForArticle(client, articleId, tagNames);
  }

  private async listTagNamesForArticle(client: PoolClient, articleId: string): Promise<string[]> {
    const result = await client.query<Pick<KnowledgeTagRow, 'name'>>(
      `
        SELECT tags.name
        FROM app.knowledge_article_tags article_tags
        INNER JOIN app.knowledge_tags tags ON tags.id = article_tags.tag_id
        WHERE article_tags.article_id = $1
        ORDER BY tags.name ASC
      `,
      [articleId],
    );

    return result.rows.map((row) => row.name);
  }

  private async listTagNamesByArticleIds(
    client: PoolClient,
    articleIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    if (articleIds.length === 0) {
      return new Map<string, string[]>();
    }

    const result = await client.query<{ article_id: string; name: string }>(
      `
        SELECT article_tags.article_id::text AS article_id, tags.name
        FROM app.knowledge_article_tags article_tags
        INNER JOIN app.knowledge_tags tags ON tags.id = article_tags.tag_id
        WHERE article_tags.article_id = ANY($1::uuid[])
        ORDER BY tags.name ASC
      `,
      [articleIds],
    );
    const tagNamesByArticleId = new Map<string, string[]>();

    for (const row of result.rows) {
      const tagNames = tagNamesByArticleId.get(row.article_id) ?? [];

      tagNames.push(row.name);
      tagNamesByArticleId.set(row.article_id, tagNames);
    }

    return tagNamesByArticleId;
  }
}
