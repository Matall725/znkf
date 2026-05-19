export const aiAnswerConfidenceLevels = ['high', 'low', 'none'] as const;
export type AiAnswerConfidenceLevel = (typeof aiAnswerConfidenceLevels)[number];

export interface AiAnswerLog {
  id: string;
  conversationId: string;
  visitorMessageId: string;
  botMessageId: string | null;
  matchedKnowledgeArticleId: string | null;
  matched: boolean;
  needsHandoff: boolean;
  confidenceLevel: AiAnswerConfidenceLevel;
  failureReason: string | null;
  createdAt: string;
}
