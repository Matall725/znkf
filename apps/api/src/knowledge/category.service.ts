import type {
  CreateKnowledgeCategoryRequest,
  KnowledgeCategory,
  KnowledgeCategoryStatus,
  UpdateKnowledgeCategoryRequest,
} from '@znkfxt/contracts';
import { ConflictError, NotFoundError } from '../errors/api-error.ts';
import {
  KnowledgeCategorySlugConflictError,
  PgKnowledgeCategoryRepository,
  type KnowledgeCategoryRepository,
} from './category.repository.ts';

export interface ListKnowledgeCategoriesRequest {
  status?: KnowledgeCategoryStatus | undefined;
}

export interface KnowledgeCategoryServiceOptions {
  repository: KnowledgeCategoryRepository;
}

export class KnowledgeCategoryService {
  private readonly repository: KnowledgeCategoryRepository;

  constructor(options: KnowledgeCategoryServiceOptions) {
    this.repository = options.repository;
  }

  async createCategory(
    request: CreateKnowledgeCategoryRequest,
    actorAccountId: string,
  ): Promise<KnowledgeCategory> {
    try {
      return await this.repository.createCategory({
        name: request.name.trim(),
        slug: request.slug.trim(),
        actorAccountId,
      });
    } catch (error) {
      this.throwIfSlugConflict(error);
      throw error;
    }
  }

  async updateCategory(
    id: string,
    request: UpdateKnowledgeCategoryRequest,
    actorAccountId: string,
  ): Promise<KnowledgeCategory> {
    try {
      const category = await this.repository.updateCategory({
        id,
        ...(request.name === undefined ? {} : { name: request.name.trim() }),
        ...(request.slug === undefined ? {} : { slug: request.slug.trim() }),
        actorAccountId,
      });

      if (!category) {
        throw new NotFoundError('Knowledge category was not found.');
      }

      return category;
    } catch (error) {
      this.throwIfSlugConflict(error);
      throw error;
    }
  }

  async disableCategory(id: string, actorAccountId: string): Promise<KnowledgeCategory> {
    const category = await this.repository.disableCategory({
      id,
      actorAccountId,
    });

    if (!category) {
      throw new NotFoundError('Knowledge category was not found.');
    }

    return category;
  }

  async listCategories(request: ListKnowledgeCategoriesRequest = {}): Promise<KnowledgeCategory[]> {
    return this.repository.listCategories(request);
  }

  async ensureCategoryCanBeUsedForNewArticle(id: string): Promise<KnowledgeCategory> {
    const category = await this.repository.findCategoryById(id);

    if (!category) {
      throw new NotFoundError('Knowledge category was not found.');
    }

    if (category.status === 'disabled') {
      throw new ConflictError(
        'Knowledge category is disabled and cannot be used for new articles.',
      );
    }

    return category;
  }

  private throwIfSlugConflict(error: unknown): never | void {
    if (error instanceof KnowledgeCategorySlugConflictError) {
      throw new ConflictError('Knowledge category slug already exists.');
    }
  }
}

export function createKnowledgeCategoryServiceFromConnectionString(
  connectionString: string,
): KnowledgeCategoryService {
  return new KnowledgeCategoryService({
    repository: PgKnowledgeCategoryRepository.fromConnectionString(connectionString),
  });
}
