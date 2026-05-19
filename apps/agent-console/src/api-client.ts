import type {
  LoginRequest,
  LoginResponse,
  AuthenticatedAccount,
  ConversationListItem,
  Conversation,
  ConversationMessage,
  ConversationListResponse,
  SendAgentMessageResponse,
  CloseConversationResponse,
  AcceptConversationResponse,
} from '@znkfxt/contracts';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('agent_token');
}

function setToken(token: string): void {
  localStorage.setItem('agent_token', token);
}

function setAccount(account: AuthenticatedAccount): void {
  localStorage.setItem('agent_account', JSON.stringify(account));
}

export function getStoredAccount(): AuthenticatedAccount | null {
  const raw = localStorage.getItem('agent_account');
  return raw ? (JSON.parse(raw) as AuthenticatedAccount) : null;
}

export function clearAuth(): void {
  localStorage.removeItem('agent_token');
  localStorage.removeItem('agent_account');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) { clearAuth(); window.location.href = '/agent-console/'; }
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: { message?: string } })?.error?.message ?? `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const agentApi = {
  login(data: LoginRequest): Promise<LoginResponse> {
    return api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((res) => {
      setToken(res.accessToken);
      setAccount(res.account);
      return res;
    });
  },

  listWaitingConversations(limit = 50, offset = 0): Promise<ConversationListResponse> {
    return api<ConversationListResponse>(`/agent/conversations/waiting?limit=${limit}&offset=${offset}`);
  },

  listActiveConversations(limit = 50, offset = 0): Promise<ConversationListResponse> {
    return api<ConversationListResponse>(`/agent/conversations?status=agent_serving&limit=${limit}&offset=${offset}`);
  },

  acceptConversation(conversationId: string): Promise<AcceptConversationResponse> {
    return api<AcceptConversationResponse>(`/agent/conversations/${encodeURIComponent(conversationId)}/accept`, { method: 'POST' });
  },

  getMessages(conversationId: string): Promise<{ messages: ConversationMessage[] }> {
    return api<{ messages: ConversationMessage[] }>(`/agent/conversations/${encodeURIComponent(conversationId)}/messages`);
  },

  sendMessage(conversationId: string, content: string): Promise<SendAgentMessageResponse> {
    return api<SendAgentMessageResponse>(`/agent/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  closeConversation(conversationId: string): Promise<CloseConversationResponse> {
    return api<CloseConversationResponse>(`/agent/conversations/${encodeURIComponent(conversationId)}/close`, { method: 'POST' });
  },
};
