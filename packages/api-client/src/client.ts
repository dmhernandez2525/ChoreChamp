import type {
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  Household,
  CreateHouseholdRequest,
  CreateHouseholdResponse,
  Member,
  AddMemberRequest,
  JoinHouseholdRequest,
  JoinHouseholdResponse,
  Chore,
  CreateChoreRequest,
  ChoreCompletion,
  CompleteChoreRequest,
  TodayChore,
} from '@chorechamp/types';

interface ApiError {
  message: string;
  code?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // For cookies
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message);
    }

    return response.json();
  }

  // ===== Auth =====
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signIn(data: SignInRequest): Promise<AuthResponse> {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signOut(): Promise<void> {
    return this.request('/auth/signout', { method: 'POST' });
  }

  async getSession(): Promise<AuthResponse | null> {
    try {
      return await this.request('/auth/session');
    } catch {
      return null;
    }
  }

  // ===== Households =====
  async getHouseholds(): Promise<Household[]> {
    return this.request('/households');
  }

  async getHousehold(id: string): Promise<Household> {
    return this.request(`/households/${id}`);
  }

  async createHousehold(data: CreateHouseholdRequest): Promise<CreateHouseholdResponse> {
    return this.request('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinHousehold(data: JoinHouseholdRequest): Promise<JoinHouseholdResponse> {
    return this.request('/invites/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== Members =====
  async getMembers(householdId: string): Promise<Member[]> {
    return this.request(`/households/${householdId}/members`);
  }

  async addMember(householdId: string, data: AddMemberRequest): Promise<Member> {
    return this.request(`/households/${householdId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== Chores =====
  async getChores(householdId: string): Promise<Chore[]> {
    return this.request(`/households/${householdId}/chores`);
  }

  async getTodaysChores(householdId: string, memberId?: string): Promise<TodayChore[]> {
    const query = memberId ? `?memberId=${memberId}` : '';
    return this.request(`/households/${householdId}/chores/today${query}`);
  }

  async createChore(householdId: string, data: CreateChoreRequest): Promise<Chore> {
    return this.request(`/households/${householdId}/chores`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeChore(
    householdId: string,
    choreId: string,
    data: CompleteChoreRequest
  ): Promise<ChoreCompletion> {
    return this.request(`/households/${householdId}/chores/${choreId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveCompletion(householdId: string, completionId: string): Promise<void> {
    return this.request(`/households/${householdId}/completions/${completionId}/approve`, {
      method: 'POST',
    });
  }

  async rejectCompletion(
    householdId: string,
    completionId: string,
    reason: string
  ): Promise<void> {
    return this.request(`/households/${householdId}/completions/${completionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
