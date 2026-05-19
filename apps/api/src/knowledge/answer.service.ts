import type {
  AiAnswerConfidenceLevel,
  KnowledgeAnswerRequest,
  KnowledgeAnswerResponse,
  KnowledgeArticle,
} from '@znkfxt/contracts';
import { BadRequestError } from '../errors/api-error.ts';
import {
  PgKnowledgeArticleRepository,
  type KnowledgeArticleSearchRepository,
} from './article.repository.ts';

export interface KnowledgeAnswerServiceOptions {
  articleSearchRepository: KnowledgeArticleSearchRepository;
}

export interface KnowledgeAnswerDecision {
  answer: string;
  matched: boolean;
  needsHandoff: boolean;
  confidenceLevel: AiAnswerConfidenceLevel;
  failureReason: string | null;
  sourceArticle?: {
    article: KnowledgeArticle;
    matchedTerms: string[];
  };
}

interface ScoredArticle {
  article: KnowledgeArticle;
  score: number;
  matchedTerms: string[];
}

const fallbackAnswer =
  '暂时没有找到足够准确的答案。可以转人工客服继续处理，我会保留当前问题上下文。';

const sensitiveBusinessDataAnswer =
  '这个问题涉及具体业务数据，需要人工客服核实后处理。可以转人工客服继续处理。';

const sensitiveBusinessDataPatterns = [
  '订单',
  '物流',
  '快递',
  '运单',
  '退款进度',
  '退款状态',
  '账号',
  '账户',
  '手机号',
  '身份证',
  'order',
  'tracking',
  'shipment',
  'account',
];

export class KnowledgeAnswerService {
  private readonly articleSearchRepository: KnowledgeArticleSearchRepository;

  constructor(options: KnowledgeAnswerServiceOptions) {
    this.articleSearchRepository = options.articleSearchRepository;
  }

  async answerQuestion(request: KnowledgeAnswerRequest): Promise<KnowledgeAnswerResponse> {
    const decision = await this.evaluateQuestion(request);

    return {
      answer: decision.answer,
      matched: decision.matched,
      needsHandoff: decision.needsHandoff,
      ...(decision.sourceArticle
        ? {
            sourceArticle: {
              id: decision.sourceArticle.article.id,
              title: decision.sourceArticle.article.title,
              matchedTerms: decision.sourceArticle.matchedTerms,
            },
          }
        : {}),
    };
  }

  async evaluateQuestion(request: KnowledgeAnswerRequest): Promise<KnowledgeAnswerDecision> {
    const question = request.question.trim();

    if (!question) {
      throw new BadRequestError('Question is required.');
    }

    if (containsSensitiveBusinessDataIntent(question)) {
      return {
        answer: sensitiveBusinessDataAnswer,
        matched: false,
        needsHandoff: true,
        confidenceLevel: 'none',
        failureReason: 'sensitive_business_question',
      };
    }

    const terms = buildQuestionTerms(question);
    const candidates = await this.articleSearchRepository.listAnswerableArticles({
      terms,
      limit: 20,
    });
    const bestArticle = selectBestArticle(question, terms, candidates);

    if (!bestArticle || bestArticle.score < 5) {
      return {
        answer: fallbackAnswer,
        matched: false,
        needsHandoff: true,
        confidenceLevel: 'none',
        failureReason: 'no_matching_article',
      };
    }

    return {
      confidenceLevel: bestArticle.score >= 10 ? 'high' : 'low',
      answer: bestArticle.article.content,
      matched: true,
      needsHandoff: false,
      failureReason: null,
      sourceArticle: {
        article: bestArticle.article,
        matchedTerms: bestArticle.matchedTerms,
      },
    };
  }
}

function normalizeForMatch(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s，。！？?!.,、；;：:"'“”‘’（）()[\]{}<>《》]/g, '');
}

function containsSensitiveBusinessDataIntent(question: string): boolean {
  const normalizedQuestion = normalizeForMatch(question);

  return sensitiveBusinessDataPatterns.some((pattern) =>
    normalizedQuestion.includes(normalizeForMatch(pattern)),
  );
}

function buildQuestionTerms(question: string): string[] {
  const terms = new Set<string>();
  const trimmedQuestion = question.trim();
  const normalizedQuestion = trimmedQuestion
    .replace(/[\s，。！？?!.,、；;：:"'“”‘’（）()[\]{}<>《》]+/g, ' ')
    .trim();

  terms.add(trimmedQuestion);

  for (const term of normalizedQuestion.split(/\s+/)) {
    const trimmedTerm = term.trim();

    if (trimmedTerm) {
      terms.add(trimmedTerm);
    }
  }

  return [...terms];
}

function selectBestArticle(
  question: string,
  terms: string[],
  articles: KnowledgeArticle[],
): ScoredArticle | null {
  const scoredArticles = articles
    .map((article) => scoreArticle(question, terms, article))
    .filter((article): article is ScoredArticle => article.score > 0)
    .sort((left, right) => right.score - left.score);

  return scoredArticles[0] ?? null;
}

function scoreArticle(question: string, terms: string[], article: KnowledgeArticle): ScoredArticle {
  const matchedTerms = new Set<string>();
  let score = 0;

  for (const keyword of article.keywords) {
    if (textsOverlap(question, keyword)) {
      score += 8;
      matchedTerms.add(keyword);
    }
  }

  for (const term of terms) {
    if (textsOverlap(article.title, term)) {
      score += 5;
      matchedTerms.add(term);
    }

    if (textsOverlap(article.content, term)) {
      score += 2;
      matchedTerms.add(term);
    }

    for (const tagName of article.tagNames) {
      if (textsOverlap(tagName, term)) {
        score += 2;
        matchedTerms.add(tagName);
      }
    }
  }

  return {
    article,
    score,
    matchedTerms: [...matchedTerms],
  };
}

function textsOverlap(left: string, right: string): boolean {
  const normalizedLeft = normalizeForMatch(left);
  const normalizedRight = normalizeForMatch(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

export function createKnowledgeAnswerServiceFromConnectionString(
  connectionString: string,
): KnowledgeAnswerService {
  return new KnowledgeAnswerService({
    articleSearchRepository: PgKnowledgeArticleRepository.fromConnectionString(connectionString),
  });
}
