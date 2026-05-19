import type { MetricsOverviewRequest, MetricsOverview } from '@znkfxt/contracts';
import {
  PgConversationRepository,
  type ConversationRepository,
} from '../conversation/conversation.repository.ts';
import { BadRequestError } from '../errors/api-error.ts';

export interface MetricsServiceOptions {
  conversationRepository: ConversationRepository;
}

export class MetricsService {
  private readonly conversationRepository: ConversationRepository;

  constructor(options: MetricsServiceOptions) {
    this.conversationRepository = options.conversationRepository;
  }

  async getOverview(request: MetricsOverviewRequest = {}): Promise<MetricsOverview> {
    const createdFrom = normalizeDateTime(request.createdFrom);
    const createdTo = normalizeDateTime(request.createdTo);

    return this.conversationRepository.getMetricsOverview({
      createdFrom: createdFrom ?? undefined,
      createdTo: createdTo ?? undefined,
    });
  }
}

function normalizeDateTime(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);

  if (isNaN(parsed.getTime())) {
    throw new BadRequestError('Invalid date time format.');
  }

  return parsed.toISOString();
}

export function createMetricsServiceFromConnectionString(
  connectionString: string,
): MetricsService {
  return new MetricsService({
    conversationRepository: PgConversationRepository.fromConnectionString(connectionString),
  });
}
