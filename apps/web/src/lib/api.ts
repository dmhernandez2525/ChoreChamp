const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'chorechamp_session_token';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown Error',
      message: response.statusText,
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  async signUp(email: string, password: string, name: string) {
    const result = await fetchApi<{ token?: string; user?: unknown }>('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (result.token) setStoredToken(result.token);
    return result;
  },

  async signIn(email: string, password: string) {
    const result = await fetchApi<{ token?: string; user?: unknown }>('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.token) setStoredToken(result.token);
    return result;
  },

  async signOut() {
    try {
      await fetchApi('/api/auth/sign-out', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getSession() {
    return fetchApi<{
      user: { id: string; email: string; name: string | null };
      session: { id: string; expiresAt: string };
    } | null>('/api/auth/get-session');
  },
};

// Households API
export const householdsApi = {
  async list() {
    return fetchApi<Array<{ household: unknown; member: unknown }>>('/api/households');
  },

  async create(data: { name: string; timezone?: string; pointsName?: string }) {
    return fetchApi('/api/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(householdId: string) {
    return fetchApi(`/api/households/${householdId}`);
  },

  async join(code: string) {
    return fetchApi('/api/households/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
};

// Chores API
export const choresApi = {
  async list(householdId: string) {
    return fetchApi(`/api/${householdId}/chores`);
  },

  async create(householdId: string, data: Record<string, unknown>) {
    return fetchApi(`/api/${householdId}/chores`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async complete(householdId: string, choreId: string, data: { scheduledDate: string; photoUrl?: string }) {
    return fetchApi(`/api/${householdId}/chores/${choreId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Schedule API
export const scheduleApi = {
  async getToday(householdId: string) {
    return fetchApi(`/api/${householdId}/schedule/today`);
  },

  async getMyChores(householdId: string) {
    return fetchApi(`/api/${householdId}/schedule/my-chores`);
  },

  async getPendingApprovals(householdId: string) {
    return fetchApi(`/api/${householdId}/schedule/pending-approvals`);
  },
};

// Automation Rules API
export interface AutomationRule {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  action: string;
  actionConfig: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const automationRulesApi = {
  async list(householdId: string) {
    return fetchApi<AutomationRule[]>(`/api/${householdId}/automation/rules`);
  },

  async create(householdId: string, data: Omit<AutomationRule, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) {
    return fetchApi<AutomationRule>(`/api/${householdId}/automation/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(householdId: string, ruleId: string, data: Partial<Omit<AutomationRule, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>>) {
    return fetchApi<AutomationRule>(`/api/${householdId}/automation/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(householdId: string, ruleId: string) {
    return fetchApi(`/api/${householdId}/automation/rules/${ruleId}`, {
      method: 'DELETE',
    });
  },

  async toggle(householdId: string, ruleId: string) {
    return fetchApi<AutomationRule>(`/api/${householdId}/automation/rules/${ruleId}/toggle`, {
      method: 'POST',
    });
  },
};

// Templates API
export const templatesApi = {
  async list(params?: { category?: string; minAge?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.minAge) searchParams.set('minAge', params.minAge.toString());

    const query = searchParams.toString();
    return fetchApi(`/api/chore-templates${query ? `?${query}` : ''}`);
  },

  async getCategories() {
    return fetchApi<Array<{ id: string; name: string; icon: string }>>('/api/chore-templates/categories');
  },
};
