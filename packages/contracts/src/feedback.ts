export const satisfactionRatingScores = [1, 2, 3, 4, 5] as const;
export type SatisfactionRatingScore = (typeof satisfactionRatingScores)[number];

export interface SatisfactionRating {
  id: string;
  conversationId: string;
  visitorId: string;
  score: SatisfactionRatingScore;
  comment: string | null;
  createdAt: string;
}

export interface CreateSatisfactionRatingRequest {
  score: SatisfactionRatingScore;
  comment?: string | undefined;
}
