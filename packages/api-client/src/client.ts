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
  StreakProtectionSettings,
  HouseholdStreakSummary,
  StreakPrediction,
  StreakAnalytics,
  UpdateProtectionSettingsRequest,
  FamilyChallenge,
  ChallengeSummary,
  HouseholdChallengesOverview,
  CreateChallengeRequest,
  UpdateChallengeRequest,
  ChallengeTemplate,
  CommunityTemplate,
  TemplateSearchParams,
  TemplateSearchResult,
  TemplateCollection,
  MyTemplatesOverview,
  CreateCommunityTemplateRequest,
  UpdateCommunityTemplateRequest,
  SubmitReviewRequest,
  ImportTemplateRequest,
  TemplateReview,
  Achievement,
  AchievementShowcase,
  AchievementLeaderboard,
  AchievementFeed,
  AchievementShare,
  AchievementCategory,
  UpdateShowcaseRequest,
  ShareAchievementRequest,
  SeasonalEvent,
  EventCalendar,
  EventParticipation,
  HouseholdEventStats,
  FamilyAnalytics,
  AnalyticsPeriod,
  MemberInsight,
  InsightRecommendation,
  PeriodComparison,
  AnalyticsExport,
  SubscriptionPlansResponse,
  SubscriptionStatusResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  RevenueCatSyncRequest,
  RevenueCatSyncResponse,
  SupportThread,
  SupportMessage,
  CreateSupportThreadRequest,
  CreateSupportMessageRequest,
  SupportThreadWithMessages,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  StoreCatalogItem,
  StoreWallet,
  StoreEntitlement,
  StorePurchase,
  StoreReceipt,
  StoreRefundRequest,
  StorePurchaseControls,
  StoreGiftCard,
  CreateStorePurchaseRequest,
  ApproveStorePurchaseRequest,
  RequestStoreRefundRequest,
  ResolveStoreRefundRequest,
  UpdateStorePurchaseControlsRequest,
  CreateStoreGiftCardRequest,
  RedeemStoreGiftCardRequest,
  EnterpriseOverviewResponse,
  EnterpriseDistrict,
  CreateEnterpriseDistrictRequest,
  EnterpriseSchool,
  CreateEnterpriseSchoolRequest,
  UpdateEnterpriseSchoolRequest,
  EnterpriseClassroom,
  EnterpriseClassroomStudent,
  EnterpriseAssignment,
  CreateEnterpriseClassroomRequest,
  EnterpriseStudentWithProfile,
  AddEnterpriseStudentRequest,
  BulkImportEnterpriseStudentsRequest,
  EnterpriseBulkImportResult,
  EnterpriseAssignmentWithSubmissions,
  CreateEnterpriseAssignmentRequest,
  EnterpriseAssignmentSubmission,
  SubmitEnterpriseAssignmentRequest,
  ReviewEnterpriseSubmissionRequest,
  EnterpriseClassroomDashboard,
  EnterpriseChallenge,
  CreateEnterpriseChallengeRequest,
  EnterpriseChallengeParticipation,
  EnterpriseLmsProvider,
  EnterpriseLmsIntegration,
  ConfigureEnterpriseLmsRequest,
  EnterpriseLmsSyncResult,
  EnterpriseParentVisibility,
  SetEnterpriseParentVisibilityRequest,
  EnterpriseSchoolAdminAnalytics,
  EnterpriseReportFile,
  EnterpriseBulkImport,
  EnterpriseAdminAuditEvent,
  ApiPlatformDeveloperOverview,
  ApiPlatformOpenApiDocument,
  ApiPlatformKeySettings,
  ApiPlatformUsageEvent,
  ApiPlatformWebhookSubscription,
  ApiPlatformWebhookDelivery,
  ApiPlatformMarketplaceApp,
  ApiPlatformAppRequest,
  ApiPlatformOAuthClient,
  ApiPlatformSdkPackage,
  ApiPlatformWebhookEventType,
  CreateApiPlatformWebhookSubscriptionRequest,
  UpdateApiPlatformWebhookSubscriptionRequest,
  EmitApiPlatformWebhookEventRequest,
  CreateApiPlatformOAuthClientRequest,
  CreateApiPlatformOAuthClientResponse,
  AuthorizeApiPlatformOAuthRequest,
  AuthorizeApiPlatformOAuthResponse,
  ExchangeApiPlatformOAuthTokenRequest,
  ExchangeApiPlatformOAuthTokenResponse,
  RequestApiPlatformMarketplaceAppRequest,
  ReviewApiPlatformMarketplaceRequest,
  CreateApiPlatformSdkPackageRequest,
  ApiPlatformAnalyticsResponse,
  UpdateApiPlatformKeySettingsRequest,
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
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

  async updateHousehold(
    householdId: string,
    data: Partial<CreateHouseholdRequest> & {
      weekStartsOn?: number;
      pointsName?: string;
      currency?: string;
      themeId?: string | null;
      brandingName?: string | null;
      brandingLogoUrl?: string | null;
    }
  ): Promise<Household> {
    return this.request(`/households/${householdId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async leaveHousehold(householdId: string): Promise<void> {
    return this.request(`/households/${householdId}/leave`, {
      method: 'POST',
    });
  }

  async deleteHousehold(householdId: string): Promise<void> {
    return this.request(`/households/${householdId}`, {
      method: 'DELETE',
    });
  }

  async joinHousehold(data: JoinHouseholdRequest): Promise<JoinHouseholdResponse> {
    return this.request('/invites/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== Subscription =====
  async getSubscriptionPlans(householdId: string): Promise<SubscriptionPlansResponse> {
    return this.request(`/subscription/${householdId}/plans`);
  }

  async getSubscriptionStatus(householdId: string): Promise<SubscriptionStatusResponse> {
    return this.request(`/subscription/${householdId}/status`);
  }

  async createCheckoutSession(
    householdId: string,
    data: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    return this.request(`/subscription/${householdId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPortalSession(
    householdId: string,
    data: CreatePortalSessionRequest
  ): Promise<CreatePortalSessionResponse> {
    return this.request(`/subscription/${householdId}/portal`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncRevenueCat(
    householdId: string,
    data: RevenueCatSyncRequest
  ): Promise<RevenueCatSyncResponse> {
    return this.request(`/subscription/${householdId}/revenuecat/sync`, {
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

  async createInviteCode(householdId: string, data: CreateInviteCodeRequest): Promise<InviteCode> {
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

  async rejectCompletion(householdId: string, completionId: string, reason: string): Promise<void> {
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

  async approveRedemption(householdId: string, redemptionId: string): Promise<RewardRedemption> {
    return this.request(`/households/${householdId}/redemptions/${redemptionId}/approve`, {
      method: 'POST',
    });
  }

  async fulfillRedemption(householdId: string, redemptionId: string): Promise<RewardRedemption> {
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

  // ===== Support =====
  async getSupportThreads(householdId: string): Promise<SupportThread[]> {
    return this.request(`/households/${householdId}/support/threads`);
  }

  async getSupportThread(
    householdId: string,
    threadId: string
  ): Promise<SupportThreadWithMessages> {
    return this.request(`/households/${householdId}/support/threads/${threadId}`);
  }

  async createSupportThread(
    householdId: string,
    data: CreateSupportThreadRequest
  ): Promise<{ thread: SupportThread; message: SupportMessage }> {
    return this.request(`/households/${householdId}/support/threads`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSupportMessage(
    householdId: string,
    threadId: string,
    data: CreateSupportMessageRequest
  ): Promise<SupportMessage> {
    return this.request(`/households/${householdId}/support/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupportThreadStatus(
    householdId: string,
    threadId: string,
    status: 'open' | 'pending' | 'closed'
  ): Promise<SupportThread> {
    return this.request(`/households/${householdId}/support/threads/${threadId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // ===== API Keys =====
  async getApiKeys(householdId: string): Promise<ApiKey[]> {
    return this.request(`/households/${householdId}/api-keys`);
  }

  async createApiKey(
    householdId: string,
    data: CreateApiKeyRequest
  ): Promise<CreateApiKeyResponse> {
    return this.request(`/households/${householdId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeApiKey(householdId: string, keyId: string): Promise<ApiKey> {
    return this.request(`/households/${householdId}/api-keys/${keyId}/revoke`, {
      method: 'POST',
    });
  }

  // ===== API Platform & Integrations =====
  async getApiPlatformOverview(householdId: string): Promise<ApiPlatformDeveloperOverview> {
    return this.request(`/households/${householdId}/developer/overview`);
  }

  async getApiPlatformOpenApi(householdId: string): Promise<ApiPlatformOpenApiDocument> {
    return this.request(`/households/${householdId}/developer/openapi`);
  }

  async getApiPlatformDeveloperApiKeys(
    householdId: string
  ): Promise<{ keys: Array<ApiKey & { settings: ApiPlatformKeySettings | null }> }> {
    return this.request(`/households/${householdId}/developer/api-keys`);
  }

  async updateApiPlatformKeySettings(
    householdId: string,
    keyId: string,
    data: UpdateApiPlatformKeySettingsRequest
  ): Promise<ApiPlatformKeySettings> {
    return this.request(`/households/${householdId}/developer/api-keys/${keyId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getApiPlatformKeyUsage(
    householdId: string,
    keyId: string
  ): Promise<{ usage: ApiPlatformUsageEvent[] }> {
    return this.request(`/households/${householdId}/developer/api-keys/${keyId}/usage`);
  }

  async getApiPlatformWebhooks(
    householdId: string
  ): Promise<{ subscriptions: ApiPlatformWebhookSubscription[] }> {
    return this.request(`/households/${householdId}/developer/webhooks`);
  }

  async createApiPlatformWebhook(
    householdId: string,
    data: CreateApiPlatformWebhookSubscriptionRequest
  ): Promise<ApiPlatformWebhookSubscription> {
    return this.request(`/households/${householdId}/developer/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApiPlatformWebhook(
    householdId: string,
    subscriptionId: string,
    data: UpdateApiPlatformWebhookSubscriptionRequest
  ): Promise<ApiPlatformWebhookSubscription> {
    return this.request(`/households/${householdId}/developer/webhooks/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async emitApiPlatformWebhook(
    householdId: string,
    data: EmitApiPlatformWebhookEventRequest
  ): Promise<{ dispatchedCount: number }> {
    return this.request(`/households/${householdId}/developer/webhooks/emit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApiPlatformWebhookDeliveries(
    householdId: string
  ): Promise<{ deliveries: ApiPlatformWebhookDelivery[] }> {
    return this.request(`/households/${householdId}/developer/webhooks/deliveries`);
  }

  async getApiPlatformMarketplaceApps(
    householdId: string
  ): Promise<{ apps: ApiPlatformMarketplaceApp[] }> {
    return this.request(`/households/${householdId}/developer/marketplace/apps`);
  }

  async getApiPlatformMarketplaceRequests(
    householdId: string
  ): Promise<{ requests: ApiPlatformAppRequest[] }> {
    return this.request(`/households/${householdId}/developer/marketplace/requests`);
  }

  async requestApiPlatformMarketplaceApp(
    householdId: string,
    data: RequestApiPlatformMarketplaceAppRequest
  ): Promise<ApiPlatformAppRequest> {
    return this.request(`/households/${householdId}/developer/marketplace/requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reviewApiPlatformMarketplaceRequest(
    householdId: string,
    requestId: string,
    data: ReviewApiPlatformMarketplaceRequest
  ): Promise<ApiPlatformAppRequest> {
    return this.request(`/households/${householdId}/developer/marketplace/requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApiPlatformOAuthClients(
    householdId: string
  ): Promise<{ clients: ApiPlatformOAuthClient[] }> {
    return this.request(`/households/${householdId}/developer/oauth/clients`);
  }

  async createApiPlatformOAuthClient(
    householdId: string,
    data: CreateApiPlatformOAuthClientRequest
  ): Promise<CreateApiPlatformOAuthClientResponse> {
    return this.request(`/households/${householdId}/developer/oauth/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApiPlatformSdkPackages(
    householdId: string
  ): Promise<{ sdkPackages: ApiPlatformSdkPackage[] }> {
    return this.request(`/households/${householdId}/developer/sdk-packages`);
  }

  async upsertApiPlatformSdkPackage(
    householdId: string,
    data: CreateApiPlatformSdkPackageRequest
  ): Promise<ApiPlatformSdkPackage> {
    return this.request(`/households/${householdId}/developer/sdk-packages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApiPlatformAnalytics(householdId: string): Promise<ApiPlatformAnalyticsResponse> {
    return this.request(`/households/${householdId}/developer/analytics`);
  }

  async getPublicApiPlatformOpenApi(): Promise<ApiPlatformOpenApiDocument> {
    return this.request('/public/v1/openapi.json');
  }

  async authorizeApiPlatformOAuth(
    data: AuthorizeApiPlatformOAuthRequest
  ): Promise<AuthorizeApiPlatformOAuthResponse> {
    return this.request('/oauth/authorize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exchangeApiPlatformOAuthToken(
    data: ExchangeApiPlatformOAuthTokenRequest
  ): Promise<ExchangeApiPlatformOAuthTokenResponse> {
    return this.request('/oauth/token', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPublicApiHouseholdChores(
    householdId: string,
    options: { apiKey?: string; accessToken?: string } = {}
  ): Promise<{ data: Chore[]; count: number }> {
    const headers: Record<string, string> = {};
    if (options.apiKey) headers['X-API-Key'] = options.apiKey;
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    return this.request(`/public/v1/households/${householdId}/chores`, { headers });
  }

  async getPublicApiHouseholdMembers(
    householdId: string,
    options: { apiKey?: string; accessToken?: string } = {}
  ): Promise<{ data: Array<Pick<Member, 'id' | 'householdId' | 'name' | 'role' | 'color' | 'avatarUrl' | 'createdAt'>>; count: number }> {
    const headers: Record<string, string> = {};
    if (options.apiKey) headers['X-API-Key'] = options.apiKey;
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    return this.request(`/public/v1/households/${householdId}/members`, { headers });
  }

  async emitPublicApiHouseholdEvent(
    householdId: string,
    eventType: ApiPlatformWebhookEventType,
    payload: Record<string, unknown>,
    options: { apiKey?: string; accessToken?: string } = {}
  ): Promise<{ dispatchedCount: number }> {
    const headers: Record<string, string> = {};
    if (options.apiKey) headers['X-API-Key'] = options.apiKey;
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    return this.request(`/public/v1/households/${householdId}/events/${eventType}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  // ===== Enterprise School Edition =====
  async getEnterpriseOverview(householdId: string): Promise<EnterpriseOverviewResponse> {
    return this.request(`/households/${householdId}/enterprise/overview`);
  }

  async getEnterpriseDistricts(householdId: string): Promise<{ districts: EnterpriseDistrict[] }> {
    return this.request(`/households/${householdId}/enterprise/districts`);
  }

  async createEnterpriseDistrict(
    householdId: string,
    data: CreateEnterpriseDistrictRequest
  ): Promise<EnterpriseDistrict> {
    return this.request(`/households/${householdId}/enterprise/districts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEnterpriseSchools(householdId: string): Promise<{ schools: EnterpriseSchool[] }> {
    return this.request(`/households/${householdId}/enterprise/schools`);
  }

  async createEnterpriseSchool(
    householdId: string,
    data: CreateEnterpriseSchoolRequest
  ): Promise<EnterpriseSchool> {
    return this.request(`/households/${householdId}/enterprise/schools`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEnterpriseSchool(
    householdId: string,
    schoolId: string,
    data: UpdateEnterpriseSchoolRequest
  ): Promise<EnterpriseSchool> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getEnterpriseClassrooms(
    householdId: string,
    schoolId: string
  ): Promise<{ classrooms: EnterpriseClassroom[] }> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}/classrooms`);
  }

  async createEnterpriseClassroom(
    householdId: string,
    schoolId: string,
    data: CreateEnterpriseClassroomRequest
  ): Promise<EnterpriseClassroom> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}/classrooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEnterpriseStudents(
    householdId: string,
    classroomId: string
  ): Promise<{ students: EnterpriseStudentWithProfile[] }> {
    return this.request(`/households/${householdId}/enterprise/classrooms/${classroomId}/students`);
  }

  async addEnterpriseStudent(
    householdId: string,
    classroomId: string,
    data: AddEnterpriseStudentRequest
  ): Promise<EnterpriseClassroomStudent> {
    return this.request(
      `/households/${householdId}/enterprise/classrooms/${classroomId}/students`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async importEnterpriseStudents(
    householdId: string,
    classroomId: string,
    data: BulkImportEnterpriseStudentsRequest
  ): Promise<EnterpriseBulkImportResult> {
    return this.request(
      `/households/${householdId}/enterprise/classrooms/${classroomId}/students/import`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async exportEnterpriseStudents(
    householdId: string,
    classroomId: string
  ): Promise<EnterpriseReportFile> {
    return this.request(
      `/households/${householdId}/enterprise/classrooms/${classroomId}/students/export`
    );
  }

  async getEnterpriseAssignments(
    householdId: string,
    classroomId: string
  ): Promise<{ assignments: EnterpriseAssignmentWithSubmissions[] }> {
    return this.request(
      `/households/${householdId}/enterprise/classrooms/${classroomId}/assignments`
    );
  }

  async createEnterpriseAssignment(
    householdId: string,
    classroomId: string,
    data: CreateEnterpriseAssignmentRequest
  ): Promise<EnterpriseAssignment> {
    return this.request(
      `/households/${householdId}/enterprise/classrooms/${classroomId}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async submitEnterpriseAssignment(
    householdId: string,
    assignmentId: string,
    data: SubmitEnterpriseAssignmentRequest
  ): Promise<EnterpriseAssignmentSubmission> {
    return this.request(
      `/households/${householdId}/enterprise/assignments/${assignmentId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async reviewEnterpriseSubmission(
    householdId: string,
    submissionId: string,
    data: ReviewEnterpriseSubmissionRequest
  ): Promise<EnterpriseAssignmentSubmission> {
    return this.request(
      `/households/${householdId}/enterprise/submissions/${submissionId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getEnterpriseClassroomDashboard(
    householdId: string,
    classroomId: string
  ): Promise<EnterpriseClassroomDashboard> {
    return this.request(
      `/households/${householdId}/enterprise/classrooms/${classroomId}/dashboard`
    );
  }

  async getEnterpriseChallenges(
    householdId: string,
    schoolId: string
  ): Promise<{ challenges: EnterpriseChallenge[] }> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}/challenges`);
  }

  async createEnterpriseChallenge(
    householdId: string,
    schoolId: string,
    data: CreateEnterpriseChallengeRequest
  ): Promise<EnterpriseChallenge> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addEnterpriseChallengeParticipation(
    householdId: string,
    challengeId: string,
    data: {
      classroomId?: string;
      studentMemberId?: string;
      progress?: number;
      rank?: number;
    }
  ): Promise<EnterpriseChallengeParticipation> {
    return this.request(
      `/households/${householdId}/enterprise/challenges/${challengeId}/participations`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getEnterpriseLmsIntegrations(
    householdId: string,
    schoolId: string
  ): Promise<{ integrations: EnterpriseLmsIntegration[] }> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}/lms`);
  }

  async configureEnterpriseLms(
    householdId: string,
    schoolId: string,
    provider: EnterpriseLmsProvider,
    data: ConfigureEnterpriseLmsRequest
  ): Promise<EnterpriseLmsIntegration> {
    return this.request(
      `/households/${householdId}/enterprise/schools/${schoolId}/lms/${provider}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async syncEnterpriseLms(
    householdId: string,
    schoolId: string,
    provider: EnterpriseLmsProvider
  ): Promise<EnterpriseLmsSyncResult> {
    return this.request(
      `/households/${householdId}/enterprise/schools/${schoolId}/lms/${provider}/sync`,
      {
        method: 'POST',
      }
    );
  }

  async getEnterpriseParentVisibility(
    householdId: string,
    schoolId: string
  ): Promise<{ visibility: EnterpriseParentVisibility[] }> {
    return this.request(
      `/households/${householdId}/enterprise/schools/${schoolId}/parent-visibility`
    );
  }

  async setEnterpriseParentVisibility(
    householdId: string,
    schoolId: string,
    studentMemberId: string,
    data: SetEnterpriseParentVisibilityRequest
  ): Promise<EnterpriseParentVisibility> {
    return this.request(
      `/households/${householdId}/enterprise/schools/${schoolId}/parent-visibility/${studentMemberId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getEnterpriseSchoolAnalytics(
    householdId: string,
    schoolId: string
  ): Promise<EnterpriseSchoolAdminAnalytics> {
    return this.request(`/households/${householdId}/enterprise/schools/${schoolId}/analytics`);
  }

  async generateEnterpriseSchoolReport(
    householdId: string,
    schoolId: string,
    format: 'pdf' | 'excel'
  ): Promise<EnterpriseReportFile> {
    return this.request(
      `/households/${householdId}/enterprise/schools/${schoolId}/reports?format=${format}`
    );
  }

  async getEnterpriseImports(householdId: string): Promise<{ imports: EnterpriseBulkImport[] }> {
    return this.request(`/households/${householdId}/enterprise/imports`);
  }

  async getEnterpriseAudits(householdId: string): Promise<{ audits: EnterpriseAdminAuditEvent[] }> {
    return this.request(`/households/${householdId}/enterprise/audits`);
  }

  // ===== In-App Store =====
  async getStoreCatalog(
    householdId: string,
    options?: { category?: string; type?: string; includeInactive?: boolean }
  ): Promise<StoreCatalogItem[]> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.type) params.set('type', options.type);
    if (options?.includeInactive) params.set('includeInactive', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/households/${householdId}/store/catalog${query}`);
  }

  async getStoreOffers(householdId: string): Promise<{ offers: StoreCatalogItem[]; now: string }> {
    return this.request(`/households/${householdId}/store/offers`);
  }

  async getStoreWallet(householdId: string): Promise<StoreWallet> {
    return this.request(`/households/${householdId}/store/wallet`);
  }

  async getStoreWalletForMember(householdId: string, memberId: string): Promise<StoreWallet> {
    return this.request(`/households/${householdId}/store/wallet/${memberId}`);
  }

  async getStoreEntitlements(householdId: string): Promise<StoreEntitlement[]> {
    return this.request(`/households/${householdId}/store/entitlements`);
  }

  async createStorePurchase(
    householdId: string,
    request: CreateStorePurchaseRequest
  ): Promise<{
    pending?: boolean;
    purchase?: StorePurchase;
    walletAfter?: number;
    pointsAfter?: number;
    message?: string;
  }> {
    return this.request(`/households/${householdId}/store/purchases`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async approveStorePurchase(
    householdId: string,
    purchaseId: string,
    request?: ApproveStorePurchaseRequest
  ): Promise<{ purchaseId: string; walletAfter: number; pointsAfter: number }> {
    return this.request(`/households/${householdId}/store/purchases/${purchaseId}/approve`, {
      method: 'POST',
      body: JSON.stringify(request ?? {}),
    });
  }

  async declineStorePurchase(householdId: string, purchaseId: string): Promise<StorePurchase> {
    return this.request(`/households/${householdId}/store/purchases/${purchaseId}/decline`, {
      method: 'POST',
    });
  }

  async getStorePurchases(
    householdId: string
  ): Promise<Array<{ purchase: StorePurchase; item: StoreCatalogItem | null }>> {
    return this.request(`/households/${householdId}/store/purchases`);
  }

  async getStoreReceipt(householdId: string, purchaseId: string): Promise<StoreReceipt> {
    return this.request(`/households/${householdId}/store/purchases/${purchaseId}/receipt`);
  }

  async requestStoreRefund(
    householdId: string,
    purchaseId: string,
    request: RequestStoreRefundRequest
  ): Promise<StoreRefundRequest> {
    return this.request(`/households/${householdId}/store/purchases/${purchaseId}/refund-request`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getStoreRefundRequests(
    householdId: string
  ): Promise<
    Array<{ refund: StoreRefundRequest; purchase: StorePurchase; item: StoreCatalogItem | null }>
  > {
    return this.request(`/households/${householdId}/store/refunds`);
  }

  async resolveStoreRefund(
    householdId: string,
    refundId: string,
    request: ResolveStoreRefundRequest
  ): Promise<{ approved: boolean }> {
    return this.request(`/households/${householdId}/store/refunds/${refundId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getStorePurchaseControls(householdId: string): Promise<StorePurchaseControls> {
    return this.request(`/households/${householdId}/store/controls`);
  }

  async getStorePurchaseControlsForMember(
    householdId: string,
    memberId: string
  ): Promise<StorePurchaseControls> {
    return this.request(`/households/${householdId}/store/controls/${memberId}`);
  }

  async updateStorePurchaseControls(
    householdId: string,
    memberId: string,
    request: UpdateStorePurchaseControlsRequest
  ): Promise<StorePurchaseControls> {
    return this.request(`/households/${householdId}/store/controls/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async createStoreGiftCard(
    householdId: string,
    request: CreateStoreGiftCardRequest
  ): Promise<{ giftCard: StoreGiftCard; purchase: StorePurchase; wallet: StoreWallet }> {
    return this.request(`/households/${householdId}/store/gift-cards`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getStoreGiftCards(householdId: string): Promise<StoreGiftCard[]> {
    return this.request(`/households/${householdId}/store/gift-cards`);
  }

  async redeemStoreGiftCard(
    householdId: string,
    request: RedeemStoreGiftCardRequest
  ): Promise<{
    success: boolean;
    subscription: {
      tier: 'family' | 'premium';
      status: 'active';
      currentPeriodStart: string;
      currentPeriodEnd: string;
    };
  }> {
    return this.request(`/households/${householdId}/store/gift-cards/redeem`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // ===== Boss Battles =====
  async getCurrentBossBattle(householdId: string): Promise<BossBattle | null> {
    return this.request(`/households/${householdId}/boss-battles/current`);
  }

  async getBossBattleHistory(householdId: string, limit?: number): Promise<BossBattle[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/households/${householdId}/boss-battles/history${query}`);
  }

  async createBossBattle(householdId: string, data: CreateBossBattleRequest): Promise<BossBattle> {
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

  async getNotificationHistory(options?: { limit?: number; offset?: number }): Promise<
    Array<{
      id: string;
      notificationType: string;
      title: string;
      body: string;
      status: string;
      createdAt: Date;
    }>
  > {
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
    return this.request(`/${householdId}/members/${memberId}/caregiver-permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ memberId, permissions }),
    });
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

  async getPendingMemberLinks(householdId: string): Promise<
    Array<{
      link: {
        id: string;
        primaryMemberId: string;
        linkedMemberId: string;
        sharePoints: boolean;
        shareStreaks: boolean;
      };
      primaryMember: Member;
      primaryHousehold: Household;
    }>
  > {
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
    return this.request(`/${householdId}/members/${memberId}/cross-household-summary`);
  }

  // ===== Chore Trades =====
  async getTrades(householdId: string): Promise<TradeListResponse> {
    return this.request(`/households/${householdId}/trades`);
  }

  async getTrade(householdId: string, tradeId: string): Promise<TradeWithDetails> {
    return this.request(`/households/${householdId}/trades/${tradeId}`);
  }

  async createTrade(householdId: string, data: CreateTradeRequest): Promise<TradeWithDetails> {
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

  async getMemberPatterns(householdId: string, memberId: string): Promise<CompletionPattern> {
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

  async getReminderConfigs(householdId: string, memberId?: string): Promise<ReminderConfig[]> {
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

  async getVoiceSession(householdId: string, sessionId: string): Promise<VoiceSession> {
    return this.request(`/households/${householdId}/voice/session/${sessionId}`);
  }

  async endVoiceSession(householdId: string, sessionId: string): Promise<{ success: boolean }> {
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

  // ==================== Streak Protection ====================

  async getStreakProtectionSummary(householdId: string): Promise<HouseholdStreakSummary> {
    return this.request(`/households/${householdId}/streak-protection`);
  }

  async getStreakPrediction(householdId: string, memberId: string): Promise<StreakPrediction> {
    return this.request(`/households/${householdId}/streak-protection/member/${memberId}`);
  }

  async getStreakProtectionSettings(householdId: string): Promise<StreakProtectionSettings> {
    return this.request(`/households/${householdId}/streak-protection/settings`);
  }

  async updateStreakProtectionSettings(
    householdId: string,
    settings: UpdateProtectionSettingsRequest
  ): Promise<StreakProtectionSettings> {
    return this.request(`/households/${householdId}/streak-protection/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async useStreakFreeze(
    householdId: string,
    memberId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    member: unknown;
    freezesRemaining: number;
    message: string;
  }> {
    return this.request(`/households/${householdId}/streak-protection/use-freeze`, {
      method: 'POST',
      body: JSON.stringify({ memberId, reason }),
    });
  }

  async dismissStreakAlert(householdId: string, alertId: string): Promise<{ success: boolean }> {
    return this.request(`/households/${householdId}/streak-protection/dismiss-alert`, {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    });
  }

  async getStreakAnalytics(householdId: string, memberId: string): Promise<StreakAnalytics> {
    return this.request(`/households/${householdId}/streak-protection/analytics/${memberId}`);
  }

  // ==================== Family Challenges ====================

  async getChallengesOverview(householdId: string): Promise<HouseholdChallengesOverview> {
    return this.request(`/households/${householdId}/challenges`);
  }

  async getChallengeTemplates(householdId: string): Promise<{ templates: ChallengeTemplate[] }> {
    return this.request(`/households/${householdId}/challenges/templates`);
  }

  async createChallenge(
    householdId: string,
    challenge: CreateChallengeRequest
  ): Promise<FamilyChallenge> {
    return this.request(`/households/${householdId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(challenge),
    });
  }

  async getChallenge(householdId: string, challengeId: string): Promise<ChallengeSummary> {
    return this.request(`/households/${householdId}/challenges/${challengeId}`);
  }

  async updateChallenge(
    householdId: string,
    challengeId: string,
    updates: UpdateChallengeRequest
  ): Promise<FamilyChallenge> {
    return this.request(`/households/${householdId}/challenges/${challengeId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async joinChallenge(
    householdId: string,
    challengeId: string,
    memberId: string,
    teamId?: string
  ): Promise<{ success: boolean; challenge: FamilyChallenge }> {
    return this.request(`/households/${householdId}/challenges/${challengeId}/join`, {
      method: 'POST',
      body: JSON.stringify({ memberId, teamId }),
    });
  }

  async updateChallengeProgress(
    householdId: string,
    challengeId: string,
    memberId: string,
    contribution: number
  ): Promise<{ success: boolean; challenge: FamilyChallenge; progressPercentage: number }> {
    return this.request(`/households/${householdId}/challenges/${challengeId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ memberId, contribution }),
    });
  }

  async deleteChallenge(householdId: string, challengeId: string): Promise<{ success: boolean }> {
    return this.request(`/households/${householdId}/challenges/${challengeId}`, {
      method: 'DELETE',
    });
  }

  // ===== Community Templates =====

  async searchCommunityTemplates(params?: TemplateSearchParams): Promise<TemplateSearchResult> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.set('query', params.query);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.ageRange) queryParams.set('ageRange', params.ageRange);
    if (params?.minRating) queryParams.set('minRating', String(params.minRating));
    if (params?.maxDuration) queryParams.set('maxDuration', String(params.maxDuration));
    if (params?.difficulty) queryParams.set('difficulty', String(params.difficulty));
    if (params?.tags) params.tags.forEach((tag) => queryParams.append('tags', tag));
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    const query = queryParams.toString();
    return this.request(`/community-templates${query ? `?${query}` : ''}`);
  }

  async getCommunityTemplateCategories(): Promise<{
    categories: { value: string; label: string; icon: string }[];
    ageRanges: { value: string; label: string; minAge: number; maxAge: number | null }[];
  }> {
    return this.request('/community-templates/categories');
  }

  async getFeaturedCollections(): Promise<{
    collections: (TemplateCollection & { templates: CommunityTemplate[] })[];
  }> {
    return this.request('/community-templates/featured');
  }

  async getMyCommunityTemplates(): Promise<MyTemplatesOverview> {
    return this.request('/community-templates/my-templates');
  }

  async getFavoriteTemplates(): Promise<{ templates: CommunityTemplate[] }> {
    return this.request('/community-templates/favorites');
  }

  async getCommunityTemplate(templateId: string): Promise<{
    template: CommunityTemplate;
    reviews: TemplateReview[];
    totalReviews: number;
    isFavorite: boolean;
    hasDownloaded: boolean;
  }> {
    return this.request(`/community-templates/${templateId}`);
  }

  async createCommunityTemplate(
    template: CreateCommunityTemplateRequest
  ): Promise<CommunityTemplate> {
    return this.request('/community-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateCommunityTemplate(
    templateId: string,
    updates: UpdateCommunityTemplateRequest
  ): Promise<CommunityTemplate> {
    return this.request(`/community-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCommunityTemplate(templateId: string): Promise<{ success: boolean }> {
    return this.request(`/community-templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async toggleTemplateFavorite(
    templateId: string
  ): Promise<{ isFavorite: boolean; favorites: number }> {
    return this.request(`/community-templates/${templateId}/favorite`, {
      method: 'POST',
    });
  }

  async downloadCommunityTemplate(
    templateId: string,
    options: ImportTemplateRequest
  ): Promise<{
    success: boolean;
    template: {
      name: string;
      description: string;
      points: number;
      estimatedDuration: number;
      difficulty: number;
      steps: { order: number; instruction: string; tips?: string }[];
      tips: string[];
      supplies: string[];
      category: string;
    };
  }> {
    return this.request(`/community-templates/${templateId}/download`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async submitTemplateReview(
    templateId: string,
    review: SubmitReviewRequest
  ): Promise<{ success: boolean; ratings: CommunityTemplate['ratings'] }> {
    return this.request(`/community-templates/${templateId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  async getTemplateReviews(
    templateId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    reviews: TemplateReview[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    const query = queryParams.toString();
    return this.request(`/community-templates/${templateId}/reviews${query ? `?${query}` : ''}`);
  }

  // ===== Achievement Showcase =====

  async getAchievements(
    householdId: string,
    params?: { memberId?: string; category?: AchievementCategory }
  ): Promise<{
    unlocked: Achievement[];
    inProgress: Achievement[];
    locked: Achievement[];
    secret: number;
    stats: { total: number; unlocked: number; totalPoints: number };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.memberId) queryParams.set('memberId', params.memberId);
    if (params?.category) queryParams.set('category', params.category);
    const query = queryParams.toString();
    return this.request(`/households/${householdId}/achievements${query ? `?${query}` : ''}`);
  }

  async getAchievementShowcase(
    householdId: string,
    memberId: string
  ): Promise<{
    showcase: AchievementShowcase;
    levelProgress: { level: number; progress: number; pointsToNext: number };
  }> {
    return this.request(`/households/${householdId}/achievements/showcase/${memberId}`);
  }

  async updateAchievementShowcase(
    householdId: string,
    updates: UpdateShowcaseRequest
  ): Promise<{ success: boolean; settings: { featuredIds: string[]; title?: string } }> {
    return this.request(`/households/${householdId}/achievements/showcase`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getAchievementLeaderboard(
    householdId: string,
    timeframe?: 'week' | 'month' | 'all-time'
  ): Promise<AchievementLeaderboard> {
    const queryParams = new URLSearchParams();
    if (timeframe) queryParams.set('timeframe', timeframe);
    const query = queryParams.toString();
    return this.request(
      `/households/${householdId}/achievements/leaderboard${query ? `?${query}` : ''}`
    );
  }

  async getAchievementFeed(
    householdId: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<AchievementFeed> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    const query = queryParams.toString();
    return this.request(`/households/${householdId}/achievements/feed${query ? `?${query}` : ''}`);
  }

  async shareAchievement(
    householdId: string,
    data: ShareAchievementRequest
  ): Promise<{ success: boolean; share: AchievementShare }> {
    return this.request(`/households/${householdId}/achievements/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reactToAchievementShare(
    householdId: string,
    shareId: string,
    emoji: string
  ): Promise<{ success: boolean; reactions: AchievementShare['reactions'] }> {
    return this.request(`/households/${householdId}/achievements/share/${shareId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async getAchievementShares(
    householdId: string
  ): Promise<{ shares: (AchievementShare & { achievement?: Achievement })[] }> {
    return this.request(`/households/${householdId}/achievements/shares`);
  }

  // ===== Seasonal Events =====

  async getEventCalendar(householdId: string): Promise<EventCalendar> {
    return this.request(`/households/${householdId}/events`);
  }

  async getEvent(householdId: string, eventId: string): Promise<{ event: SeasonalEvent }> {
    return this.request(`/households/${householdId}/events/${eventId}`);
  }

  async joinEvent(
    householdId: string,
    eventId: string
  ): Promise<{ success: boolean; participation: EventParticipation }> {
    return this.request(`/households/${householdId}/events/${eventId}/join`, {
      method: 'POST',
    });
  }

  async updateEventProgress(
    householdId: string,
    eventId: string,
    challengeId: string,
    increment: number
  ): Promise<{
    success: boolean;
    challengeProgress: { challengeId: string; current: number; target: number };
    challengeCompleted: boolean;
    totalProgress: EventParticipation['progress'];
  }> {
    return this.request(`/households/${householdId}/events/${eventId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ challengeId, increment }),
    });
  }

  async claimEventReward(
    householdId: string,
    eventId: string,
    rewardId: string
  ): Promise<{ success: boolean; rewardId: string }> {
    return this.request(`/households/${householdId}/events/${eventId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ rewardId }),
    });
  }

  async getEventLeaderboard(householdId: string, eventId: string): Promise<HouseholdEventStats> {
    return this.request(`/households/${householdId}/events/${eventId}/leaderboard`);
  }

  // ===== Family Analytics =====

  async getFamilyAnalytics(
    householdId: string,
    params?: { period?: AnalyticsPeriod; memberIds?: string[]; includeRecommendations?: boolean }
  ): Promise<FamilyAnalytics> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.set('period', params.period);
    if (params?.memberIds) params.memberIds.forEach((id) => queryParams.append('memberIds', id));
    if (params?.includeRecommendations !== undefined)
      queryParams.set('includeRecommendations', String(params.includeRecommendations));
    const query = queryParams.toString();
    return this.request(`/households/${householdId}/analytics${query ? `?${query}` : ''}`);
  }

  async getMemberAnalytics(
    householdId: string,
    memberId: string,
    period?: AnalyticsPeriod
  ): Promise<{ member: MemberInsight; period: AnalyticsPeriod }> {
    const queryParams = new URLSearchParams();
    if (period) queryParams.set('period', period);
    const query = queryParams.toString();
    return this.request(
      `/households/${householdId}/analytics/member/${memberId}${query ? `?${query}` : ''}`
    );
  }

  async compareAnalyticsPeriods(
    householdId: string,
    period1: AnalyticsPeriod,
    period2: AnalyticsPeriod
  ): Promise<PeriodComparison> {
    return this.request(
      `/households/${householdId}/analytics/compare?period1=${period1}&period2=${period2}`
    );
  }

  async exportAnalytics(
    householdId: string,
    options: {
      format: 'pdf' | 'csv' | 'json';
      period: AnalyticsPeriod;
      sections: ('overview' | 'members' | 'trends' | 'chores' | 'engagement')[];
    }
  ): Promise<{ success: boolean; export: AnalyticsExport }> {
    return this.request(`/households/${householdId}/analytics/export`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getAnalyticsRecommendations(
    householdId: string
  ): Promise<{ recommendations: InsightRecommendation[] }> {
    return this.request(`/households/${householdId}/analytics/recommendations`);
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
