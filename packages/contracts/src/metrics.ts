export interface MetricsOverview {
  consultationCount: number;
  handoffConversationCount: number;
  handoffRate: number;
  autoResolvedConversationCount: number;
  autoResolutionRate: number;
  ratingCount: number;
  averageSatisfactionScore: number | null;
}

export interface MetricsOverviewRequest {
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
}
