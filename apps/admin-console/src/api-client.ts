import type {
  LoginRequest,
  LoginResponse,
  AuthenticatedAccount,
  KnowledgeCategory,
  CreateKnowledgeCategoryRequest,
  UpdateKnowledgeCategoryRequest,
  ListKnowledgeCategoriesResponse,
  KnowledgeArticle,
  CreateKnowledgeArticleRequest,
  UpdateKnowledgeArticleRequest,
  ListKnowledgeArticlesRequest,
  ListKnowledgeArticlesResponse,
  MetricsOverview,
} from '@znkfxt/contracts';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function setToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

function setAccount(account: AuthenticatedAccount): void {
  localStorage.setItem('admin_account', JSON.stringify(account));
}

export function getStoredAccount(): AuthenticatedAccount | null {
  const raw = localStorage.getItem('admin_account');
  return raw ? (JSON.parse(raw) as AuthenticatedAccount) : null;
}

export function clearAuth(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_account');
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
    if (res.status === 401) { clearAuth(); window.location.href = '/admin-console/'; }
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: { message?: string } })?.error?.message ?? `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
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

  getMetrics(from?: string, to?: string): Promise<MetricsOverview> {
    const params = new URLSearchParams();
    if (from) params.set('createdFrom', from);
    if (to) params.set('createdTo', to);
    const qs = params.toString();
    return api<MetricsOverview>(`/admin/metrics/overview${qs ? `?${qs}` : ''}`);
  },

  listCategories(): Promise<ListKnowledgeCategoriesResponse> {
    return api<ListKnowledgeCategoriesResponse>('/admin/knowledge/categories');
  },

  createCategory(data: CreateKnowledgeCategoryRequest): Promise<KnowledgeCategory> {
    return api<KnowledgeCategory>('/admin/knowledge/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory(id: string, data: UpdateKnowledgeCategoryRequest): Promise<KnowledgeCategory> {
    return api<KnowledgeCategory>(`/admin/knowledge/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  listArticles(params?: ListKnowledgeArticlesRequest): Promise<ListKnowledgeArticlesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.title) searchParams.set('title', params.title);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tagName) searchParams.set('tagName', params.tagName);
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return api<ListKnowledgeArticlesResponse>(`/admin/knowledge/articles${qs ? `?${qs}` : ''}`);
  },

  createArticle(data: CreateKnowledgeArticleRequest): Promise<KnowledgeArticle> {
    return api<KnowledgeArticle>('/admin/knowledge/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateArticle(id: string, data: UpdateKnowledgeArticleRequest): Promise<KnowledgeArticle> {
    return api<KnowledgeArticle>(`/admin/knowledge/articles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
