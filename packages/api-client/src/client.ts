import type {
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  Household,
  CreateHouseholdRequest,
  CreateHouseholdResponse,
  Member,
  AddMemberRequest,
  UpdateMemberRequest,
  JoinHouseholdRequest,
  JoinHouseholdResponse,
  InviteCode,
  CreateInviteCodeRequest,
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
  BossBattle,
  CreateBossBattleRequest,
  DamageBossResponse,
  ActivityFeedResponse,
  ActivityStats,
  ReportSummary,
  ReportTrend,
  ReportCategories,
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

  async updateProfile(data: { name?: string }): Promise<AuthResponse> {
    return this.request('/auth/update-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(): Promise<void> {
    return this.request('/auth/delete-user', {
      method: 'POST',
    });
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

  async updateMember(
    householdId: string,
    memberId: string,
    data: UpdateMemberRequest
  ): Promise<Member> {
    return this.request(`/households/${householdId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMember(householdId: string, memberId: string): Promise<void> {
    return this.request(`/households/${householdId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // ===== Invite Codes =====
  async getInviteCodes(householdId: string): Promise<InviteCode[]> {
    return this.request(`/households/${householdId}/invites`);
  }

  async createInviteCode(
    householdId: string,
    data: CreateInviteCodeRequest
  ): Promise<InviteCode> {
    return this.request(`/households/${householdId}/invites`, {
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

  // ===== Boss Battles =====
  async getCurrentBossBattle(householdId: string): Promise<BossBattle | null> {
    return this.request(`/households/${householdId}/boss-battles/current`);
  }

  async getBossBattleHistory(
    householdId: string,
    limit?: number
  ): Promise<BossBattle[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/households/${householdId}/boss-battles/history${query}`);
  }

  async createBossBattle(
    householdId: string,
    data: CreateBossBattleRequest
  ): Promise<BossBattle> {
    return this.request(`/households/${householdId}/boss-battles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async damageBoss(
    householdId: string,
    battleId: string,
    damage: number
  ): Promise<DamageBossResponse> {
    return this.request(`/households/${householdId}/boss-battles/${battleId}/damage`, {
      method: 'POST',
      body: JSON.stringify({ damage }),
    });
  }

  async getBossBattle(householdId: string, battleId: string): Promise<BossBattle> {
    return this.request(`/households/${householdId}/boss-battles/${battleId}`);
  }

  // ===== Activity Feed =====
  async getActivityFeed(
    householdId: string,
    options?: {
      limit?: number;
      offset?: number;
      memberId?: string;
      type?: string;
      since?: string;
    }
  ): Promise<ActivityFeedResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.memberId) params.set('memberId', options.memberId);
    if (options?.type) params.set('type', options.type);
    if (options?.since) params.set('since', options.since);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/activity${query}`);
  }

  async getActivityStats(
    householdId: string,
    period?: 'day' | 'week' | 'month'
  ): Promise<ActivityStats> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/households/${householdId}/activity/stats${query}`);
  }

  // ===== Reports =====
  async getReportSummary(
    householdId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ReportSummary> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/reports/summary${query}`);
  }

  async getReportTrend(
    householdId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      memberId?: string;
    }
  ): Promise<ReportTrend> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    if (options?.memberId) params.set('memberId', options.memberId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/reports/trend${query}`);
  }

  async getReportCategories(
    householdId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ReportCategories> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/reports/categories${query}`);
  }

  async exportReport(
    householdId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      format?: 'json' | 'csv';
    }
  ): Promise<Blob | { period: { start: Date; end: Date }; completions: unknown[] }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    if (options?.format) params.set('format', options.format);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/reports/export${query}`);
  }

  // ===== Notifications =====
  async registerPushToken(
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceName?: string
  ): Promise<{ success: boolean }> {
    return this.request('/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform, deviceName }),
    });
  }

  async unregisterPushToken(token: string): Promise<{ success: boolean }> {
    return this.request('/notifications/push-token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  }

  async getNotificationPreferences(): Promise<{
    id: string;
    pushEnabled: boolean;
    choreReminders: boolean;
    streakReminders: boolean;
    approvalRequests: boolean;
    familyUpdates: boolean;
    celebrations: boolean;
    weeklySummary: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    maxDailyNotifications: number;
  }> {
    return this.request('/notifications/preferences');
  }

  async updateNotificationPreferences(
    preferences: Partial<{
      pushEnabled: boolean;
      choreReminders: boolean;
      streakReminders: boolean;
      approvalRequests: boolean;
      familyUpdates: boolean;
      celebrations: boolean;
      weeklySummary: boolean;
      quietHoursEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
      maxDailyNotifications: number;
    }>
  ): Promise<{
    id: string;
    pushEnabled: boolean;
    choreReminders: boolean;
    streakReminders: boolean;
    approvalRequests: boolean;
    familyUpdates: boolean;
    celebrations: boolean;
    weeklySummary: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    maxDailyNotifications: number;
  }> {
    return this.request('/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  async getNotificationHistory(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Array<{
    id: string;
    notificationType: string;
    title: string;
    body: string;
    status: string;
    createdAt: Date;
  }>> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/notifications/history${query}`);
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
