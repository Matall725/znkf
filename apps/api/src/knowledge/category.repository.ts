import type { KnowledgeCategory, KnowledgeCategoryStatus } from '@znkfxt/contracts';
import { Pool } from 'pg';

export interface CreateKnowledgeCategoryInput {
  name: string;
  slug: string;
  actorAccountId: string;
}

export interface UpdateKnowledgeCategoryInput {
  id: string;
  name?: string;
  slug?: string;
  actorAccountId: string;
}

export interface DisableKnowledgeCategoryInput {
  id: string;
  actorAccountId: string;
}

export interface ListKnowledgeCategoriesFilter {
  status?: KnowledgeCategoryStatus | undefined;
}

export interface KnowledgeCategoryRepository {
  createCategory(input: CreateKnowledgeCategoryInput): Promise<KnowledgeCategory>;
  updateCategory(input: UpdateKnowledgeCategoryInput): Promise<KnowledgeCategory | null>;
  disableCategory(input: DisableKnowledgeCategoryInput): Promise<KnowledgeCategory | null>;
  findCategoryById(id: string): Promise<KnowledgeCategory | null>;
  listCategories(filter?: ListKnowledgeCategoriesFilter): Promise<KnowledgeCategory[]>;
}

interface KnowledgeCategoryRow {
  id: string;
  name: string;
  slug: string;
  status: KnowledgeCategoryStatus;
  created_by_account_id: string | null;
  updated_by_account_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PgErrorLike {
  code?: string;
  constraint?: string;
}

export class KnowledgeCategorySlugConflictError extends Error {
  constructor(slug: string) {
    super(`Knowledge category slug already exists: ${slug}`);
    this.name = 'KnowledgeCategorySlugConflictError';
  }
}

function isKnowledgeCategorySlugConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const pgError = error as PgErrorLike;

  return pgError.code === '23505' && pgError.constraint === 'knowledge_categories_slug_unique';
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toKnowledgeCategory(row: KnowledgeCategoryRow): KnowledgeCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdByAccountId: row.created_by_account_id,
    updatedByAccountId: row.updated_by_account_id,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

const categorySelectColumns = `
  id::text,
  name,
  slug,
  status,
  created_by_account_id::text,
  updated_by_account_id::text,
  created_at,
  updated_at
`;

export class PgKnowledgeCategoryRepository implements KnowledgeCategoryRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  static fromConnectionString(connectionString: string): PgKnowledgeCategoryRepository {
    return new PgKnowledgeCategoryRepository(
      new Pool({
        connectionString,
      }),
    );
  }

  async createCategory(input: CreateKnowledgeCategoryInput): Promise<KnowledgeCategory> {
    try {
      const result = await this.pool.query<KnowledgeCategoryRow>(
        `
          INSERT INTO app.knowledge_categories (
            name,
            slug,
            created_by_account_id,
            updated_by_account_id
          )
          VALUES ($1, $2, $3, $3)
          RETURNING ${categorySelectColumns}
        `,
        [input.name, input.slug, input.actorAccountId],
      );

      return toKnowledgeCategory(result.rows[0] as KnowledgeCategoryRow);
    } catch (error) {
      if (isKnowledgeCategorySlugConflict(error)) {
        throw new KnowledgeCategorySlugConflictError(input.slug);
      }

      throw error;
    }
  }

  async updateCategory(input: UpdateKnowledgeCategoryInput): Promise<KnowledgeCategory | null> {
    try {
      const result = await this.pool.query<KnowledgeCategoryRow>(
        `
          UPDATE app.knowledge_categories
          SET
            name = COALESCE($2, name),
            slug = COALESCE($3, slug),
            updated_by_account_id = $4,
            updated_at = now()
          WHERE id = $1
          RETURNING ${categorySelectColumns}
        `,
        [input.id, input.name ?? null, input.slug ?? null, input.actorAccountId],
      );
      const row = result.rows[0];

      return row ? toKnowledgeCategory(row) : null;
    } catch (error) {
      if (isKnowledgeCategorySlugConflict(error)) {
        throw new KnowledgeCategorySlugConflictError(input.slug ?? '');
      }

      throw error;
    }
  }

  async disableCategory(input: DisableKnowledgeCategoryInput): Promise<KnowledgeCategory | null> {
    const result = await this.pool.query<KnowledgeCategoryRow>(
      `
        UPDATE app.knowledge_categories
        SET
          status = 'disabled',
          updated_by_account_id = $2,
          updated_at = now()
        WHERE id = $1
        RETURNING ${categorySelectColumns}
      `,
      [input.id, input.actorAccountId],
    );
    const row = result.rows[0];

    return row ? toKnowledgeCategory(row) : null;
  }

  async findCategoryById(id: string): Promise<KnowledgeCategory | null> {
    const result = await this.pool.query<KnowledgeCategoryRow>(
      `
        SELECT ${categorySelectColumns}
        FROM app.knowledge_categories
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0];

    return row ? toKnowledgeCategory(row) : null;
  }

  async listCategories(filter: ListKnowledgeCategoriesFilter = {}): Promise<KnowledgeCategory[]> {
    const result = await this.pool.query<KnowledgeCategoryRow>(
      `
        SELECT ${categorySelectColumns}
        FROM app.knowledge_categories
        WHERE ($1::text IS NULL OR status = $1)
        ORDER BY name ASC, created_at ASC
      `,
      [filter.status ?? null],
    );

    return result.rows.map(toKnowledgeCategory);
  }
}
