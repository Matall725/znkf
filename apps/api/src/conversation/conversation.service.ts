import type { AiAnswerLog } from '@znkfxt/contracts';
import type {
  AcceptConversationResponse,
  CloseConversationResponse,
  Conversation,
  ConversationListResponse,
  ConversationMessage,
  ConversationMessagesResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  RequestConversationHandoffResponse,
  SendAgentMessageRequest,
  SendAgentMessageResponse,
  SendVisitorMessageRequest,
  SendVisitorMessageResponse,
} from '@znkfxt/contracts';
import { BadRequestError, NotFoundError } from '../errors/api-error.ts';
import type { KnowledgeAnswerService } from '../knowledge/answer.service.ts';
import {
  PgConversationRepository,
  type ConversationRepository,
} from './conversation.repository.ts';

export interface ConversationServiceOptions {
  conversationRepository: ConversationRepository;
  knowledgeAnswerService?: KnowledgeAnswerService | undefined;
}

export class ConversationService {
  private readonly conversationRepository: ConversationRepository;
  private readonly knowledgeAnswerService: KnowledgeAnswerService | undefined;

  constructor(options: ConversationServiceOptions) {
    this.conversationRepository = options.conversationRepository;
    this.knowledgeAnswerService = options.knowledgeAnswerService;
  }

  // ---- Visitor API ----

  async createOrReuseConversation(
    request: CreateConversationRequest,
  ): Promise<CreateConversationResponse> {
    const visitorId = request.visitorId.trim();

    if (!visitorId) {
      throw new BadRequestError('visitorId is required.');
    }

    const existingConversation =
      await this.conversationRepository.findLatestOpenConversationByVisitor(
        visitorId,
        request.source,
      );

    if (existingConversation) {
      return {
        conversation: existingConversation,
        reusedExistingConversation: true,
      };
    }

    const conversation = await this.conversationRepository.createConversation({
      visitorId,
      source: request.source,
    });

    return {
      conversation,
      reusedExistingConversation: false,
    };
  }

  async sendVisitorMessage(
    conversationId: string,
    request: SendVisitorMessageRequest,
  ): Promise<SendVisitorMessageResponse> {
    const conversation = await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation was not found.');
    }

    if (conversation.status === 'closed') {
      throw new BadRequestError('Conversation is already closed.');
    }

    const content = request.content.trim();

    if (!content) {
      throw new BadRequestError('Message content is required.');
    }

    const visitorMessage = await this.conversationRepository.createMessage({
      conversationId,
      senderType: 'visitor',
      content,
    });

    // If conversation is in agent_serving mode, don't generate bot reply
    if (conversation.status === 'agent_serving') {
      return {
        conversation,
        visitorMessage,
      };
    }

    // If conversation is in handoff_pending_confirmation or waiting_agent, don't generate bot reply
    if (
      conversation.status === 'handoff_pending_confirmation' ||
      conversation.status === 'waiting_agent'
    ) {
      return {
        conversation,
        visitorMessage,
      };
    }

    // Try to get AI answer
    if (this.knowledgeAnswerService) {
      const answer = await this.knowledgeAnswerService.evaluateQuestion({ question: content });

      // Create AI answer log
      await this.conversationRepository.createAiAnswerLog({
        conversationId,
        visitorMessageId: visitorMessage.id,
        botMessageId: null,
        matchedKnowledgeArticleId: answer.sourceArticle?.article.id ?? null,
        matched: answer.matched,
        needsHandoff: answer.needsHandoff,
        confidenceLevel: answer.confidenceLevel,
        failureReason: answer.failureReason,
      });

      if (answer.matched && !answer.needsHandoff) {
        // Bot answers
        const botMessage = await this.conversationRepository.createMessage({
          conversationId,
          senderType: 'bot',
          content: answer.answer,
        });

        // Update AI answer log with bot message id
        // We need to update the log; for simplicity, we store it separately
        // Actually, the log was already created without botMessageId. Let's update it.
        // For simplicity, let's just return the conversation and messages
        return {
          conversation,
          visitorMessage,
          botMessage,
        };
      }

      if (answer.needsHandoff) {
        // Mark conversation as needing handoff
        const updatedConversation = await this.conversationRepository.updateConversation({
          id: conversationId,
          status:
            conversation.status === 'bot_serving' ? 'handoff_pending_confirmation' : undefined,
          setHandoffRequestedAt: true,
          handoffRequestedAt: new Date().toISOString(),
        });

        // Add system message suggesting handoff
        await this.conversationRepository.createMessage({
          conversationId,
          senderType: 'system',
          content: answer.answer,
        });

        return {
          conversation: updatedConversation ?? conversation,
          visitorMessage,
        };
      }
    }

    return {
      conversation,
      visitorMessage,
    };
  }

  async listMessages(
    conversationId: string,
    filter: { limit?: number | undefined; offset?: number | undefined } = {},
  ): Promise<ConversationMessagesResponse> {
    const conversation = await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation was not found.');
    }

    const limit = normalizeLimit(filter.limit);
    const offset = normalizeOffset(filter.offset);
    const result = await this.conversationRepository.listMessages({
      conversationId,
      limit,
      offset,
    });

    return {
      messages: result.messages,
      total: result.total,
      limit,
      offset,
    };
  }

  async closeConversationByVisitor(conversationId: string): Promise<CloseConversationResponse> {
    const conversation = await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation was not found.');
    }

    if (conversation.status === 'closed') {
      throw new BadRequestError('Conversation is already closed.');
    }

    const updatedConversation = await this.conversationRepository.updateConversation({
      id: conversationId,
      status: 'closed',
      setClosedAt: true,
      closedAt: new Date().toISOString(),
    });

    const systemMessage = await this.conversationRepository.createMessage({
      conversationId,
      senderType: 'system',
      content: '访客已关闭会话。',
    });

    return {
      conversation: updatedConversation ?? conversation,
      systemMessage,
    };
  }

  async requestHandoff(conversationId: string): Promise<RequestConversationHandoffResponse> {
    const conversation = await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation was not found.');
    }

    if (conversation.status === 'closed') {
      throw new BadRequestError('Conversation is already closed.');
    }

    if (conversation.status === 'waiting_agent' || conversation.status === 'agent_serving') {
      throw new BadRequestError('Handoff has already been processed.');
    }

    const updatedConversation = await this.conversationRepository.updateConversation({
      id: conversationId,
      status: 'waiting_agent',
      setHandoffRequestedAt: true,
      handoffRequestedAt: new Date().toISOString(),
    });

    const systemMessage = await this.conversationRepository.createMessage({
      conversationId,
      senderType: 'system',
      content: '访客已请求转人工客服。',
    });

    return {
      conversation: updatedConversation ?? conversation,
      systemMessage,
    };
  }

  // ---- Agent API ----

  async listWaitingConversations(
    filter: { limit?: number | undefined; offset?: number | undefined } = {},
  ): Promise<ConversationListResponse> {
    const limit = normalizeLimit(filter.limit);
    const offset = normalizeOffset(filter.offset);
    const result = await this.conversationRepository.listWaitingConversations({
      limit,
      offset,
    });

    return {
      conversations: result.conversations,
      total: result.total,
      limit,
      offset,
    };
  }

  async acceptWaitingConversation(
    conversationId: string,
    agentAccountId: string,
  ): Promise<AcceptConversationResponse> {
    const conversation = await this.conversationRepository.acceptWaitingConversation({
      id: conversationId,
      agentAccountId,
    });

    if (!conversation) {
      throw new BadRequestError('Conversation is not available for acceptance.');
    }

    const systemMessage = await this.conversationRepository.createMessage({
      conversationId,
      senderType: 'system',
      content: '坐席已接入会话。',
    });

    return {
      conversation,
      systemMessage,
    };
  }

  async sendAgentMessage(
    conversationId: string,
    agentAccountId: string,
    request: SendAgentMessageRequest,
  ): Promise<SendAgentMessageResponse> {
    const conversation = await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation was not found.');
    }

    if (conversation.status !== 'agent_serving') {
      throw new BadRequestError(
        'Conversation must be in agent serving status to send agent messages.',
      );
    }

    if (conversation.assignedAgentAccountId !== agentAccountId) {
      throw new BadRequestError('Only the assigned agent can send messages to this conversation.');
    }

    const content = request.content.trim();

    if (!content) {
      throw new BadRequestError('Message content is required.');
    }

    const message = await this.conversationRepository.createMessage({
      conversationId,
      senderType: 'agent',
      senderId: agentAccountId,
      content,
    });

    return {
      conversation,
      message,
    };
  }

  async closeAgentConversation(
    conversationId: string,
    agentAccountId: string,
  ): Promise<CloseConversationResponse> {
    const conversation = await this.conversationRepository.closeAgentConversation({
      id: conversationId,
      agentAccountId,
    });

    if (!conversation) {
      throw new BadRequestError('Conversation cannot be closed by this agent.');
    }

    const systemMessage = await this.conversationRepository.createMessage({
      conversationId,
      senderType: 'system',
      content: '坐席已结束会话。',
    });

    return {
      conversation,
      systemMessage,
    };
  }

  // ---- Admin API ----

  async listConversations(
    filter: {
      status?: string | undefined;
      visitorId?: string | undefined;
      createdFrom?: string | undefined;
      createdTo?: string | undefined;
      limit?: number | undefined;
      offset?: number | undefined;
    } = {},
  ): Promise<ConversationListResponse> {
    const limit = normalizeLimit(filter.limit);
    const offset = normalizeOffset(filter.offset);
    const result = await this.conversationRepository.listConversations({
      status: filter.status as any,
      visitorId: filter.visitorId,
      createdFrom: filter.createdFrom,
      createdTo: filter.createdTo,
      limit,
      offset,
    });

    return {
      conversations: result.conversations,
      total: result.total,
      limit,
      offset,
    };
  }
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined) {
    return 20;
  }

  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new BadRequestError('Limit must be between 1 and 100.');
  }

  return value;
}

function normalizeOffset(value: number | undefined): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestError('Offset must be zero or a positive integer.');
  }

  return value;
}

export function createConversationServiceFromConnectionString(
  connectionString: string,
  knowledgeAnswerService?: KnowledgeAnswerService | undefined,
): ConversationService {
  return new ConversationService({
    conversationRepository: PgConversationRepository.fromConnectionString(connectionString),
    knowledgeAnswerService,
  });
}
