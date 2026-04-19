export const satisfactionRatingScores = [1, 2, 3, 4, 5] as const;
export type SatisfactionRatingScore = (typeof satisfactionRatingScores)[number];
