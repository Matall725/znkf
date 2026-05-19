export const conversationStatuses = [
  'bot_serving',
  'handoff_pending_confirmation',
  'waiting_agent',
  'agent_serving',
  'closed',
] as const;
export type ConversationStatus = (typeof conversationStatuses)[number];

export const conversationSources = ['web', 'h5'] as const;
export type ConversationSource = (typeof conversationSources)[number];

export const messageSenderTypes = ['visitor', 'bot', 'agent', 'system'] as const;
export type MessageSenderType = (typeof messageSenderTypes)[number];

export const messageTypes = ['text', 'system'] as const;
export type MessageType = (typeof messageTypes)[number];

export interface Conversation {
  id: string;
  visitorId: string;
  source: ConversationSource;
  status: ConversationStatus;
  assignedAgentAccountId: string | null;
  handoffRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId: string | null;
  messageType: MessageType;
  content: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  visitorId: string;
  source: ConversationSource;
}

export interface CreateConversationResponse {
  conversation: Conversation;
  reusedExistingConversation: boolean;
}

export interface ListConversationMessagesRequest {
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface SendVisitorMessageRequest {
  content: string;
}

export interface SendVisitorMessageResponse {
  conversation: Conversation;
  visitorMessage: ConversationMessage;
  botMessage?: ConversationMessage | undefined;
}

export interface SendAgentMessageRequest {
  content: string;
}

export interface SendAgentMessageResponse {
  conversation: Conversation;
  message: ConversationMessage;
}

export interface ConversationMessagesResponse {
  messages: ConversationMessage[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListWaitingConversationsRequest {
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface ListConversationsRequest {
  status?: ConversationStatus | undefined;
  visitorId?: string | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface ConversationListItem {
  conversation: Conversation;
  latestMessagePreview: string | null;
  latestMessageAt: string | null;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface RequestConversationHandoffResponse {
  conversation: Conversation;
  systemMessage: ConversationMessage;
}

export interface AcceptConversationResponse {
  conversation: Conversation;
  systemMessage: ConversationMessage;
}

export interface CloseConversationResponse {
  conversation: Conversation;
  systemMessage: ConversationMessage;
}
