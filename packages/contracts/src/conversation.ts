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
