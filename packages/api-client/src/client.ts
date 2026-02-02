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
  CaregiverPermissions,
  UserHouseholdsResponse,
  CrossHouseholdPointsSummary,
  CreateTradeRequest,
  RespondToTradeRequest,
  ApproveTradeRequest,
  TradeWithDetails,
  TradeListResponse,
  TradeStatsResponse,
  AllowanceSettings,
  AllowanceSummary,
  AllowancePayout,
  AllowancePayoutWithMember,
  HouseholdAllowanceSummary,
  CreateAllowanceSettingsRequest,
  UpdateAllowanceSettingsRequest,
  MarkPayoutPaidRequest,
  ParentDashboard,
  MemberDashboardData,
  DashboardQueryParams,
  AgeGuideline,
  AgeRecommendations,
  AISchedule,
  GenerateScheduleRequest,
  ApplyScheduleRequest,
  ApplyScheduleResult,
  WorkloadData,
  CompletionPattern,
  ScheduleAnalytics,
  ScheduleSuggestion,
  ReminderPreferences,
  ReminderSuggestion,
  ReminderEffectiveness,
  SmartTimingAnalysis,
  ReminderQueueStatus,
  CreateReminderConfigRequest,
  UpdateReminderPreferencesRequest,
  ReminderChannel,
  ReminderConfig,
  VoiceCommand,
  VoiceResponse,
  VoiceSession,
  VoiceSettings,
  VoiceCommandSample,
  CalibrationSettings,
  ChoreCalibrationAnalysis,
  HouseholdCalibrationSummary,
  CalibrationHistoryEntry,
  UpdateCalibrationSettingsRequest,
  ApplyCalibrationRequest,
  BulkApplyCalibrationRequest,
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

  // ===== Multi-Household =====
  async getHouseholdContext(): Promise<UserHouseholdsResponse> {
    return this.request('/households/context');
  }

  async switchHousehold(
    householdId: string,
    setAsDefault?: boolean
  ): Promise<{ activeHouseholdId: string; isDefault: boolean }> {
    return this.request('/households/switch', {
      method: 'POST',
      body: JSON.stringify({ householdId, setAsDefault }),
    });
  }

  async updateCaregiverPermissions(
    householdId: string,
    memberId: string,
    permissions: Partial<CaregiverPermissions>
  ): Promise<Member> {
    return this.request(
      `/${householdId}/members/${memberId}/caregiver-permissions`,
      {
        method: 'PATCH',
        body: JSON.stringify({ memberId, permissions }),
      }
    );
  }

  async createMemberLink(
    householdId: string,
    sourceMemberId: string,
    targetHouseholdId: string,
    targetMemberName: string,
    shareSettings?: {
      sharePoints?: boolean;
      shareStreaks?: boolean;
      shareBadges?: boolean;
      shareChoreView?: boolean;
    }
  ): Promise<{
    link: {
      id: string;
      primaryMemberId: string;
      linkedMemberId: string;
      isActive: boolean;
    };
    targetMember: Member;
    requiresApproval: boolean;
  }> {
    return this.request(`/${householdId}/member-links`, {
      method: 'POST',
      body: JSON.stringify({
        sourceMemberId,
        targetHouseholdId,
        targetMemberName,
        shareSettings,
      }),
    });
  }

  async approveMemberLink(
    householdId: string,
    linkId: string
  ): Promise<{
    id: string;
    isActive: boolean;
    approvedByLinkedHousehold: boolean;
  }> {
    return this.request(`/${householdId}/member-links/approve`, {
      method: 'POST',
      body: JSON.stringify({ linkId }),
    });
  }

  async getPendingMemberLinks(
    householdId: string
  ): Promise<Array<{
    link: {
      id: string;
      primaryMemberId: string;
      linkedMemberId: string;
      sharePoints: boolean;
      shareStreaks: boolean;
    };
    primaryMember: Member;
    primaryHousehold: Household;
  }>> {
    return this.request(`/${householdId}/member-links/pending`);
  }

  async updateMemberLink(
    householdId: string,
    linkId: string,
    shareSettings: {
      sharePoints?: boolean;
      shareStreaks?: boolean;
      shareBadges?: boolean;
      shareChoreView?: boolean;
    }
  ): Promise<{
    id: string;
    sharePoints: boolean;
    shareStreaks: boolean;
    shareBadges: boolean;
    shareChoreView: boolean;
  }> {
    return this.request(`/${householdId}/member-links/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify({ linkId, shareSettings }),
    });
  }

  async deleteMemberLink(householdId: string, linkId: string): Promise<void> {
    return this.request(`/${householdId}/member-links/${linkId}`, {
      method: 'DELETE',
    });
  }

  async getCrossHouseholdSummary(
    householdId: string,
    memberId: string
  ): Promise<CrossHouseholdPointsSummary> {
    return this.request(
      `/${householdId}/members/${memberId}/cross-household-summary`
    );
  }

  // ===== Chore Trades =====
  async getTrades(householdId: string): Promise<TradeListResponse> {
    return this.request(`/households/${householdId}/trades`);
  }

  async getTrade(householdId: string, tradeId: string): Promise<TradeWithDetails> {
    return this.request(`/households/${householdId}/trades/${tradeId}`);
  }

  async createTrade(
    householdId: string,
    data: CreateTradeRequest
  ): Promise<TradeWithDetails> {
    return this.request(`/households/${householdId}/trades`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async respondToTrade(
    householdId: string,
    tradeId: string,
    data: RespondToTradeRequest
  ): Promise<TradeWithDetails> {
    return this.request(`/households/${householdId}/trades/${tradeId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveTrade(
    householdId: string,
    tradeId: string,
    data: ApproveTradeRequest
  ): Promise<TradeWithDetails> {
    return this.request(`/households/${householdId}/trades/${tradeId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelTrade(householdId: string, tradeId: string): Promise<{ success: boolean }> {
    return this.request(`/households/${householdId}/trades/${tradeId}`, {
      method: 'DELETE',
    });
  }

  async getTradeStats(householdId: string): Promise<TradeStatsResponse> {
    return this.request(`/households/${householdId}/trades/stats`);
  }

  // ===== Allowance Management =====
  async getHouseholdAllowanceSummary(householdId: string): Promise<HouseholdAllowanceSummary> {
    return this.request(`/households/${householdId}/allowance`);
  }

  async getMemberAllowanceSummary(
    householdId: string,
    memberId: string
  ): Promise<AllowanceSummary> {
    return this.request(`/households/${householdId}/allowance/${memberId}`);
  }

  async createAllowanceSettings(
    householdId: string,
    data: CreateAllowanceSettingsRequest
  ): Promise<AllowanceSettings> {
    return this.request(`/households/${householdId}/allowance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAllowanceSettings(
    householdId: string,
    memberId: string,
    data: UpdateAllowanceSettingsRequest
  ): Promise<AllowanceSettings> {
    return this.request(`/households/${householdId}/allowance/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async generatePayout(householdId: string, memberId: string): Promise<AllowancePayout> {
    return this.request(`/households/${householdId}/allowance/${memberId}/generate-payout`, {
      method: 'POST',
    });
  }

  async markPayoutPaid(
    householdId: string,
    payoutId: string,
    data?: MarkPayoutPaidRequest
  ): Promise<AllowancePayout> {
    return this.request(`/households/${householdId}/allowance/payouts/${payoutId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async cancelPayout(householdId: string, payoutId: string): Promise<AllowancePayout> {
    return this.request(`/households/${householdId}/allowance/payouts/${payoutId}/cancel`, {
      method: 'POST',
    });
  }

  async getPayouts(
    householdId: string,
    options?: { status?: string; memberId?: string; limit?: number }
  ): Promise<AllowancePayoutWithMember[]> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.memberId) params.set('memberId', options.memberId);
    if (options?.limit) params.set('limit', options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/allowance/payouts${query}`);
  }

  // ===== Parent Dashboard =====
  async getParentDashboard(
    householdId: string,
    params?: DashboardQueryParams
  ): Promise<ParentDashboard> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.set('period', params.period);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/households/${householdId}/dashboard${query}`);
  }

  async getMemberDashboard(
    householdId: string,
    memberId: string,
    params?: DashboardQueryParams
  ): Promise<MemberDashboardData> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.set('period', params.period);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/households/${householdId}/dashboard/member/${memberId}${query}`);
  }

  // ==================== Age-Appropriate Chore Engine ====================

  async getAgeGuidelines(householdId: string): Promise<AgeGuideline[]> {
    return this.request(`/households/${householdId}/age-appropriate/guidelines`);
  }

  async getAgeRecommendations(
    householdId: string,
    memberId: string,
    includeExisting?: boolean
  ): Promise<AgeRecommendations> {
    const query = includeExisting ? '?includeExisting=true' : '';
    return this.request(`/households/${householdId}/age-appropriate/member/${memberId}${query}`);
  }

  async assessChoreForMember(
    householdId: string,
    choreId: string,
    memberId: string
  ): Promise<{
    choreId: string;
    choreTitle: string;
    memberId: string;
    memberName: string;
    memberAge: number | null;
    suitability: string;
    message: string;
    ageGroup: string | null;
    inferredFromDifficulty?: boolean;
  }> {
    return this.request(`/households/${householdId}/age-appropriate/assess/${choreId}/${memberId}`);
  }

  async bulkAssessChoresForMember(
    householdId: string,
    memberId: string
  ): Promise<{
    memberId: string;
    memberName: string;
    memberAge: number | null;
    ageGroup: string | null;
    assessments: Array<{
      choreId: string;
      choreTitle: string;
      choreIcon: string;
      category: string;
      difficulty: string;
      suitability: string;
      message: string;
    }>;
    summary: {
      perfect: number;
      suitable: number;
      challenging: number;
      tooYoung: number;
      tooEasy: number;
    };
  }> {
    return this.request(`/households/${householdId}/age-appropriate/bulk-assess/${memberId}`);
  }

  // ==================== AI Scheduling ====================

  async generateAISchedule(
    householdId: string,
    params?: GenerateScheduleRequest
  ): Promise<AISchedule> {
    return this.request(`/households/${householdId}/ai-schedule/generate`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  async applyAISchedule(
    householdId: string,
    scheduleId: string,
    suggestionIds: string[],
    suggestions: ScheduleSuggestion[]
  ): Promise<ApplyScheduleResult> {
    return this.request(`/households/${householdId}/ai-schedule/apply`, {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        suggestionIds,
        suggestions,
      } as ApplyScheduleRequest & { suggestions: ScheduleSuggestion[] }),
    });
  }

  async getWorkloadAnalysis(
    householdId: string,
    params?: { period?: string; startDate?: string }
  ): Promise<{
    period: { start: string; end: string };
    workload: WorkloadData[];
  }> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.set('period', params.period);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/households/${householdId}/ai-schedule/workload${query}`);
  }

  async getMemberPatterns(
    householdId: string,
    memberId: string
  ): Promise<CompletionPattern> {
    return this.request(`/households/${householdId}/ai-schedule/patterns/${memberId}`);
  }

  async getScheduleAnalytics(
    householdId: string,
    params?: { period?: string; startDate?: string }
  ): Promise<ScheduleAnalytics> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.set('period', params.period);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/households/${householdId}/ai-schedule/analytics${query}`);
  }

  // ==================== Smart Reminders ====================

  async getReminderPreferences(
    householdId: string,
    memberId: string
  ): Promise<ReminderPreferences> {
    return this.request(`/households/${householdId}/reminders/preferences/${memberId}`);
  }

  async updateReminderPreferences(
    householdId: string,
    memberId: string,
    data: UpdateReminderPreferencesRequest
  ): Promise<ReminderPreferences> {
    return this.request(`/households/${householdId}/reminders/preferences/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getReminderSuggestions(householdId: string): Promise<ReminderSuggestion[]> {
    return this.request(`/households/${householdId}/reminders/suggestions`);
  }

  async getSmartTimingAnalysis(
    householdId: string,
    memberId: string
  ): Promise<SmartTimingAnalysis> {
    return this.request(`/households/${householdId}/reminders/smart-timing/${memberId}`);
  }

  async getReminderEffectiveness(householdId: string): Promise<ReminderEffectiveness[]> {
    return this.request(`/households/${householdId}/reminders/effectiveness`);
  }

  async getReminderQueueStatus(householdId: string): Promise<ReminderQueueStatus> {
    return this.request(`/households/${householdId}/reminders/queue-status`);
  }

  async createReminderConfig(
    householdId: string,
    data: CreateReminderConfigRequest
  ): Promise<ReminderConfig> {
    return this.request(`/households/${householdId}/reminders/configs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReminderConfigs(
    householdId: string,
    memberId?: string
  ): Promise<ReminderConfig[]> {
    const query = memberId ? `?memberId=${memberId}` : '';
    return this.request(`/households/${householdId}/reminders/configs${query}`);
  }

  async deleteReminderConfig(householdId: string, configId: string): Promise<{ success: boolean }> {
    return this.request(`/households/${householdId}/reminders/configs/${configId}`, {
      method: 'DELETE',
    });
  }

  async sendTestReminder(
    householdId: string,
    memberId: string,
    channel: ReminderChannel
  ): Promise<{ success: boolean; message: string; sentAt: string }> {
    return this.request(`/households/${householdId}/reminders/test`, {
      method: 'POST',
      body: JSON.stringify({ memberId, channel }),
    });
  }

  // ==================== Voice Assistant ====================

  async processVoiceCommand(
    householdId: string,
    text: string,
    sessionId?: string
  ): Promise<{
    sessionId: string;
    command: VoiceCommand;
    response: VoiceResponse;
  }> {
    return this.request(`/households/${householdId}/voice/process`, {
      method: 'POST',
      body: JSON.stringify({ text, sessionId }),
    });
  }

  async getVoiceCommands(householdId: string): Promise<{
    commands: VoiceCommandSample[];
    byCategory: Record<string, VoiceCommandSample[]>;
    totalCommands: number;
  }> {
    return this.request(`/households/${householdId}/voice/commands`);
  }

  async getVoiceSettings(householdId: string): Promise<VoiceSettings> {
    return this.request(`/households/${householdId}/voice/settings`);
  }

  async updateVoiceSettings(
    householdId: string,
    settings: Partial<VoiceSettings>
  ): Promise<VoiceSettings> {
    return this.request(`/households/${householdId}/voice/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getVoiceSession(
    householdId: string,
    sessionId: string
  ): Promise<VoiceSession> {
    return this.request(`/households/${householdId}/voice/session/${sessionId}`);
  }

  async endVoiceSession(
    householdId: string,
    sessionId: string
  ): Promise<{ success: boolean }> {
    return this.request(`/households/${householdId}/voice/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Difficulty Calibration ====================

  async getCalibrationSummary(householdId: string): Promise<HouseholdCalibrationSummary> {
    return this.request(`/households/${householdId}/calibration`);
  }

  async getCalibrationSettings(householdId: string): Promise<CalibrationSettings> {
    return this.request(`/households/${householdId}/calibration/settings`);
  }

  async updateCalibrationSettings(
    householdId: string,
    settings: UpdateCalibrationSettingsRequest
  ): Promise<CalibrationSettings> {
    return this.request(`/households/${householdId}/calibration/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getChoreCalibration(
    householdId: string,
    choreId: string
  ): Promise<ChoreCalibrationAnalysis> {
    return this.request(`/households/${householdId}/calibration/chore/${choreId}`);
  }

  async applyCalibration(
    householdId: string,
    calibration: ApplyCalibrationRequest
  ): Promise<{
    success: boolean;
    chore: unknown;
    historyEntry: CalibrationHistoryEntry;
  }> {
    return this.request(`/households/${householdId}/calibration/apply`, {
      method: 'POST',
      body: JSON.stringify(calibration),
    });
  }

  async bulkApplyCalibration(
    householdId: string,
    request: BulkApplyCalibrationRequest
  ): Promise<{
    applied: number;
    failed: number;
    results: Array<{ choreId: string; success: boolean; error?: string }>;
  }> {
    return this.request(`/households/${householdId}/calibration/bulk-apply`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCalibrationHistory(
    householdId: string,
    limit?: number
  ): Promise<CalibrationHistoryEntry[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/households/${householdId}/calibration/history${query}`);
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
