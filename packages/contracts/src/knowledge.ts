export const knowledgeCategoryStatuses = ['enabled', 'disabled'] as const;
export type KnowledgeCategoryStatus = (typeof knowledgeCategoryStatuses)[number];

export const knowledgeArticleTypes = ['faq', 'document'] as const;
export type KnowledgeArticleType = (typeof knowledgeArticleTypes)[number];

export const knowledgeArticleStatuses = ['draft', 'enabled', 'disabled'] as const;
export type KnowledgeArticleStatus = (typeof knowledgeArticleStatuses)[number];
