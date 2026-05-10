export const knowledgeCategoryStatuses = ['enabled', 'disabled'] as const;
export type KnowledgeCategoryStatus = (typeof knowledgeCategoryStatuses)[number];

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  status: KnowledgeCategoryStatus;
  createdByAccountId: string | null;
  updatedByAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeCategoryRequest {
  name: string;
  slug: string;
}

export interface UpdateKnowledgeCategoryRequest {
  name?: string | undefined;
  slug?: string | undefined;
}

export interface ListKnowledgeCategoriesResponse {
  categories: KnowledgeCategory[];
}

export const knowledgeArticleTypes = ['faq', 'document'] as const;
export type KnowledgeArticleType = (typeof knowledgeArticleTypes)[number];

export const knowledgeArticleStatuses = ['draft', 'enabled', 'disabled'] as const;
export type KnowledgeArticleStatus = (typeof knowledgeArticleStatuses)[number];

export interface KnowledgeArticle {
  id: string;
  articleType: KnowledgeArticleType;
  title: string;
  content: string;
  categoryId: string | null;
  keywords: string[];
  tagNames: string[];
  status: KnowledgeArticleStatus;
  createdByAccountId: string | null;
  updatedByAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeArticleRequest {
  articleType?: KnowledgeArticleType | undefined;
  title: string;
  content: string;
  categoryId?: string | null | undefined;
  keywords?: string[] | undefined;
  tagNames?: string[] | undefined;
  status?: KnowledgeArticleStatus | undefined;
}

export interface UpdateKnowledgeArticleRequest {
  title?: string | undefined;
  content?: string | undefined;
  categoryId?: string | null | undefined;
  keywords?: string[] | undefined;
  tagNames?: string[] | undefined;
  status?: KnowledgeArticleStatus | undefined;
}

export interface KnowledgeAnswerRequest {
  question: string;
}

export interface KnowledgeAnswerSourceArticle {
  id: string;
  title: string;
  matchedTerms: string[];
}

export interface KnowledgeAnswerResponse {
  answer: string;
  matched: boolean;
  needsHandoff: boolean;
  sourceArticle?: KnowledgeAnswerSourceArticle | undefined;
}
