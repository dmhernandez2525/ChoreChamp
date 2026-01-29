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
  GamificationStats,
  PointTransaction,
  Badge,
  StreakData,
  LeaderboardEntry,
  Reward,
  CreateRewardRequest,
  RewardRedemption,
} from '@chorechamp/types';
import { config } from '../config/env';
import { storage } from './storage';

interface ApiError {
  message: string;
  code?: string;
}

class MobileApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = config.apiUrl) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = await storage.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  // ===== Auth =====
  async signUp(data: SignUpRequest): Promise<AuthResponse & { token?: string }> {
    const response = await this.request<AuthResponse & { token?: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store the token if provided
    if (response.token) {
      await storage.setAuthToken(response.token);
    }
    if (response.user) {
      await storage.setUserData(response.user);
    }

    return response;
  }

  async signIn(data: SignInRequest): Promise<AuthResponse & { token?: string }> {
    const response = await this.request<AuthResponse & { token?: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store the token if provided
    if (response.token) {
      await storage.setAuthToken(response.token);
    }
    if (response.user) {
      await storage.setUserData(response.user);
    }

    return response;
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/auth/signout', { method: 'POST' });
    } finally {
      // Always clear local auth data
      await storage.clearAuth();
    }
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

  // ===== Gamification =====
  async getGamificationStats(householdId: string, memberId: string): Promise<GamificationStats> {
    return this.request(`/households/${householdId}/members/${memberId}/stats`);
  }

  async getPointTransactions(
    householdId: string,
    memberId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PointTransaction[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/members/${memberId}/transactions${query}`);
  }

  async getMemberStreak(householdId: string, memberId: string): Promise<StreakData> {
    return this.request(`/households/${householdId}/members/${memberId}/streak`);
  }

  async getMemberBadges(householdId: string, memberId: string): Promise<Badge[]> {
    return this.request(`/households/${householdId}/members/${memberId}/badges`);
  }

  async getLeaderboard(
    householdId: string,
    period?: 'week' | 'month' | 'all'
  ): Promise<LeaderboardEntry[]> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/households/${householdId}/leaderboard${query}`);
  }

  // ===== Rewards =====
  async getRewards(householdId: string): Promise<Reward[]> {
    return this.request(`/households/${householdId}/rewards`);
  }

  async getReward(householdId: string, rewardId: string): Promise<Reward> {
    return this.request(`/households/${householdId}/rewards/${rewardId}`);
  }

  async createReward(householdId: string, data: CreateRewardRequest): Promise<Reward> {
    return this.request(`/households/${householdId}/rewards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReward(
    householdId: string,
    rewardId: string,
    data: Partial<CreateRewardRequest>
  ): Promise<Reward> {
    return this.request(`/households/${householdId}/rewards/${rewardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReward(householdId: string, rewardId: string): Promise<void> {
    return this.request(`/households/${householdId}/rewards/${rewardId}`, {
      method: 'DELETE',
    });
  }

  async redeemReward(
    householdId: string,
    rewardId: string,
    memberId: string,
    notes?: string
  ): Promise<RewardRedemption> {
    return this.request(`/households/${householdId}/rewards/${rewardId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ memberId, notes }),
    });
  }

  async getPendingRedemptions(householdId: string): Promise<RewardRedemption[]> {
    return this.request(`/households/${householdId}/redemptions/pending`);
  }

  async approveRedemption(
    householdId: string,
    redemptionId: string
  ): Promise<RewardRedemption> {
    return this.request(`/households/${householdId}/redemptions/${redemptionId}/approve`, {
      method: 'POST',
    });
  }

  async fulfillRedemption(
    householdId: string,
    redemptionId: string
  ): Promise<RewardRedemption> {
    return this.request(`/households/${householdId}/redemptions/${redemptionId}/fulfill`, {
      method: 'POST',
    });
  }

  async rejectRedemption(
    householdId: string,
    redemptionId: string,
    reason: string
  ): Promise<RewardRedemption> {
    return this.request(`/households/${householdId}/redemptions/${redemptionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const apiClient = new MobileApiClient();
export { MobileApiClient };
