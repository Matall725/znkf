import type { KnowledgeArticle } from '@znkfxt/contracts';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import { KnowledgeAnswerService } from '../src/knowledge/answer.service';
import type {
  KnowledgeArticleSearchRepository,
  ListAnswerableArticlesInput,
} from '../src/knowledge/article.repository';
import type { AppLogger } from '../src/logging/logger';
import { createApiServer } from '../src/server';

const enabledArticleId = '50000000-5000-4000-8000-000000000001';
const disabledArticleId = '50000000-5000-4000-8000-000000000002';

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

function createArticle(
  overrides: Partial<KnowledgeArticle> & Pick<KnowledgeArticle, 'id' | 'title' | 'content'>,
): KnowledgeArticle {
  const timestamp = new Date().toISOString();

  return {
    articleType: 'faq',
    categoryId: null,
    keywords: [],
    tagNames: [],
    status: 'enabled',
    createdByAccountId: null,
    updatedByAccountId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function normalizeForMatch(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s，。！？?!.,、；;：:"'“”‘’（）()[\]{}<>《》]/g, '');
}

function textMatches(left: string, right: string): boolean {
  const normalizedLeft = normalizeForMatch(left);
  const normalizedRight = normalizeForMatch(right);

  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

class TestKnowledgeArticleSearchRepository implements KnowledgeArticleSearchRepository {
  constructor(private readonly articles: KnowledgeArticle[]) {}

  async listAnswerableArticles(input: ListAnswerableArticlesInput): Promise<KnowledgeArticle[]> {
    return this.articles
      .filter((article) => article.status === 'enabled')
      .filter((article) =>
        input.terms.some(
          (term) =>
            textMatches(article.title, term) ||
            textMatches(article.content, term) ||
            article.keywords.some((keyword) => textMatches(keyword, term)) ||
            article.tagNames.some((tagName) => textMatches(tagName, term)),
        ),
      )
      .slice(0, input.limit);
  }
}

function createTestServer(articles: KnowledgeArticle[]) {
  const answerService = new KnowledgeAnswerService({
    articleSearchRepository: new TestKnowledgeArticleSearchRepository(articles),
  });

  return createApiServer({
    healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
    knowledgeAnswerService: answerService,
    logger: noopLogger,
  });
}

describe('knowledge answer demo flow', () => {
  it('answers visitor questions from enabled knowledge articles', async () => {
    const app = createTestServer([
      createArticle({
        id: enabledArticleId,
        title: '退货政策',
        content: '支持 7 天无理由退货，商品需保持完好并保留购买凭证。',
        keywords: ['退货', '售后'],
        tagNames: ['政策'],
      }),
      createArticle({
        id: disabledArticleId,
        title: '过期物流说明',
        content: '这条停用知识不应被回答使用。',
        keywords: ['物流'],
        status: 'disabled',
      }),
    ]);

    const response = await request(app)
      .post('/api/knowledge/answer')
      .send({
        question: '退货政策是什么？',
      })
      .expect(200);

    expect(response.body).toEqual({
      answer: '支持 7 天无理由退货，商品需保持完好并保留购买凭证。',
      matched: true,
      needsHandoff: false,
      sourceArticle: {
        id: enabledArticleId,
        title: '退货政策',
        matchedTerms: expect.arrayContaining(['退货']),
      },
    });
  });

  it('suggests handoff when no enabled knowledge article matches', async () => {
    const app = createTestServer([
      createArticle({
        id: enabledArticleId,
        title: '退货政策',
        content: '支持 7 天无理由退货，商品需保持完好并保留购买凭证。',
        keywords: ['退货'],
      }),
    ]);

    const response = await request(app)
      .post('/api/knowledge/answer')
      .send({
        question: '会员积分怎么兑换？',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      matched: false,
      needsHandoff: true,
    });
    expect(response.body.answer).toContain('转人工客服');
  });

  it('does not invent answers for sensitive business-data questions', async () => {
    const app = createTestServer([
      createArticle({
        id: enabledArticleId,
        title: '物流政策',
        content: '配送时效以页面说明为准。',
        keywords: ['配送'],
      }),
    ]);

    const response = await request(app)
      .post('/api/knowledge/answer')
      .send({
        question: '我的订单物流到哪里了？',
      })
      .expect(200);

    expect(response.body).toEqual({
      answer: '这个问题涉及具体业务数据，需要人工客服核实后处理。可以转人工客服继续处理。',
      matched: false,
      needsHandoff: true,
    });
  });

  it('rejects empty answer requests', async () => {
    const app = createTestServer([]);

    await request(app)
      .post('/api/knowledge/answer')
      .send({
        question: '   ',
      })
      .expect(400);
  });
});
