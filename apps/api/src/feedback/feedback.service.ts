import type { CreateSatisfactionRatingRequest, SatisfactionRating } from '@znkfxt/contracts';
import {
  PgConversationRepository,
  type ConversationRepository,
  SatisfactionRatingAlreadyExistsError,
} from '../conversation/conversation.repository.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/api-error.ts';

export interface FeedbackServiceOptions {
  conversationRepository: ConversationRepository;
}

export class FeedbackService {
  private readonly conversationRepository: ConversationRepository;

  constructor(options: FeedbackServiceOptions) {
    this.conversationRepository = options.conversationRepository;
  }

  async createSatisfactionRating(
    conversationId: string,
    visitorId: string,
    request: CreateSatisfactionRatingRequest,
  ): Promise<SatisfactionRating> {
    const conversation = await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation was not found.');
    }

    if (conversation.visitorId !== visitorId) {
      throw new NotFoundError('Conversation was not found.');
    }

    if (
      !request.score ||
      request.score < 1 ||
      request.score > 5 ||
      !Number.isInteger(request.score)
    ) {
      throw new BadRequestError('Satisfaction rating score must be an integer between 1 and 5.');
    }

    const comment = request.comment !== undefined ? request.comment?.trim() || null : null;

    try {
      return await this.conversationRepository.createSatisfactionRating({
        conversationId,
        visitorId,
        score: request.score,
        comment,
      });
    } catch (error) {
      if (error instanceof SatisfactionRatingAlreadyExistsError) {
        throw new ConflictError('Satisfaction rating already exists for this conversation.');
      }

      throw error;
    }
  }
}

export function createFeedbackServiceFromConnectionString(
  connectionString: string,
): FeedbackService {
  return new FeedbackService({
    conversationRepository: PgConversationRepository.fromConnectionString(connectionString),
  });
}
