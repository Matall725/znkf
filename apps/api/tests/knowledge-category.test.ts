import type {
  BackendRoleCode,
  KnowledgeCategory,
  KnowledgeCategoryStatus,
} from '@znkfxt/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { JwtAccessTokenIssuer, JwtAccessTokenVerifier } from '../src/auth/access-token';
import type {
  CreateKnowledgeCategoryInput,
  DisableKnowledgeCategoryInput,
  KnowledgeCategoryRepository,
  ListKnowledgeCategoriesFilter,
  UpdateKnowledgeCategoryInput,
} from '../src/knowledge/category.repository';
import { KnowledgeCategorySlugConflictError } from '../src/knowledge/category.repository';
import { KnowledgeCategoryService } from '../src/knowledge/category.service';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import type { AppLogger } from '../src/logging/logger';
import { createApiServer } from '../src/server';

const jwtSecret = 'knowledge-category-secret-with-at-least-32-chars';
const operatorAccountId = '00000000-0000-0000-0000-000000000017';

const categoryIds = [
  '10000000-1000-4000-8000-000000000001',
  '10000000-1000-4000-8000-000000000002',
  '10000000-1000-4000-8000-000000000003',
];

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

class TestKnowledgeCategoryRepository implements KnowledgeCategoryRepository {
  private readonly categories = new Map<string, KnowledgeCategory>();
  private nextIdIndex = 0;

  async createCategory(input: CreateKnowledgeCategoryInput): Promise<KnowledgeCategory> {
    this.throwIfSlugExists(input.slug);

    const timestamp = new Date().toISOString();
    const category: KnowledgeCategory = {
      id: categoryIds[this.nextIdIndex] as string,
      name: input.name,
      slug: input.slug,
      status: 'enabled',
      createdByAccountId: input.actorAccountId,
      updatedByAccountId: input.actorAccountId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.nextIdIndex += 1;
    this.categories.set(category.id, category);

    return category;
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
    return [...this.categories.values()]
      .filter((category) => filter.status === undefined || category.status === filter.status)
      .sort((left, right) => left.name.localeCompare(right.name));
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

function createTestServer(repository = new TestKnowledgeCategoryRepository()) {
  const service = new KnowledgeCategoryService({
    repository,
  });

  return {
    app: createApiServer({
      accessTokenVerifier: new JwtAccessTokenVerifier(jwtSecret),
      healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
      knowledgeCategoryService: service,
      logger: noopLogger,
    }),
    service,
  };
}

describe('knowledge category management', () => {
  it('creates and lists a knowledge category for knowledge operators', async () => {
    const { app } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    const createResponse = await request(app)
      .post('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${token}`)
      .send({
        name: 'Shipping Policy',
        slug: 'shipping-policy',
      })
      .expect(201);

    expect(createResponse.body).toEqual({
      id: categoryIds[0],
      name: 'Shipping Policy',
      slug: 'shipping-policy',
      status: 'enabled',
      createdByAccountId: operatorAccountId,
      updatedByAccountId: operatorAccountId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const listResponse = await request(app)
      .get('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body).toEqual({
      categories: [createResponse.body],
    });
  });

  it('updates a knowledge category name and slug', async () => {
    const { app } = createTestServer();
    const token = issueToken(['knowledge_operator']);
    const created = await request(app)
      .post('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${token}`)
      .send({
        name: 'Old Name',
        slug: 'old-name',
      })
      .expect(201);

    const response = await request(app)
      .put(`/api/admin/knowledge/categories/${created.body.id}`)
      .set('authorization', `Bearer ${token}`)
      .send({
        name: 'Returns Policy',
        slug: 'returns-policy',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      name: 'Returns Policy',
      slug: 'returns-policy',
      status: 'enabled',
      updatedByAccountId: operatorAccountId,
    });
  });

  it('disables a category and excludes it from enabled category queries', async () => {
    const { app, service } = createTestServer();
    const token = issueToken(['knowledge_operator']);
    const created = await request(app)
      .post('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${token}`)
      .send({
        name: 'Warranty',
        slug: 'warranty',
      })
      .expect(201);

    await request(app)
      .post(`/api/admin/knowledge/categories/${created.body.id}/disable`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.status as KnowledgeCategoryStatus).toBe('disabled');
      });

    await expect(
      service.ensureCategoryCanBeUsedForNewArticle(created.body.id),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Knowledge category is disabled and cannot be used for new articles.',
    });

    const enabledCategoriesResponse = await request(app)
      .get('/api/admin/knowledge/categories?status=enabled')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(enabledCategoriesResponse.body).toEqual({
      categories: [],
    });
  });

  it('rejects duplicate category slugs', async () => {
    const { app } = createTestServer();
    const token = issueToken(['knowledge_operator']);

    await request(app)
      .post('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${token}`)
      .send({
        name: 'Refund',
        slug: 'refund',
      })
      .expect(201);

    const response = await request(app)
      .post('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${token}`)
      .send({
        name: 'Duplicate Refund',
        slug: 'refund',
      })
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'Knowledge category slug already exists.',
        statusCode: 409,
        requestId: expect.any(String),
      },
    });
  });

  it('rejects agents and unauthenticated callers on knowledge category routes', async () => {
    const { app } = createTestServer();

    await request(app)
      .post('/api/admin/knowledge/categories')
      .set('authorization', `Bearer ${issueToken(['agent'])}`)
      .send({
        name: 'Agent Forbidden',
        slug: 'agent-forbidden',
      })
      .expect(403);

    await request(app).get('/api/admin/knowledge/categories').expect(401);
  });
});
