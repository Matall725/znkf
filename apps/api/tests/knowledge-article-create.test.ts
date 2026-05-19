import type {
  AuditLog,
  BackendRoleCode,
  KnowledgeArticle,
  KnowledgeCategory,
  KnowledgeCategoryStatus,
} from '@znkfxt/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { JwtAccessTokenIssuer, JwtAccessTokenVerifier } from '../src/auth/access-token';
import type { CreateAuditLogInput, AuditLogRepository } from '../src/audit/audit.repository';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import { KnowledgeAnswerService } from '../src/knowledge/answer.service';
import type {
  CreateKnowledgeArticleInput,
  KnowledgeArticleRepository,
  KnowledgeArticleSearchRepository,
  ListAnswerableArticlesInput,
  ListKnowledgeArticlesFilter,
  SetKnowledgeArticleStatusInput,
  UpdateKnowledgeArticleInput,
} from '../src/knowledge/article.repository';
import { KnowledgeArticleService } from '../src/knowledge/article.service';
import type {
  CreateKnowledgeCategoryInput,
  DisableKnowledgeCategoryInput,
  KnowledgeCategoryRepository,
  ListKnowledgeCategoriesFilter,
  UpdateKnowledgeCategoryInput,
} from '../src/knowledge/category.repository';
import { KnowledgeCategorySlugConflictError } from '../src/knowledge/category.repository';
import { KnowledgeCategoryService } from '../src/knowledge/category.service';
import type { AppLogger } from '../src/logging/logger';
import { createApiServer } from '../src/server';

const jwtSecret = 'knowledge-article-secret-with-at-least-32-chars';
const operatorAccountId = '00000000-0000-0000-0000-000000000018';
const enabledCategoryId = '20000000-2000-4000-8000-000000000001';
const disabledCategoryId = '20000000-2000-4000-8000-000000000002';
const articleIds = [
  '30000000-3000-4000-8000-000000000001',
  '30000000-3000-4000-8000-000000000002',
  '30000000-3000-4000-8000-000000000003',
] as const;
const firstAuditLogId = '40000000-4000-4000-8000-000000000001';

const healthyCheck = (name: HealthDependencyCheck['name']): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status: 'ok',
    latencyMs: 1,
  }),
});

const noopLogger: AppLogger = {
  info() {
    return undefined;
  },
  error() {
    return undefined;
  },
};

function issueToken(roles: BackendRoleCode[]): string {
  return new JwtAccessTokenIssuer(jwtSecret, 3600).issueToken({
    id: operatorAccountId,
    loginName: `${roles[0]}@example.com`,
    displayName: `${roles[0]} user`,
    status: 'enabled',
    roles,
  });
}

function createCategory(id: string, status: KnowledgeCategoryStatus): KnowledgeCategory {
  const timestamp = new Date().toISOString();

  return {
    id,
    name: status === 'enabled' ? 'Enabled Category' : 'Disabled Category',
    slug: status === 'enabled' ? 'enabled-category' : 'disabled-category',
    status,
    createdByAccountId: operatorAccountId,
    updatedByAccountId: operatorAccountId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

class TestKnowledgeCategoryRepository implements KnowledgeCategoryRepository {
  private readonly categories = new Map<string, KnowledgeCategory>();

  constructor() {
    this.categories.set(enabledCategoryId, createCategory(enabledCategoryId, 'enabled'));
    this.categories.set(disabledCategoryId, createCategory(disabledCategoryId, 'disabled'));
  }

  async createCategory(input: CreateKnowledgeCategoryInput): Promise<KnowledgeCategory> {
    this.throwIfSlugExists(input.slug);

    const created: KnowledgeCategory = {
      ...createCategory(enabledCategoryId, 'enabled'),
      name: input.name,
      slug: input.slug,
      createdByAccountId: input.actorAccountId,
      updatedByAccountId: input.actorAccountId,
    };

    this.categories.set(created.id, created);

    return created;
  }

  async updateCategory(input: UpdateKnowledgeCategoryInput): Promise<KnowledgeCategory | null> {
    const category = this.categories.get(input.id);

    if (!category) {
      return null;
    }

    if (input.slug !== undefined) {
      this.throwIfSlugExists(input.slug, input.id);
    }

    const updated: KnowledgeCategory = {
      ...category,
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.slug === undefined ? {} : { slug: input.slug }),
      updatedByAccountId: input.actorAccountId,
      updatedAt: new Date().toISOString(),
    };

    this.categories.set(input.id, updated);

    return updated;
  }

  async disableCategory(input: DisableKnowledgeCategoryInput): Promise<KnowledgeCategory | null> {
    const category = this.categories.get(input.id);

    if (!category) {
      return null;
    }

    const disabled: KnowledgeCategory = {
      ...category,
      status: 'disabled',
      updatedByAccountId: input.actorAccountId,
      updatedAt: new Date().toISOString(),
    };

    this.categories.set(input.id, disabled);

    return disabled;
  }

  async findCategoryById(id: string): Promise<KnowledgeCategory | null> {
    return this.categories.get(id) ?? null;
  }

  async listCategories(filter: ListKnowledgeCategoriesFilter = {}): Promise<KnowledgeCategory[]> {
    return [...this.categories.values()].filter(
      (category) => filter.status === undefined || category.status === filter.status,
    );
  }

  private throwIfSlugExists(slug: string, ignoredCategoryId?: string): void {
    const duplicate = [...this.categories.values()].find(
      (category) => category.slug === slug && category.id !== ignoredCategoryId,
    );

    if (duplicate) {
      throw new KnowledgeCategorySlugConflictError(slug);
    }
  }
}

class TestKnowledgeArticleRepository
  implements KnowledgeArticleRepository, KnowledgeArticleSearchRepository
{
  readonly articles: KnowledgeArticle[] = [];
  private nextIdIndex = 0;

  async createArticle(input: CreateKnowledgeArticleInput): Promise<KnowledgeArticle> {
    const timestamp = new Date().toISOString();
    const article: KnowledgeArticle = {
      id: articleIds[this.nextIdIndex] as string,
      articleType: input.articleType,
      title: input.title,
      content: input.content,
      categoryId: input.categoryId,
      keywords: input.keywords,
      tagNames: input.tagNames,
      status: input.status,
      createdByAccountId: input.actorAccountId,
      updatedByAccountId: input.actorAccountId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.nextIdIndex += 1;
    this.articles.push(article);

    return article;
  }

  async updateArticle(input: UpdateKnowledgeArticleInput): Promise<KnowledgeArticle | null> {
    const articleIndex = this.articles.findIndex((article) => article.id === input.id);

    if (articleIndex === -1) {
      return null;
    }

    const existing = this.articles[articleIndex] as KnowledgeArticle;
    const updated: KnowledgeArticle = {
      ...existing,
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.content === undefined ? {} : { content: input.content }),
      ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      ...(input.keywords === undefined ? {} : { keywords: input.keywords }),
      ...(input.tagNames === undefined ? {} : { tagNames: input.tagNames }),
      ...(input.status === undefined ? {} : { status: input.status }),
      updatedByAccountId: input.actorAccountId,
      updatedAt: new Date().toISOString(),
    };

    this.articles[articleIndex] = updated;

    return updated;
  }

  async setArticleStatus(input: SetKnowledgeArticleStatusInput): Promise<KnowledgeArticle | null> {
    return this.updateArticle({
      id: input.id,
      status: input.status,
      actorAccountId: input.actorAccountId,
    });
  }

  async findArticleById(id: string): Promise<KnowledgeArticle | null> {
    return this.articles.find((article) => article.id === id) ?? null;
  }

  async listArticles(
    filter: ListKnowledgeArticlesFilter,
  ): Promise<{ articles: KnowledgeArticle[]; total: number }> {
    const filtered = this.articles.filter((article) => {
      if (
        filter.title &&
        !normalizeForMatch(article.title).includes(normalizeForMatch(filter.title))
      ) {
        return false;
      }

      if (filter.categoryId && article.categoryId !== filter.categoryId) {
        return false;
      }

      if (filter.tagName && !article.tagNames.includes(filter.tagName)) {
        return false;
      }

      if (filter.status && article.status !== filter.status) {
        return false;
      }

      return true;
    });

    return {
      articles: filtered.slice(filter.offset, filter.offset + filter.limit),
      total: filtered.length,
    };
  }

  async listAnswerableArticles(input: ListAnswerableArticlesInput): Promise<KnowledgeArticle[]> {
    return this.articles
      .filter((article) => article.status === 'enabled')
      .filter((article) =>
        input.terms.some((term) => {
          const normalizedTerm = normalizeForMatch(term);

          return (
            normalizeForMatch(article.title).includes(normalizedTerm) ||
            normalizeForMatch(article.content).includes(normalizedTerm) ||
            article.keywords.some((keyword) =>
              normalizeForMatch(keyword).includes(normalizedTerm),
            ) ||
            article.tagNames.some((tagName) =>
              normalizeForMatch(tagName).includes(normalizedTerm),
            )
          );
        }),
      )
      .slice(0, input.limit);
  }
}

class TestAuditLogRepository implements AuditLogRepository {
  readonly logs: AuditLog[] = [];

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: `${firstAuditLogId}-${this.logs.length + 1}`,
      actorAccountId: input.actorAccountId,
      actorRoleCode: input.actorRoleCode,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    this.logs.push(auditLog);

    return auditLog;
  }
}

function createTestServer() {
  const categoryService = new KnowledgeCategoryService({
    repository: new TestKnowledgeCategoryRepository(),
  });
  const articleRepository = new TestKnowledgeArticleRepository();
  const auditLogRepository = new TestAuditLogRepository();
  const articleService = new KnowledgeArticleService({
    articleRepository,
    categoryAvailabilityChecker: categoryService,
    auditLogRepository,
  });

  return {
    app: createApiServer({
      accessTokenVerifier: new JwtAccessTokenVerifier(jwtSecret),
      healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
      knowledgeArticleService: articleService,
      logger: noopLogger,
    }),
    articleRepository,
    auditLogRepository,
  };
}

describe('knowledge article management', () => {
  it('creates a knowledge article and writes an audit record for knowledge operators', async () => {
    const { app, auditLogRepository } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    const response = await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        articleType: 'document',
        title: ' Return Policy ',
        content: ' Customers can request returns within 30 days. ',
        categoryId: enabledCategoryId,
        keywords: [' return ', 'refund', 'return'],
        tagNames: ['policy', ' after-sales ', 'policy'],
        status: 'enabled',
      })
      .expect(201);

    expect(response.body).toEqual({
      id: articleIds[0],
      articleType: 'document',
      title: 'Return Policy',
      content: 'Customers can request returns within 30 days.',
      categoryId: enabledCategoryId,
      keywords: ['return', 'refund'],
      tagNames: ['policy', 'after-sales'],
      status: 'enabled',
      createdByAccountId: operatorAccountId,
      updatedByAccountId: operatorAccountId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(auditLogRepository.logs).toHaveLength(1);
    expect(auditLogRepository.logs[0]).toMatchObject({
      actorAccountId: operatorAccountId,
      actorRoleCode: 'knowledge_operator',
      action: 'knowledge_article_created',
      targetType: 'knowledge_article',
      targetId: articleIds[0],
      metadata: {
        articleType: 'document',
        categoryId: enabledCategoryId,
        keywords: ['return', 'refund'],
        status: 'enabled',
        tagNames: ['policy', 'after-sales'],
        title: 'Return Policy',
      },
    });
  });

  it('rejects requests missing title or content', async () => {
    const { app, auditLogRepository } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        content: 'A content body without a title.',
      })
      .expect(400);

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'A title without content',
      })
      .expect(400);

    expect(auditLogRepository.logs).toHaveLength(0);
  });

  it('rejects disabled categories for new knowledge articles', async () => {
    const { app, auditLogRepository } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    const response = await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Disabled Category Article',
        content: 'This should not be accepted.',
        categoryId: disabledCategoryId,
      })
      .expect(409);

    expect(response.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'Knowledge category is disabled and cannot be used for new articles.',
      statusCode: 409,
    });
    expect(auditLogRepository.logs).toHaveLength(0);
  });

  it('rejects agents on knowledge article creation', async () => {
    const { app } = createTestServer();

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${issueToken(['agent'])}`)
      .send({
        title: 'Agent Forbidden',
        content: 'Agents cannot maintain knowledge articles.',
      })
      .expect(403);
  });

  it('updates a knowledge article and writes an audit record for every edit', async () => {
    const { app, articleRepository, auditLogRepository } = createTestServer();
    const token = issueToken(['knowledge_operator']);
    const created = await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Old Title',
        content: 'Old body.',
        keywords: ['old'],
        tagNames: ['legacy'],
      })
      .expect(201);

    const response = await request(app)
      .put(`/api/admin/knowledge/articles/${created.body.id}`)
      .set('authorization', `Bearer ${token}`)
      .send({
        title: ' Updated Return Policy ',
        content: ' Updated body for returns. ',
        categoryId: enabledCategoryId,
        keywords: ['returns', 'refunds', 'returns'],
        tagNames: ['policy', 'returns', 'policy'],
        status: 'enabled',
      })
      .expect(200);

    expect(response.body).toEqual({
      id: articleIds[0],
      articleType: 'faq',
      title: 'Updated Return Policy',
      content: 'Updated body for returns.',
      categoryId: enabledCategoryId,
      keywords: ['returns', 'refunds'],
      tagNames: ['policy', 'returns'],
      status: 'enabled',
      createdByAccountId: operatorAccountId,
      updatedByAccountId: operatorAccountId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(articleRepository.articles[0]).toEqual(response.body);
    expect(auditLogRepository.logs).toHaveLength(2);
    expect(auditLogRepository.logs[1]).toMatchObject({
      actorAccountId: operatorAccountId,
      actorRoleCode: 'knowledge_operator',
      action: 'knowledge_article_updated',
      targetType: 'knowledge_article',
      targetId: articleIds[0],
      metadata: {
        changedFields: ['title', 'content', 'categoryId', 'keywords', 'tagNames', 'status'],
        categoryId: enabledCategoryId,
        keywords: ['returns', 'refunds'],
        status: 'enabled',
        tagNames: ['policy', 'returns'],
        title: 'Updated Return Policy',
      },
    });
  });

  it('rejects disabled categories and empty edit bodies on knowledge article update', async () => {
    const { app, auditLogRepository } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Editable Article',
        content: 'This article will be edited.',
      })
      .expect(201);

    await request(app)
      .put(`/api/admin/knowledge/articles/${articleIds[0]}`)
      .set('authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    const response = await request(app)
      .put(`/api/admin/knowledge/articles/${articleIds[0]}`)
      .set('authorization', `Bearer ${token}`)
      .send({
        categoryId: disabledCategoryId,
      })
      .expect(409);

    expect(response.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'Knowledge category is disabled and cannot be used for new articles.',
      statusCode: 409,
    });
    expect(auditLogRepository.logs).toHaveLength(1);
  });

  it('rejects agents on knowledge article update', async () => {
    const { app } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Protected Article',
        content: 'Agents cannot edit this article.',
      })
      .expect(201);

    await request(app)
      .put(`/api/admin/knowledge/articles/${articleIds[0]}`)
      .set('authorization', `Bearer ${issueToken(['agent'])}`)
      .send({
        title: 'Agent Edited',
      })
      .expect(403);
  });

  it('lists knowledge articles with filters and pagination', async () => {
    const { app } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Returns Policy',
        content: 'First article body.',
        categoryId: enabledCategoryId,
        tagNames: ['policy'],
        status: 'enabled',
      })
      .expect(201);

    await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Billing FAQ',
        content: 'Second article body.',
        tagNames: ['billing'],
      })
      .expect(201);

    const response = await request(app)
      .get('/api/admin/knowledge/articles')
      .query({
        status: 'enabled',
        title: 'returns',
        tagName: 'policy',
        limit: 10,
        offset: 0,
      })
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      articles: [
        expect.objectContaining({
          id: articleIds[0],
          title: 'Returns Policy',
          status: 'enabled',
        }),
      ],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });

  it('enables and disables articles without exposing disabled items to answers', async () => {
    const { app, articleRepository, auditLogRepository } = createTestServer();
    const token = issueToken(['knowledge_operator']);
    const created = await request(app)
      .post('/api/admin/knowledge/articles')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: 'Warranty Terms',
        content: 'Warranty claims can be filed within one year.',
        keywords: ['warranty'],
        status: 'draft',
      })
      .expect(201);

    await request(app)
      .post(`/api/admin/knowledge/articles/${created.body.id}/enable`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('enabled');
      });

    const answerService = new KnowledgeAnswerService({
      articleSearchRepository: articleRepository,
    });
    await expect(
      answerService.answerQuestion({
        question: 'warranty',
      }),
    ).resolves.toMatchObject({
      matched: true,
      needsHandoff: false,
    });

    await request(app)
      .post(`/api/admin/knowledge/articles/${created.body.id}/disable`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('disabled');
      });

    await expect(
      answerService.answerQuestion({
        question: 'warranty',
      }),
    ).resolves.toMatchObject({
      matched: false,
      needsHandoff: true,
    });
    expect(auditLogRepository.logs).toHaveLength(3);
    expect(auditLogRepository.logs[1]).toMatchObject({
      action: 'knowledge_article_enabled',
      targetId: created.body.id,
    });
    expect(auditLogRepository.logs[2]).toMatchObject({
      action: 'knowledge_article_disabled',
      targetId: created.body.id,
    });
  });
});
