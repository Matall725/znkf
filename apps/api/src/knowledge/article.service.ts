import type {
  AuditActorRoleCode,
  AuthenticatedAccount,
  CreateKnowledgeArticleRequest,
  KnowledgeArticle,
  KnowledgeArticleStatus,
  KnowledgeCategory,
  ListKnowledgeArticlesRequest,
  ListKnowledgeArticlesResponse,
  UpdateKnowledgeArticleRequest,
} from '@znkfxt/contracts';
import type { AuditLogRepository } from '../audit/audit.repository.ts';
import { PgAuditLogRepository } from '../audit/audit.repository.ts';
import { BadRequestError, NotFoundError } from '../errors/api-error.ts';
import {
  PgKnowledgeArticleRepository,
  type KnowledgeArticleRepository,
  type UpdateKnowledgeArticleInput,
} from './article.repository.ts';

export interface KnowledgeCategoryAvailabilityChecker {
  ensureCategoryCanBeUsedForNewArticle(id: string): Promise<KnowledgeCategory>;
}

export interface KnowledgeArticleServiceOptions {
  articleRepository: KnowledgeArticleRepository;
  categoryAvailabilityChecker: KnowledgeCategoryAvailabilityChecker;
  auditLogRepository: AuditLogRepository;
}

export class KnowledgeArticleService {
  private readonly articleRepository: KnowledgeArticleRepository;
  private readonly categoryAvailabilityChecker: KnowledgeCategoryAvailabilityChecker;
  private readonly auditLogRepository: AuditLogRepository;

  constructor(options: KnowledgeArticleServiceOptions) {
    this.articleRepository = options.articleRepository;
    this.categoryAvailabilityChecker = options.categoryAvailabilityChecker;
    this.auditLogRepository = options.auditLogRepository;
  }

  async createArticle(
    request: CreateKnowledgeArticleRequest,
    actor: AuthenticatedAccount,
  ): Promise<KnowledgeArticle> {
    const title = request.title.trim();
    const content = request.content.trim();
    const categoryId = request.categoryId ?? null;

    if (!title) {
      throw new BadRequestError('Knowledge article title is required.');
    }

    if (!content) {
      throw new BadRequestError('Knowledge article content is required.');
    }

    if (categoryId) {
      await this.categoryAvailabilityChecker.ensureCategoryCanBeUsedForNewArticle(categoryId);
    }

    const article = await this.articleRepository.createArticle({
      articleType: request.articleType ?? 'faq',
      title,
      content,
      categoryId,
      keywords: normalizeTextList(request.keywords ?? []),
      tagNames: normalizeTextList(request.tagNames ?? []),
      status: request.status ?? 'draft',
      actorAccountId: actor.id,
    });

    await this.auditLogRepository.createAuditLog({
      actorAccountId: actor.id,
      actorRoleCode: selectAuditActorRole(actor),
      action: 'knowledge_article_created',
      targetType: 'knowledge_article',
      targetId: article.id,
      metadata: {
        articleType: article.articleType,
        categoryId: article.categoryId,
        keywords: article.keywords,
        status: article.status,
        tagNames: article.tagNames,
        title: article.title,
      },
    });

    return article;
  }

  async updateArticle(
    id: string,
    request: UpdateKnowledgeArticleRequest,
    actor: AuthenticatedAccount,
  ): Promise<KnowledgeArticle> {
    if (!hasUpdatePayload(request)) {
      throw new BadRequestError('At least one editable knowledge article field is required.');
    }

    const title = request.title === undefined ? undefined : request.title.trim();
    const content = request.content === undefined ? undefined : request.content.trim();

    if (title !== undefined && !title) {
      throw new BadRequestError('Knowledge article title is required.');
    }

    if (content !== undefined && !content) {
      throw new BadRequestError('Knowledge article content is required.');
    }

    if (request.categoryId) {
      await this.categoryAvailabilityChecker.ensureCategoryCanBeUsedForNewArticle(
        request.categoryId,
      );
    }

    const updateInput: UpdateKnowledgeArticleInput = {
      id,
      actorAccountId: actor.id,
      ...(title === undefined ? {} : { title }),
      ...(content === undefined ? {} : { content }),
      ...(request.categoryId === undefined ? {} : { categoryId: request.categoryId }),
      ...(request.keywords === undefined ? {} : { keywords: normalizeTextList(request.keywords) }),
      ...(request.tagNames === undefined ? {} : { tagNames: normalizeTextList(request.tagNames) }),
      ...(request.status === undefined ? {} : { status: request.status }),
    };
    const article = await this.articleRepository.updateArticle(updateInput);

    if (!article) {
      throw new NotFoundError('Knowledge article was not found.');
    }

    await this.auditLogRepository.createAuditLog({
      actorAccountId: actor.id,
      actorRoleCode: selectAuditActorRole(actor),
      action: 'knowledge_article_updated',
      targetType: 'knowledge_article',
      targetId: article.id,
      metadata: {
        changedFields: getUpdatedFieldNames(request),
        categoryId: article.categoryId,
        keywords: article.keywords,
        status: article.status,
        tagNames: article.tagNames,
        title: article.title,
      },
    });

    return article;
  }

  async setArticleStatus(
    id: string,
    status: Extract<KnowledgeArticleStatus, 'enabled' | 'disabled'>,
    actor: AuthenticatedAccount,
  ): Promise<KnowledgeArticle> {
    const existingArticle = await this.articleRepository.findArticleById(id);

    if (!existingArticle) {
      throw new NotFoundError('Knowledge article was not found.');
    }

    if (existingArticle.status === status) {
      return existingArticle;
    }

    const article = await this.articleRepository.setArticleStatus({
      id,
      status,
      actorAccountId: actor.id,
    });

    if (!article) {
      throw new NotFoundError('Knowledge article was not found.');
    }

    await this.auditLogRepository.createAuditLog({
      actorAccountId: actor.id,
      actorRoleCode: selectAuditActorRole(actor),
      action: status === 'enabled' ? 'knowledge_article_enabled' : 'knowledge_article_disabled',
      targetType: 'knowledge_article',
      targetId: article.id,
      metadata: {
        categoryId: article.categoryId,
        status: article.status,
        title: article.title,
      },
    });

    return article;
  }

  async listArticles(
    request: ListKnowledgeArticlesRequest = {},
  ): Promise<ListKnowledgeArticlesResponse> {
    const limit = normalizeLimit(request.limit);
    const offset = normalizeOffset(request.offset);
    const result = await this.articleRepository.listArticles({
      title: normalizeOptionalText(request.title),
      categoryId: request.categoryId,
      tagName: normalizeOptionalText(request.tagName),
      status: request.status,
      limit,
      offset,
    });

    return {
      articles: result.articles,
      total: result.total,
      limit,
      offset,
    };
  }
}

function hasUpdatePayload(request: UpdateKnowledgeArticleRequest): boolean {
  return (
    request.title !== undefined ||
    request.content !== undefined ||
    request.categoryId !== undefined ||
    request.keywords !== undefined ||
    request.tagNames !== undefined ||
    request.status !== undefined
  );
}

function getUpdatedFieldNames(request: UpdateKnowledgeArticleRequest): string[] {
  const fieldNames: string[] = [];

  if (request.title !== undefined) {
    fieldNames.push('title');
  }

  if (request.content !== undefined) {
    fieldNames.push('content');
  }

  if (request.categoryId !== undefined) {
    fieldNames.push('categoryId');
  }

  if (request.keywords !== undefined) {
    fieldNames.push('keywords');
  }

  if (request.tagNames !== undefined) {
    fieldNames.push('tagNames');
  }

  if (request.status !== undefined) {
    fieldNames.push('status');
  }

  return fieldNames;
}

function normalizeTextList(values: readonly string[]): string[] {
  const normalized: string[] = [];
  const seenValues = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();

    if (!trimmed || seenValues.has(trimmed)) {
      continue;
    }

    normalized.push(trimmed);
    seenValues.add(trimmed);
  }

  return normalized;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined) {
    return 20;
  }

  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new BadRequestError('Knowledge article limit must be between 1 and 100.');
  }

  return value;
}

function normalizeOffset(value: number | undefined): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestError('Knowledge article offset must be zero or a positive integer.');
  }

  return value;
}

function selectAuditActorRole(actor: AuthenticatedAccount): AuditActorRoleCode {
  if (actor.roles.includes('admin')) {
    return 'admin';
  }

  if (actor.roles.includes('knowledge_operator')) {
    return 'knowledge_operator';
  }

  return 'agent';
}

export function createKnowledgeArticleServiceFromConnectionString(
  connectionString: string,
  categoryAvailabilityChecker: KnowledgeCategoryAvailabilityChecker,
): KnowledgeArticleService {
  return new KnowledgeArticleService({
    articleRepository: PgKnowledgeArticleRepository.fromConnectionString(connectionString),
    categoryAvailabilityChecker,
    auditLogRepository: PgAuditLogRepository.fromConnectionString(connectionString),
  });
}
