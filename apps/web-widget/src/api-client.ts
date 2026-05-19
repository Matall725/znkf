import type {
  Conversation,
  ConversationMessage,
  CreateConversationResponse,
  CreateSatisfactionRatingRequest,
  ListConversationMessagesRequest,
  RequestConversationHandoffResponse,
  SatisfactionRating,
  SendVisitorMessageRequest,
  SendVisitorMessageResponse,
} from '@znkfxt/contracts';

export interface ApiClientOptions {
  baseUrl: string;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
  }

  async createOrReuseConversation(visitorId: string): Promise<CreateConversationResponse> {
    const response = await fetch(`${this.baseUrl}/visitor/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, source: 'web' }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to create conversation', response.status);
    }

    return response.json() as Promise<CreateConversationResponse>;
  }

  async sendMessage(
    conversationId: string,
    request: SendVisitorMessageRequest,
  ): Promise<SendVisitorMessageResponse> {
    const response = await fetch(
      `${this.baseUrl}/visitor/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new ApiError('Failed to send message', response.status);
    }

    return response.json() as Promise<SendVisitorMessageResponse>;
  }

  async listMessages(
    conversationId: string,
    query?: ListConversationMessagesRequest,
  ): Promise<{ messages: ConversationMessage[] }> {
    const params = new URLSearchParams();

    if (query?.limit !== undefined) {
      params.set('limit', String(query.limit));
    }

    if (query?.offset !== undefined) {
      params.set('offset', String(query.offset));
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/visitor/conversations/${encodeURIComponent(conversationId)}/messages${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError('Failed to list messages', response.status);
    }

    return response.json() as Promise<{ messages: ConversationMessage[] }>;
  }

  async closeConversation(conversationId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/visitor/conversations/${encodeURIComponent(conversationId)}/close`,
      { method: 'POST' },
    );

    if (!response.ok) {
      throw new ApiError('Failed to close conversation', response.status);
    }
  }

  async createRating(
    conversationId: string,
    request: CreateSatisfactionRatingRequest,
  ): Promise<SatisfactionRating> {
    const response = await fetch(
      `${this.baseUrl}/visitor/conversations/${encodeURIComponent(conversationId)}/rating`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new ApiError('Failed to create rating', response.status);
    }

    return response.json() as Promise<SatisfactionRating>;
  }

  async requestHandoff(conversationId: string): Promise<RequestConversationHandoffResponse> {
    const response = await fetch(
      `${this.baseUrl}/visitor/conversations/${encodeURIComponent(conversationId)}/handoff`,
      { method: 'POST' },
    );

    if (!response.ok) {
      throw new ApiError('Failed to request handoff', response.status);
    }

    return response.json() as Promise<RequestConversationHandoffResponse>;
  }
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
