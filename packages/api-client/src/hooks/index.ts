import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  SignInRequest,
  SignUpRequest,
  CreateHouseholdRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  CreateChoreRequest,
  CompleteChoreRequest,
  JoinHouseholdRequest,
  CreateRewardRequest,
  CreateInviteCodeRequest,
  CreateBossBattleRequest,
  CreateSupportThreadRequest,
  CreateSupportMessageRequest,
  CreateApiKeyRequest,
  CreateStorePurchaseRequest,
  ApproveStorePurchaseRequest,
  RequestStoreRefundRequest,
  ResolveStoreRefundRequest,
  UpdateStorePurchaseControlsRequest,
  CreateStoreGiftCardRequest,
  RedeemStoreGiftCardRequest,
  CreateEnterpriseDistrictRequest,
  CreateEnterpriseSchoolRequest,
  UpdateEnterpriseSchoolRequest,
  CreateEnterpriseClassroomRequest,
  AddEnterpriseStudentRequest,
  BulkImportEnterpriseStudentsRequest,
  CreateEnterpriseAssignmentRequest,
  SubmitEnterpriseAssignmentRequest,
  ReviewEnterpriseSubmissionRequest,
  CreateEnterpriseChallengeRequest,
  ConfigureEnterpriseLmsRequest,
  SetEnterpriseParentVisibilityRequest,
  EnterpriseLmsProvider,
  UpdateApiPlatformKeySettingsRequest,
  CreateApiPlatformWebhookSubscriptionRequest,
  UpdateApiPlatformWebhookSubscriptionRequest,
  EmitApiPlatformWebhookEventRequest,
  RequestApiPlatformMarketplaceAppRequest,
  ReviewApiPlatformMarketplaceRequest,
  CreateApiPlatformOAuthClientRequest,
  CreateApiPlatformSdkPackageRequest,
  CreateActivityLogRequest,
  UpdateActivityGoalRequest,
  CreateCheckInRequest,
  CreateSleepLogRequest,
  CreateMealPlanRequest,
  UpdateMealPlanRequest,
  CreateMentalHealthResourceRequest,
  CreateGratitudeRequest,
  CreateAdvancedReportRequest,
  UpdateAdvancedReportRequest,
  DataExportRequest,
  AuditLogQuery,
  CreateForumPostRequest,
  CreateForumReplyRequest,
  CreateSocialChallengeRequest,
  CreateSocialPostRequest,
  CreateSocialCommentRequest,
  CreateFriendRequestPayload,
  CreateCommunityEventRequest,
  UpdateSmartScheduleConfigRequest,
  SuggestionFeedback,
  UpdateSuggestionPreferencesRequest,
  CreateAutomationRuleRequest,
  UpdateAutomationRuleRequest,
  UpdatePredictiveAnalyticsConfigRequest,
  CommandRequest,
  CreateCalendarConnectionRequest,
  UpdateCalendarSyncConfigRequest,
  CreateChatChannelRequest,
  CreateChatMessageRequest,
  CreatePhotoAlbumRequest,
  UploadPhotoRequest,
  CreateShareableAchievementRequest,
  UpdateShareSettingsRequest,
  CreateBankingConnectionRequest,
  CreateAllowanceDepositConfigRequest,
  UpdateAllowanceDepositConfigRequest,
  CreateChoreRotationRequest,
  UpdateChoreRotationRequest,
  CreateChoreChainRequest,
  UpdateChoreChainRequest,
  UpdateResponsibilityConfigRequest,
  ClassifyChoreRequest,
  CreateMarketplaceListingRequest,
  UpdateMarketplaceConfigRequest,
} from '@chorechamp/types';

// Query parameter types for React Query keys
interface StoreCatalogParams { category?: string; memberId?: string }
interface ActivityFeedParams { limit?: number; offset?: number; memberId?: string }
interface ReportParams { startDate?: string; endDate?: string }
interface WellnessListParams { memberId?: string; limit?: number; offset?: number }
interface WellnessPeriodParams { period?: string; memberId?: string }
interface MealPlanParams { memberId?: string; startDate?: string; endDate?: string }
interface MoodJournalParams { memberId?: string; startDate?: string; endDate?: string }
interface ForumListParams { category?: string; limit?: number; offset?: number }
interface SocialFeedParams { visibility?: string; limit?: number; offset?: number }
interface CommunityEventParams { status?: string; eventType?: string }
interface PaginationParams { page?: number; pageSize?: number }
interface CalendarEventParams { start?: string; end?: string }
interface AlbumPhotoParams { page?: number; pageSize?: number }
interface ProgressiveUnlockParams { category?: string }

// ===== Query Keys =====
export const queryKeys = {
  session: ['session'] as const,
  households: ['households'] as const,
  household: (id: string) => ['household', id] as const,
  subscriptionPlans: (householdId: string) => ['subscriptionPlans', householdId] as const,
  subscriptionStatus: (householdId: string) => ['subscriptionStatus', householdId] as const,
  members: (householdId: string) => ['members', householdId] as const,
  inviteCodes: (householdId: string) => ['inviteCodes', householdId] as const,
  chores: (householdId: string) => ['chores', householdId] as const,
  todaysChores: (householdId: string, memberId?: string) =>
    ['todaysChores', householdId, memberId] as const,
  // Gamification
  stats: (householdId: string, memberId: string) => ['stats', householdId, memberId] as const,
  transactions: (householdId: string, memberId: string) =>
    ['transactions', householdId, memberId] as const,
  streak: (householdId: string, memberId: string) => ['streak', householdId, memberId] as const,
  badges: (householdId: string, memberId: string) => ['badges', householdId, memberId] as const,
  leaderboard: (householdId: string, period?: string) =>
    ['leaderboard', householdId, period] as const,
  // Rewards
  rewards: (householdId: string) => ['rewards', householdId] as const,
  reward: (householdId: string, rewardId: string) => ['reward', householdId, rewardId] as const,
  pendingRedemptions: (householdId: string) => ['pendingRedemptions', householdId] as const,
  supportThreads: (householdId: string) => ['supportThreads', householdId] as const,
  supportThread: (householdId: string, threadId: string) =>
    ['supportThread', householdId, threadId] as const,
  apiKeys: (householdId: string) => ['apiKeys', householdId] as const,
  apiPlatformOverview: (householdId: string) => ['apiPlatformOverview', householdId] as const,
  apiPlatformOpenApi: (householdId: string) => ['apiPlatformOpenApi', householdId] as const,
  apiPlatformDeveloperApiKeys: (householdId: string) =>
    ['apiPlatformDeveloperApiKeys', householdId] as const,
  apiPlatformKeyUsage: (householdId: string, keyId: string) =>
    ['apiPlatformKeyUsage', householdId, keyId] as const,
  apiPlatformWebhooks: (householdId: string) => ['apiPlatformWebhooks', householdId] as const,
  apiPlatformWebhookDeliveries: (householdId: string) =>
    ['apiPlatformWebhookDeliveries', householdId] as const,
  apiPlatformMarketplaceApps: (householdId: string) =>
    ['apiPlatformMarketplaceApps', householdId] as const,
  apiPlatformMarketplaceRequests: (householdId: string) =>
    ['apiPlatformMarketplaceRequests', householdId] as const,
  apiPlatformOAuthClients: (householdId: string) =>
    ['apiPlatformOAuthClients', householdId] as const,
  apiPlatformSdkPackages: (householdId: string) =>
    ['apiPlatformSdkPackages', householdId] as const,
  apiPlatformAnalytics: (householdId: string) => ['apiPlatformAnalytics', householdId] as const,
  storeCatalog: (householdId: string, options?: StoreCatalogParams) =>
    ['storeCatalog', householdId, options] as const,
  storeOffers: (householdId: string) => ['storeOffers', householdId] as const,
  storeWallet: (householdId: string) => ['storeWallet', householdId] as const,
  storeWalletMember: (householdId: string, memberId: string) =>
    ['storeWalletMember', householdId, memberId] as const,
  storeEntitlements: (householdId: string) => ['storeEntitlements', householdId] as const,
  storePurchases: (householdId: string) => ['storePurchases', householdId] as const,
  storeReceipt: (householdId: string, purchaseId: string) =>
    ['storeReceipt', householdId, purchaseId] as const,
  storeRefunds: (householdId: string) => ['storeRefunds', householdId] as const,
  storeControls: (householdId: string) => ['storeControls', householdId] as const,
  storeControlsMember: (householdId: string, memberId: string) =>
    ['storeControlsMember', householdId, memberId] as const,
  storeGiftCards: (householdId: string) => ['storeGiftCards', householdId] as const,
  enterpriseOverview: (householdId: string) => ['enterpriseOverview', householdId] as const,
  enterpriseDistricts: (householdId: string) => ['enterpriseDistricts', householdId] as const,
  enterpriseSchools: (householdId: string) => ['enterpriseSchools', householdId] as const,
  enterpriseClassrooms: (householdId: string, schoolId: string) =>
    ['enterpriseClassrooms', householdId, schoolId] as const,
  enterpriseStudents: (householdId: string, classroomId: string) =>
    ['enterpriseStudents', householdId, classroomId] as const,
  enterpriseAssignments: (householdId: string, classroomId: string) =>
    ['enterpriseAssignments', householdId, classroomId] as const,
  enterpriseClassroomDashboard: (householdId: string, classroomId: string) =>
    ['enterpriseClassroomDashboard', householdId, classroomId] as const,
  enterpriseChallenges: (householdId: string, schoolId: string) =>
    ['enterpriseChallenges', householdId, schoolId] as const,
  enterpriseLms: (householdId: string, schoolId: string) =>
    ['enterpriseLms', householdId, schoolId] as const,
  enterpriseParentVisibility: (householdId: string, schoolId: string) =>
    ['enterpriseParentVisibility', householdId, schoolId] as const,
  enterpriseSchoolAnalytics: (householdId: string, schoolId: string) =>
    ['enterpriseSchoolAnalytics', householdId, schoolId] as const,
  enterpriseImports: (householdId: string) => ['enterpriseImports', householdId] as const,
  enterpriseAudits: (householdId: string) => ['enterpriseAudits', householdId] as const,
  enterpriseReport: (householdId: string, schoolId: string, format: 'pdf' | 'excel') =>
    ['enterpriseReport', householdId, schoolId, format] as const,
  // Boss Battles
  currentBossBattle: (householdId: string) => ['currentBossBattle', householdId] as const,
  bossBattleHistory: (householdId: string) => ['bossBattleHistory', householdId] as const,
  bossBattle: (householdId: string, battleId: string) =>
    ['bossBattle', householdId, battleId] as const,
  // Activity
  activityFeed: (householdId: string, options?: ActivityFeedParams) =>
    ['activityFeed', householdId, options] as const,
  activityStats: (householdId: string, period?: string) =>
    ['activityStats', householdId, period] as const,
  // Reports
  reportSummary: (householdId: string, options?: ReportParams) =>
    ['reportSummary', householdId, options] as const,
  reportTrend: (householdId: string, options?: ReportParams) =>
    ['reportTrend', householdId, options] as const,
  reportCategories: (householdId: string, options?: ReportParams) =>
    ['reportCategories', householdId, options] as const,
  // Wellness
  wellnessActivityLogs: (householdId: string, params?: WellnessListParams) =>
    ['wellnessActivityLogs', householdId, params] as const,
  wellnessActivityStats: (householdId: string, memberId?: string) =>
    ['wellnessActivityStats', householdId, memberId] as const,
  wellnessActivityGoals: (householdId: string) =>
    ['wellnessActivityGoals', householdId] as const,
  wellnessCheckIns: (householdId: string, params?: WellnessListParams) =>
    ['wellnessCheckIns', householdId, params] as const,
  wellnessTrends: (householdId: string, params?: WellnessPeriodParams) =>
    ['wellnessTrends', householdId, params] as const,
  sleepLogs: (householdId: string, memberId?: string) =>
    ['sleepLogs', householdId, memberId] as const,
  sleepStats: (householdId: string, params?: WellnessPeriodParams) =>
    ['sleepStats', householdId, params] as const,
  mealPlans: (householdId: string, params?: MealPlanParams) =>
    ['mealPlans', householdId, params] as const,
  mentalHealthResources: (householdId: string, category?: string) =>
    ['mentalHealthResources', householdId, category] as const,
  gratitudeEntries: (householdId: string, memberId?: string) =>
    ['gratitudeEntries', householdId, memberId] as const,
  moodJournal: (householdId: string, params?: MoodJournalParams) =>
    ['moodJournal', householdId, params] as const,
  // Advanced Analytics & Admin
  advancedReports: (householdId: string) => ['advancedReports', householdId] as const,
  advancedReport: (householdId: string, reportId: string) => ['advancedReport', householdId, reportId] as const,
  generatedReports: (householdId: string, reportId: string) => ['generatedReports', householdId, reportId] as const,
  adminDashboard: (householdId: string) => ['adminDashboard', householdId] as const,
  adminMembers: (householdId: string) => ['adminMembers', householdId] as const,
  adminAlerts: (householdId: string) => ['adminAlerts', householdId] as const,
  dataExports: (householdId: string) => ['dataExports', householdId] as const,
  dataExport: (householdId: string, exportId: string) => ['dataExport', householdId, exportId] as const,
  auditLogs: (householdId: string, query?: AuditLogQuery) => ['auditLogs', householdId, query] as const,
  auditLogSummary: (householdId: string) => ['auditLogSummary', householdId] as const,
  performanceMetrics: (householdId: string) => ['performanceMetrics', householdId] as const,
  performanceHistory: (householdId: string, period?: string) => ['performanceHistory', householdId, period] as const,
  usageMetrics: (householdId: string) => ['usageMetrics', householdId] as const,
  errorMetrics: (householdId: string) => ['errorMetrics', householdId] as const,
  // Community & Social
  forumPosts: (householdId: string, params?: ForumListParams) => ['forumPosts', householdId, params] as const,
  forumPost: (householdId: string, postId: string) => ['forumPost', householdId, postId] as const,
  socialChallenges: (householdId: string, status?: string) => ['socialChallenges', householdId, status] as const,
  socialChallenge: (householdId: string, challengeId: string) => ['socialChallenge', householdId, challengeId] as const,
  socialFeed: (householdId: string, params?: SocialFeedParams) => ['socialFeed', householdId, params] as const,
  socialPost: (householdId: string, postId: string) => ['socialPost', householdId, postId] as const,
  friends: (householdId: string) => ['friends', householdId] as const,
  friendSuggestions: (householdId: string) => ['friendSuggestions', householdId] as const,
  communityEvents: (householdId: string, params?: CommunityEventParams) => ['communityEvents', householdId, params] as const,
  communityEvent: (householdId: string, eventId: string) => ['communityEvent', householdId, eventId] as const,

  // Phase 17: Smart Automation & AI
  smartScheduleConfig: (householdId: string) => ['smartScheduleConfig', householdId] as const,
  scheduleConflicts: (householdId: string) => ['scheduleConflicts', householdId] as const,
  aiSuggestions: (householdId: string) => ['aiSuggestions', householdId] as const,
  suggestionPreferences: (householdId: string) => ['suggestionPreferences', householdId] as const,
  automationRules: (householdId: string) => ['automationRules', householdId] as const,
  automationRule: (householdId: string, ruleId: string) => ['automationRule', householdId, ruleId] as const,
  automationRuleLogs: (householdId: string, ruleId: string) => ['automationRuleLogs', householdId, ruleId] as const,
  predictions: (householdId: string) => ['predictions', householdId] as const,
  predictiveInsights: (householdId: string) => ['predictiveInsights', householdId] as const,
  predictiveAnalyticsConfig: (householdId: string) => ['predictiveAnalyticsConfig', householdId] as const,
  commandHistory: (householdId: string, params?: PaginationParams) => ['commandHistory', householdId, params] as const,
  commandCapabilities: (householdId: string) => ['commandCapabilities', householdId] as const,

  // Phase 18: Communication & Calendar Integration
  calendarConnections: (householdId: string) => ['calendarConnections', householdId] as const,
  calendarEvents: (householdId: string, params?: CalendarEventParams) => ['calendarEvents', householdId, params] as const,
  calendarSyncConfig: (householdId: string) => ['calendarSyncConfig', householdId] as const,
  chatChannels: (householdId: string) => ['chatChannels', householdId] as const,
  chatMessages: (householdId: string, channelId: string, params?: PaginationParams) => ['chatMessages', householdId, channelId, params] as const,
  chatUnread: (householdId: string) => ['chatUnread', householdId] as const,
  photoAlbums: (householdId: string) => ['photoAlbums', householdId] as const,
  albumPhotos: (householdId: string, albumId: string, params?: AlbumPhotoParams) => ['albumPhotos', householdId, albumId, params] as const,
  shareableAchievements: (householdId: string) => ['shareableAchievements', householdId] as const,
  shareSettings: (householdId: string) => ['shareSettings', householdId] as const,
  progressiveUnlocks: (householdId: string, params?: ProgressiveUnlockParams) => ['progressiveUnlocks', householdId, params] as const,
  memberUnlockProgress: (householdId: string, memberId: string) => ['memberUnlockProgress', householdId, memberId] as const,
  unlockProgressSummary: (householdId: string, memberId: string) => ['unlockProgressSummary', householdId, memberId] as const,

  // Phase 19: Financial Integration & Advanced Scheduling
  bankingConnections: (householdId: string) => ['bankingConnections', householdId] as const,
  allowanceDeposits: (householdId: string) => ['allowanceDeposits', householdId] as const,
  depositConfigs: (householdId: string) => ['depositConfigs', householdId] as const,
  depositSummary: (householdId: string) => ['depositSummary', householdId] as const,
  choreRotations: (householdId: string) => ['choreRotations', householdId] as const,
  choreRotation: (householdId: string, rotationId: string) => ['choreRotation', householdId, rotationId] as const,
  rotationHistory: (householdId: string, rotationId: string) => ['rotationHistory', householdId, rotationId] as const,
  rotationFairness: (householdId: string, rotationId: string) => ['rotationFairness', householdId, rotationId] as const,
  choreChains: (householdId: string) => ['choreChains', householdId] as const,
  choreChainProgress: (householdId: string, chainId: string) => ['choreChainProgress', householdId, chainId] as const,
  responsibilityConfig: (householdId: string) => ['responsibilityConfig', householdId] as const,
  choreClassifications: (householdId: string) => ['choreClassifications', householdId] as const,
  classificationSummary: (householdId: string) => ['classificationSummary', householdId] as const,
  marketplaceListings: (householdId: string) => ['marketplaceListings', householdId] as const,
  marketplaceStats: (householdId: string) => ['marketplaceStats', householdId] as const,
  marketplaceConfig: (householdId: string) => ['marketplaceConfig', householdId] as const,
};

// ===== Auth Hooks =====
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiClient.getSession(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignUpRequest) => apiClient.signUp(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session, data);
    },
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignInRequest) => apiClient.signIn(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session, data);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string }) => apiClient.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session, data);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.changePassword(data),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteAccount(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.clear();
    },
  });
}

// ===== Household Hooks =====
export function useHouseholds() {
  return useQuery({
    queryKey: queryKeys.households,
    queryFn: () => apiClient.getHouseholds(),
  });
}

export function useHousehold(id: string) {
  return useQuery({
    queryKey: queryKeys.household(id),
    queryFn: () => apiClient.getHousehold(id),
    enabled: !!id,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHouseholdRequest) => apiClient.createHousehold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
  });
}

export function useUpdateHousehold(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      timezone?: string;
      weekStartsOn?: number;
      pointsName?: string;
      currency?: string;
      themeId?: string | null;
      brandingName?: string | null;
      brandingLogoUrl?: string | null;
    }) => apiClient.updateHousehold(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
  });
}

export function useLeaveHousehold(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.leaveHousehold(householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
  });
}

export function useDeleteHousehold(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteHousehold(householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinHouseholdRequest) => apiClient.joinHousehold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
  });
}

// ===== Subscription Hooks =====
export function useSubscriptionPlans(householdId: string) {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans(householdId),
    queryFn: () => apiClient.getSubscriptionPlans(householdId),
    enabled: !!householdId,
  });
}

export function useSubscriptionStatus(householdId: string) {
  return useQuery({
    queryKey: queryKeys.subscriptionStatus(householdId),
    queryFn: () => apiClient.getSubscriptionStatus(householdId),
    enabled: !!householdId,
  });
}

export function useCreateCheckoutSession(householdId: string) {
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.createCheckoutSession>[1]) =>
      apiClient.createCheckoutSession(householdId, data),
  });
}

export function useCreatePortalSession(householdId: string) {
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.createPortalSession>[1]) =>
      apiClient.createPortalSession(householdId, data),
  });
}

// ===== Member Hooks =====
export function useMembers(householdId: string) {
  return useQuery({
    queryKey: queryKeys.members(householdId),
    queryFn: () => apiClient.getMembers(householdId),
    enabled: !!householdId,
  });
}

export function useAddMember(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberRequest) => apiClient.addMember(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(householdId) });
    },
  });
}

export function useUpdateMember(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateMemberRequest }) =>
      apiClient.updateMember(householdId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(householdId) });
    },
  });
}

export function useDeleteMember(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => apiClient.deleteMember(householdId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(householdId) });
    },
  });
}

// ===== Invite Code Hooks =====
export function useInviteCodes(householdId: string) {
  return useQuery({
    queryKey: queryKeys.inviteCodes(householdId),
    queryFn: () => apiClient.getInviteCodes(householdId),
    enabled: !!householdId,
  });
}

export function useCreateInviteCode(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteCodeRequest) => apiClient.createInviteCode(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes(householdId) });
    },
  });
}

// ===== Chore Hooks =====
export function useChores(householdId: string) {
  return useQuery({
    queryKey: queryKeys.chores(householdId),
    queryFn: () => apiClient.getChores(householdId),
    enabled: !!householdId,
  });
}

export function useTodaysChores(householdId: string, memberId?: string) {
  return useQuery({
    queryKey: queryKeys.todaysChores(householdId, memberId),
    queryFn: () => apiClient.getTodaysChores(householdId, memberId),
    enabled: !!householdId,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateChore(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChoreRequest) => apiClient.createChore(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chores(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.todaysChores(householdId) });
    },
  });
}

export function useCompleteChore(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ choreId, data }: { choreId: string; data: CompleteChoreRequest }) =>
      apiClient.completeChore(householdId, choreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todaysChores(householdId) });
    },
  });
}

export function useApproveCompletion(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (completionId: string) => apiClient.approveCompletion(householdId, completionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todaysChores(householdId) });
    },
  });
}

export function useRejectCompletion(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ completionId, reason }: { completionId: string; reason: string }) =>
      apiClient.rejectCompletion(householdId, completionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todaysChores(householdId) });
    },
  });
}

// ===== Gamification Hooks =====
export function useGamificationStats(householdId: string, memberId: string) {
  return useQuery({
    queryKey: queryKeys.stats(householdId, memberId),
    queryFn: () => apiClient.getGamificationStats(householdId, memberId),
    enabled: !!householdId && !!memberId,
  });
}

export function usePointTransactions(
  householdId: string,
  memberId: string,
  options?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: [...queryKeys.transactions(householdId, memberId), options],
    queryFn: () => apiClient.getPointTransactions(householdId, memberId, options),
    enabled: !!householdId && !!memberId,
  });
}

export function useMemberStreak(householdId: string, memberId: string) {
  return useQuery({
    queryKey: queryKeys.streak(householdId, memberId),
    queryFn: () => apiClient.getMemberStreak(householdId, memberId),
    enabled: !!householdId && !!memberId,
  });
}

export function useMemberBadges(householdId: string, memberId: string) {
  return useQuery({
    queryKey: queryKeys.badges(householdId, memberId),
    queryFn: () => apiClient.getMemberBadges(householdId, memberId),
    enabled: !!householdId && !!memberId,
  });
}

export function useLeaderboard(householdId: string, period?: 'week' | 'month' | 'all') {
  return useQuery({
    queryKey: queryKeys.leaderboard(householdId, period),
    queryFn: () => apiClient.getLeaderboard(householdId, period),
    enabled: !!householdId,
  });
}

// ===== Reward Hooks =====
export function useRewards(householdId: string) {
  return useQuery({
    queryKey: queryKeys.rewards(householdId),
    queryFn: () => apiClient.getRewards(householdId),
    enabled: !!householdId,
  });
}

export function useReward(householdId: string, rewardId: string) {
  return useQuery({
    queryKey: queryKeys.reward(householdId, rewardId),
    queryFn: () => apiClient.getReward(householdId, rewardId),
    enabled: !!householdId && !!rewardId,
  });
}

export function useCreateReward(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRewardRequest) => apiClient.createReward(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards(householdId) });
    },
  });
}

export function useUpdateReward(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rewardId, data }: { rewardId: string; data: Partial<CreateRewardRequest> }) =>
      apiClient.updateReward(householdId, rewardId, data),
    onSuccess: (_, { rewardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards(householdId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reward(householdId, rewardId),
      });
    },
  });
}

export function useDeleteReward(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => apiClient.deleteReward(householdId, rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards(householdId) });
    },
  });
}

export function useRedeemReward(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rewardId,
      memberId,
      notes,
    }: {
      rewardId: string;
      memberId: string;
      notes?: string;
    }) => apiClient.redeemReward(householdId, rewardId, memberId, notes),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards(householdId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stats(householdId, memberId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(householdId, memberId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingRedemptions(householdId),
      });
    },
  });
}

export function usePendingRedemptions(householdId: string) {
  return useQuery({
    queryKey: queryKeys.pendingRedemptions(householdId),
    queryFn: () => apiClient.getPendingRedemptions(householdId),
    enabled: !!householdId,
  });
}

export function useApproveRedemption(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (redemptionId: string) => apiClient.approveRedemption(householdId, redemptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingRedemptions(householdId),
      });
    },
  });
}

export function useFulfillRedemption(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (redemptionId: string) => apiClient.fulfillRedemption(householdId, redemptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingRedemptions(householdId),
      });
    },
  });
}

export function useRejectRedemption(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ redemptionId, reason }: { redemptionId: string; reason: string }) =>
      apiClient.rejectRedemption(householdId, redemptionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingRedemptions(householdId),
      });
    },
  });
}

// ===== Support Hooks =====
export function useSupportThreads(householdId: string) {
  return useQuery({
    queryKey: queryKeys.supportThreads(householdId),
    queryFn: () => apiClient.getSupportThreads(householdId),
    enabled: !!householdId,
  });
}

export function useSupportThread(householdId: string, threadId: string) {
  return useQuery({
    queryKey: queryKeys.supportThread(householdId, threadId),
    queryFn: () => apiClient.getSupportThread(householdId, threadId),
    enabled: !!householdId && !!threadId,
  });
}

export function useCreateSupportThread(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupportThreadRequest) =>
      apiClient.createSupportThread(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supportThreads(householdId) });
    },
  });
}

export function useCreateSupportMessage(householdId: string, threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupportMessageRequest) =>
      apiClient.createSupportMessage(householdId, threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supportThread(householdId, threadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supportThreads(householdId),
      });
    },
  });
}

export function useUpdateSupportThreadStatus(householdId: string, threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: 'open' | 'pending' | 'closed') =>
      apiClient.updateSupportThreadStatus(householdId, threadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supportThread(householdId, threadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supportThreads(householdId),
      });
    },
  });
}

// ===== API Key Hooks =====
export function useApiKeys(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiKeys(householdId),
    queryFn: () => apiClient.getApiKeys(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useCreateApiKey(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => apiClient.createApiKey(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys(householdId) });
    },
  });
}

export function useRevokeApiKey(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => apiClient.revokeApiKey(householdId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys(householdId) });
    },
  });
}

// ===== API Platform & Integrations Hooks =====
export function useApiPlatformOverview(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiPlatformOverview(householdId),
    queryFn: () => apiClient.getApiPlatformOverview(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useApiPlatformOpenApi(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiPlatformOpenApi(householdId),
    queryFn: () => apiClient.getApiPlatformOpenApi(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useApiPlatformDeveloperApiKeys(
  householdId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.apiPlatformDeveloperApiKeys(householdId),
    queryFn: () => apiClient.getApiPlatformDeveloperApiKeys(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useUpdateApiPlatformKeySettings(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { keyId: string; data: UpdateApiPlatformKeySettingsRequest }) =>
      apiClient.updateApiPlatformKeySettings(householdId, variables.keyId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformDeveloperApiKeys(householdId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.apiPlatformKeyUsage(householdId, variables.keyId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformAnalytics(householdId) });
    },
  });
}

export function useApiPlatformKeyUsage(
  householdId: string,
  keyId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.apiPlatformKeyUsage(householdId, keyId),
    queryFn: () => apiClient.getApiPlatformKeyUsage(householdId, keyId),
    enabled: options?.enabled ?? (!!householdId && !!keyId),
  });
}

export function useApiPlatformWebhooks(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiPlatformWebhooks(householdId),
    queryFn: () => apiClient.getApiPlatformWebhooks(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useCreateApiPlatformWebhook(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiPlatformWebhookSubscriptionRequest) =>
      apiClient.createApiPlatformWebhook(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformWebhooks(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
    },
  });
}

export function useUpdateApiPlatformWebhook(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      subscriptionId: string;
      data: UpdateApiPlatformWebhookSubscriptionRequest;
    }) => apiClient.updateApiPlatformWebhook(householdId, variables.subscriptionId, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformWebhooks(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformWebhookDeliveries(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
    },
  });
}

export function useEmitApiPlatformWebhook(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmitApiPlatformWebhookEventRequest) =>
      apiClient.emitApiPlatformWebhook(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformWebhookDeliveries(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformWebhooks(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformAnalytics(householdId) });
    },
  });
}

export function useApiPlatformWebhookDeliveries(
  householdId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.apiPlatformWebhookDeliveries(householdId),
    queryFn: () => apiClient.getApiPlatformWebhookDeliveries(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useApiPlatformMarketplaceApps(
  householdId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.apiPlatformMarketplaceApps(householdId),
    queryFn: () => apiClient.getApiPlatformMarketplaceApps(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useApiPlatformMarketplaceRequests(
  householdId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.apiPlatformMarketplaceRequests(householdId),
    queryFn: () => apiClient.getApiPlatformMarketplaceRequests(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useRequestApiPlatformMarketplaceApp(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestApiPlatformMarketplaceAppRequest) =>
      apiClient.requestApiPlatformMarketplaceApp(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformMarketplaceRequests(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
    },
  });
}

export function useReviewApiPlatformMarketplaceRequest(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { requestId: string; data: ReviewApiPlatformMarketplaceRequest }) =>
      apiClient.reviewApiPlatformMarketplaceRequest(householdId, variables.requestId, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformMarketplaceRequests(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
    },
  });
}

export function useApiPlatformOAuthClients(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiPlatformOAuthClients(householdId),
    queryFn: () => apiClient.getApiPlatformOAuthClients(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useCreateApiPlatformOAuthClient(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiPlatformOAuthClientRequest) =>
      apiClient.createApiPlatformOAuthClient(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOAuthClients(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
    },
  });
}

export function useApiPlatformSdkPackages(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiPlatformSdkPackages(householdId),
    queryFn: () => apiClient.getApiPlatformSdkPackages(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useUpsertApiPlatformSdkPackage(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiPlatformSdkPackageRequest) =>
      apiClient.upsertApiPlatformSdkPackage(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformSdkPackages(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiPlatformOverview(householdId) });
    },
  });
}

export function useApiPlatformAnalytics(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.apiPlatformAnalytics(householdId),
    queryFn: () => apiClient.getApiPlatformAnalytics(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

// ===== Enterprise School Edition Hooks =====
export function useEnterpriseOverview(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enterpriseOverview(householdId),
    queryFn: () => apiClient.getEnterpriseOverview(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useEnterpriseDistricts(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enterpriseDistricts(householdId),
    queryFn: () => apiClient.getEnterpriseDistricts(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useCreateEnterpriseDistrict(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnterpriseDistrictRequest) =>
      apiClient.createEnterpriseDistrict(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseDistricts(householdId) });
    },
  });
}

export function useEnterpriseSchools(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enterpriseSchools(householdId),
    queryFn: () => apiClient.getEnterpriseSchools(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useCreateEnterpriseSchool(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnterpriseSchoolRequest) =>
      apiClient.createEnterpriseSchool(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseSchools(householdId) });
    },
  });
}

export function useUpdateEnterpriseSchool(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: UpdateEnterpriseSchoolRequest }) =>
      apiClient.updateEnterpriseSchool(householdId, schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseSchools(householdId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseSchoolAnalytics(householdId, variables.schoolId),
      });
    },
  });
}

export function useEnterpriseClassrooms(
  householdId: string,
  schoolId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseClassrooms(householdId, schoolId),
    queryFn: () => apiClient.getEnterpriseClassrooms(householdId, schoolId),
    enabled: options?.enabled ?? (!!householdId && !!schoolId),
  });
}

export function useCreateEnterpriseClassroom(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string;
      data: CreateEnterpriseClassroomRequest;
    }) => apiClient.createEnterpriseClassroom(householdId, schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseClassrooms(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useEnterpriseStudents(
  householdId: string,
  classroomId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseStudents(householdId, classroomId),
    queryFn: () => apiClient.getEnterpriseStudents(householdId, classroomId),
    enabled: options?.enabled ?? (!!householdId && !!classroomId),
  });
}

export function useAddEnterpriseStudent(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: AddEnterpriseStudentRequest;
    }) => apiClient.addEnterpriseStudent(householdId, classroomId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseStudents(householdId, variables.classroomId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseClassroomDashboard(householdId, variables.classroomId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useImportEnterpriseStudents(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: BulkImportEnterpriseStudentsRequest;
    }) => apiClient.importEnterpriseStudents(householdId, classroomId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseStudents(householdId, variables.classroomId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseClassroomDashboard(householdId, variables.classroomId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseImports(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useEnterpriseAssignments(
  householdId: string,
  classroomId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseAssignments(householdId, classroomId),
    queryFn: () => apiClient.getEnterpriseAssignments(householdId, classroomId),
    enabled: options?.enabled ?? (!!householdId && !!classroomId),
  });
}

export function useCreateEnterpriseAssignment(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: CreateEnterpriseAssignmentRequest;
    }) => apiClient.createEnterpriseAssignment(householdId, classroomId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseAssignments(householdId, variables.classroomId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseClassroomDashboard(householdId, variables.classroomId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useSubmitEnterpriseAssignment(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: SubmitEnterpriseAssignmentRequest;
    }) => apiClient.submitEnterpriseAssignment(householdId, assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'enterpriseAssignments' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'enterpriseClassroomDashboard' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useReviewEnterpriseSubmission(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: ReviewEnterpriseSubmissionRequest;
    }) => apiClient.reviewEnterpriseSubmission(householdId, submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'enterpriseAssignments' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'enterpriseClassroomDashboard' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useEnterpriseClassroomDashboard(
  householdId: string,
  classroomId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseClassroomDashboard(householdId, classroomId),
    queryFn: () => apiClient.getEnterpriseClassroomDashboard(householdId, classroomId),
    enabled: options?.enabled ?? (!!householdId && !!classroomId),
  });
}

export function useEnterpriseChallenges(
  householdId: string,
  schoolId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseChallenges(householdId, schoolId),
    queryFn: () => apiClient.getEnterpriseChallenges(householdId, schoolId),
    enabled: options?.enabled ?? (!!householdId && !!schoolId),
  });
}

export function useCreateEnterpriseChallenge(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string;
      data: CreateEnterpriseChallengeRequest;
    }) => apiClient.createEnterpriseChallenge(householdId, schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseChallenges(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useAddEnterpriseChallengeParticipation(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      challengeId: string;
      schoolId: string;
      data: {
        classroomId?: string;
        studentMemberId?: string;
        progress?: number;
        rank?: number;
      };
    }) =>
      apiClient.addEnterpriseChallengeParticipation(
        householdId,
        variables.challengeId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseChallenges(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useEnterpriseLms(
  householdId: string,
  schoolId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseLms(householdId, schoolId),
    queryFn: () => apiClient.getEnterpriseLmsIntegrations(householdId, schoolId),
    enabled: options?.enabled ?? (!!householdId && !!schoolId),
  });
}

export function useConfigureEnterpriseLms(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolId,
      provider,
      data,
    }: {
      schoolId: string;
      provider: EnterpriseLmsProvider;
      data: ConfigureEnterpriseLmsRequest;
    }) => apiClient.configureEnterpriseLms(householdId, schoolId, provider, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseLms(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseSchoolAnalytics(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useSyncEnterpriseLms(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schoolId, provider }: { schoolId: string; provider: EnterpriseLmsProvider }) =>
      apiClient.syncEnterpriseLms(householdId, schoolId, provider),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseLms(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseSchoolAnalytics(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useEnterpriseParentVisibility(
  householdId: string,
  schoolId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseParentVisibility(householdId, schoolId),
    queryFn: () => apiClient.getEnterpriseParentVisibility(householdId, schoolId),
    enabled: options?.enabled ?? (!!householdId && !!schoolId),
  });
}

export function useSetEnterpriseParentVisibility(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolId,
      studentMemberId,
      data,
    }: {
      schoolId: string;
      studentMemberId: string;
      data: SetEnterpriseParentVisibilityRequest;
    }) => apiClient.setEnterpriseParentVisibility(householdId, schoolId, studentMemberId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.enterpriseParentVisibility(householdId, variables.schoolId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enterpriseOverview(householdId) });
    },
  });
}

export function useEnterpriseSchoolAnalytics(
  householdId: string,
  schoolId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseSchoolAnalytics(householdId, schoolId),
    queryFn: () => apiClient.getEnterpriseSchoolAnalytics(householdId, schoolId),
    enabled: options?.enabled ?? (!!householdId && !!schoolId),
  });
}

export function useEnterpriseImports(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enterpriseImports(householdId),
    queryFn: () => apiClient.getEnterpriseImports(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useEnterpriseAudits(householdId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enterpriseAudits(householdId),
    queryFn: () => apiClient.getEnterpriseAudits(householdId),
    enabled: options?.enabled ?? !!householdId,
  });
}

export function useEnterpriseReport(
  householdId: string,
  schoolId: string,
  format: 'pdf' | 'excel',
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.enterpriseReport(householdId, schoolId, format),
    queryFn: () => apiClient.generateEnterpriseSchoolReport(householdId, schoolId, format),
    enabled: options?.enabled ?? (!!householdId && !!schoolId),
  });
}

export function useExportEnterpriseStudents(householdId: string) {
  return useMutation({
    mutationFn: (classroomId: string) =>
      apiClient.exportEnterpriseStudents(householdId, classroomId),
  });
}

export function useGenerateEnterpriseReport(householdId: string) {
  return useMutation({
    mutationFn: ({ schoolId, format }: { schoolId: string; format: 'pdf' | 'excel' }) =>
      apiClient.generateEnterpriseSchoolReport(householdId, schoolId, format),
  });
}

// ===== In-App Store Hooks =====
export function useStoreCatalog(
  householdId: string,
  options?: { category?: string; type?: string; includeInactive?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.storeCatalog(householdId, options),
    queryFn: () => apiClient.getStoreCatalog(householdId, options),
    enabled: !!householdId,
  });
}

export function useStoreOffers(householdId: string) {
  return useQuery({
    queryKey: queryKeys.storeOffers(householdId),
    queryFn: () => apiClient.getStoreOffers(householdId),
    enabled: !!householdId,
  });
}

export function useStoreWallet(householdId: string) {
  return useQuery({
    queryKey: queryKeys.storeWallet(householdId),
    queryFn: () => apiClient.getStoreWallet(householdId),
    enabled: !!householdId,
  });
}

export function useStoreWalletForMember(householdId: string, memberId: string) {
  return useQuery({
    queryKey: queryKeys.storeWalletMember(householdId, memberId),
    queryFn: () => apiClient.getStoreWalletForMember(householdId, memberId),
    enabled: !!householdId && !!memberId,
  });
}

export function useStoreEntitlements(householdId: string) {
  return useQuery({
    queryKey: queryKeys.storeEntitlements(householdId),
    queryFn: () => apiClient.getStoreEntitlements(householdId),
    enabled: !!householdId,
  });
}

export function useStorePurchases(householdId: string) {
  return useQuery({
    queryKey: queryKeys.storePurchases(householdId),
    queryFn: () => apiClient.getStorePurchases(householdId),
    enabled: !!householdId,
  });
}

export function useStoreReceipt(householdId: string, purchaseId: string) {
  return useQuery({
    queryKey: queryKeys.storeReceipt(householdId, purchaseId),
    queryFn: () => apiClient.getStoreReceipt(householdId, purchaseId),
    enabled: !!householdId && !!purchaseId,
  });
}

export function useCreateStorePurchase(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateStorePurchaseRequest) =>
      apiClient.createStorePurchase(householdId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeWallet(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storePurchases(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeEntitlements(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeGiftCards(householdId) });
    },
  });
}

export function useApproveStorePurchase(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseId,
      request,
    }: {
      purchaseId: string;
      request?: ApproveStorePurchaseRequest;
    }) => apiClient.approveStorePurchase(householdId, purchaseId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeWallet(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storePurchases(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeEntitlements(householdId) });
    },
  });
}

export function useDeclineStorePurchase(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchaseId: string) => apiClient.declineStorePurchase(householdId, purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storePurchases(householdId) });
    },
  });
}

export function useRequestStoreRefund(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseId,
      request,
    }: {
      purchaseId: string;
      request: RequestStoreRefundRequest;
    }) => apiClient.requestStoreRefund(householdId, purchaseId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storePurchases(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeRefunds(householdId) });
    },
  });
}

export function useStoreRefundRequests(householdId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeRefunds(householdId),
    queryFn: () => apiClient.getStoreRefundRequests(householdId),
    enabled: !!householdId && enabled,
  });
}

export function useResolveStoreRefund(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ refundId, request }: { refundId: string; request: ResolveStoreRefundRequest }) =>
      apiClient.resolveStoreRefund(householdId, refundId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeRefunds(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storePurchases(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeWallet(householdId) });
    },
  });
}

export function useStoreControls(householdId: string, memberId?: string) {
  return useQuery({
    queryKey: memberId
      ? queryKeys.storeControlsMember(householdId, memberId)
      : queryKeys.storeControls(householdId),
    queryFn: () =>
      memberId
        ? apiClient.getStorePurchaseControlsForMember(householdId, memberId)
        : apiClient.getStorePurchaseControls(householdId),
    enabled: !!householdId,
  });
}

export function useUpdateStoreControls(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: string;
      request: UpdateStorePurchaseControlsRequest;
    }) => apiClient.updateStorePurchaseControls(householdId, memberId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeControls(householdId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.storeControlsMember(householdId, variables.memberId),
      });
    },
  });
}

export function useStoreGiftCards(householdId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeGiftCards(householdId),
    queryFn: () => apiClient.getStoreGiftCards(householdId),
    enabled: !!householdId && enabled,
  });
}

export function useCreateStoreGiftCard(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateStoreGiftCardRequest) =>
      apiClient.createStoreGiftCard(householdId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeGiftCards(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storePurchases(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeWallet(householdId) });
    },
  });
}

export function useRedeemStoreGiftCard(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RedeemStoreGiftCardRequest) =>
      apiClient.redeemStoreGiftCard(householdId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storeGiftCards(householdId) });
    },
  });
}

// ===== Boss Battle Hooks =====
export function useCurrentBossBattle(householdId: string) {
  return useQuery({
    queryKey: queryKeys.currentBossBattle(householdId),
    queryFn: () => apiClient.getCurrentBossBattle(householdId),
    enabled: !!householdId,
  });
}

export function useBossBattleHistory(householdId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.bossBattleHistory(householdId),
    queryFn: () => apiClient.getBossBattleHistory(householdId, limit),
    enabled: !!householdId,
  });
}

export function useBossBattle(householdId: string, battleId: string) {
  return useQuery({
    queryKey: queryKeys.bossBattle(householdId, battleId),
    queryFn: () => apiClient.getBossBattle(householdId, battleId),
    enabled: !!householdId && !!battleId,
  });
}

export function useCreateBossBattle(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBossBattleRequest) => apiClient.createBossBattle(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentBossBattle(householdId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bossBattleHistory(householdId),
      });
    },
  });
}

export function useDamageBoss(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ battleId, damage }: { battleId: string; damage: number }) =>
      apiClient.damageBoss(householdId, battleId, damage),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentBossBattle(householdId),
      });
      if (result.isDefeated) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bossBattleHistory(householdId),
        });
        // Also refresh member stats since points were awarded
        queryClient.invalidateQueries({
          queryKey: queryKeys.members(householdId),
        });
      }
    },
  });
}

// ===== Activity Feed Hooks =====
export function useActivityFeed(
  householdId: string,
  options?: {
    limit?: number;
    offset?: number;
    memberId?: string;
    type?: string;
    since?: string;
  }
) {
  return useQuery({
    queryKey: queryKeys.activityFeed(householdId, options),
    queryFn: () => apiClient.getActivityFeed(householdId, options),
    enabled: !!householdId,
  });
}

export function useActivityStats(householdId: string, period?: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: queryKeys.activityStats(householdId, period),
    queryFn: () => apiClient.getActivityStats(householdId, period),
    enabled: !!householdId,
  });
}

// ===== Report Hooks =====
export function useReportSummary(
  householdId: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: queryKeys.reportSummary(householdId, options),
    queryFn: () => apiClient.getReportSummary(householdId, options),
    enabled: !!householdId,
  });
}

export function useReportTrend(
  householdId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    memberId?: string;
  }
) {
  return useQuery({
    queryKey: queryKeys.reportTrend(householdId, options),
    queryFn: () => apiClient.getReportTrend(householdId, options),
    enabled: !!householdId,
  });
}

export function useReportCategories(
  householdId: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: queryKeys.reportCategories(householdId, options),
    queryFn: () => apiClient.getReportCategories(householdId, options),
    enabled: !!householdId,
  });
}

// ===== Wellness Hooks (F14.1-F14.5) =====

export function useWellnessActivityLogs(
  householdId: string,
  params?: { memberId?: string; startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: queryKeys.wellnessActivityLogs(householdId, params),
    queryFn: () => apiClient.getWellnessActivityLogs(householdId, params),
    enabled: !!householdId,
  });
}

export function useCreateWellnessActivityLog(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityLogRequest) =>
      apiClient.createWellnessActivityLog(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'wellnessActivityLogs' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'wellnessActivityStats' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useWellnessActivityStats(householdId: string, memberId?: string) {
  return useQuery({
    queryKey: queryKeys.wellnessActivityStats(householdId, memberId),
    queryFn: () => apiClient.getWellnessActivityStats(householdId, memberId),
    enabled: !!householdId,
  });
}

export function useWellnessActivityGoals(householdId: string) {
  return useQuery({
    queryKey: queryKeys.wellnessActivityGoals(householdId),
    queryFn: () => apiClient.getWellnessActivityGoals(householdId),
    enabled: !!householdId,
  });
}

export function useCreateWellnessActivityGoal(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateActivityGoalRequest) =>
      apiClient.createWellnessActivityGoal(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wellnessActivityGoals(householdId) });
    },
  });
}

export function useUpdateWellnessActivityGoal(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: UpdateActivityGoalRequest }) =>
      apiClient.updateWellnessActivityGoal(householdId, goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wellnessActivityGoals(householdId) });
    },
  });
}

export function useWellnessCheckIns(
  householdId: string,
  params?: { memberId?: string; limit?: number }
) {
  return useQuery({
    queryKey: queryKeys.wellnessCheckIns(householdId, params),
    queryFn: () => apiClient.getWellnessCheckIns(householdId, params),
    enabled: !!householdId,
  });
}

export function useCreateWellnessCheckIn(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCheckInRequest) =>
      apiClient.createWellnessCheckIn(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'wellnessCheckIns' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'wellnessTrends' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'moodJournal' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useWellnessTrends(
  householdId: string,
  params?: { memberId?: string; days?: number }
) {
  return useQuery({
    queryKey: queryKeys.wellnessTrends(householdId, params),
    queryFn: () => apiClient.getWellnessTrends(householdId, params),
    enabled: !!householdId,
  });
}

export function useSleepLogs(householdId: string, memberId?: string) {
  return useQuery({
    queryKey: queryKeys.sleepLogs(householdId, memberId),
    queryFn: () => apiClient.getSleepLogs(householdId, memberId),
    enabled: !!householdId,
  });
}

export function useCreateSleepLog(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSleepLogRequest) =>
      apiClient.createSleepLog(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'sleepLogs' &&
          query.queryKey[1] === householdId,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'sleepStats' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useSleepStats(
  householdId: string,
  params?: { memberId?: string; days?: number }
) {
  return useQuery({
    queryKey: queryKeys.sleepStats(householdId, params),
    queryFn: () => apiClient.getSleepStats(householdId, params),
    enabled: !!householdId,
  });
}

export function useMealPlans(
  householdId: string,
  params?: { startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: queryKeys.mealPlans(householdId, params),
    queryFn: () => apiClient.getMealPlans(householdId, params),
    enabled: !!householdId,
  });
}

export function useCreateMealPlan(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMealPlanRequest) =>
      apiClient.createMealPlan(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'mealPlans' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useUpdateMealPlan(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: UpdateMealPlanRequest }) =>
      apiClient.updateMealPlan(householdId, planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'mealPlans' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useDeleteMealPlan(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      apiClient.deleteMealPlan(householdId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'mealPlans' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useMentalHealthResources(householdId: string, category?: string) {
  return useQuery({
    queryKey: queryKeys.mentalHealthResources(householdId, category),
    queryFn: () => apiClient.getMentalHealthResources(householdId, category),
    enabled: !!householdId,
  });
}

export function useCreateMentalHealthResource(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMentalHealthResourceRequest) =>
      apiClient.createMentalHealthResource(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'mentalHealthResources' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useGratitudeEntries(householdId: string, memberId?: string) {
  return useQuery({
    queryKey: queryKeys.gratitudeEntries(householdId, memberId),
    queryFn: () => apiClient.getGratitudeEntries(householdId, memberId),
    enabled: !!householdId,
  });
}

export function useCreateGratitudeEntry(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGratitudeRequest) =>
      apiClient.createGratitudeEntry(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'gratitudeEntries' &&
          query.queryKey[1] === householdId,
      });
    },
  });
}

export function useMoodJournal(
  householdId: string,
  params?: { memberId?: string; days?: number }
) {
  return useQuery({
    queryKey: queryKeys.moodJournal(householdId, params),
    queryFn: () => apiClient.getMoodJournal(householdId, params),
    enabled: !!householdId,
  });
}

// ===== Advanced Analytics & Admin Hooks (F15.1-F15.5) =====

export function useAdvancedReports(householdId: string) {
  return useQuery({
    queryKey: queryKeys.advancedReports(householdId),
    queryFn: () => apiClient.getAdvancedReports(householdId),
    enabled: !!householdId,
  });
}

export function useAdvancedReport(householdId: string, reportId: string) {
  return useQuery({
    queryKey: queryKeys.advancedReport(householdId, reportId),
    queryFn: () => apiClient.getAdvancedReport(householdId, reportId),
    enabled: !!householdId && !!reportId,
  });
}

export function useCreateAdvancedReport(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdvancedReportRequest) => apiClient.createAdvancedReport(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedReports(householdId) });
    },
  });
}

export function useUpdateAdvancedReport(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: UpdateAdvancedReportRequest }) =>
      apiClient.updateAdvancedReport(householdId, reportId, data),
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedReports(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedReport(householdId, reportId) });
    },
  });
}

export function useDeleteAdvancedReport(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => apiClient.deleteAdvancedReport(householdId, reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedReports(householdId) });
    },
  });
}

export function useGenerateReport(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => apiClient.generateReport(householdId, reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedReports(householdId) });
    },
  });
}

export function useGeneratedReports(householdId: string, reportId: string) {
  return useQuery({
    queryKey: queryKeys.generatedReports(householdId, reportId),
    queryFn: () => apiClient.getGeneratedReports(householdId, reportId),
    enabled: !!householdId && !!reportId,
  });
}

export function useAdminDashboard(householdId: string) {
  return useQuery({
    queryKey: queryKeys.adminDashboard(householdId),
    queryFn: () => apiClient.getAdminDashboard(householdId),
    enabled: !!householdId,
  });
}

export function useAdminMembers(householdId: string) {
  return useQuery({
    queryKey: queryKeys.adminMembers(householdId),
    queryFn: () => apiClient.getAdminMembers(householdId),
    enabled: !!householdId,
  });
}

export function useAdminAlerts(householdId: string) {
  return useQuery({
    queryKey: queryKeys.adminAlerts(householdId),
    queryFn: () => apiClient.getAdminAlerts(householdId),
    enabled: !!householdId,
  });
}

export function useMarkAlertRead(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => apiClient.markAlertRead(householdId, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAlerts(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard(householdId) });
    },
  });
}

export function useCreateDataExport(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DataExportRequest) => apiClient.createDataExport(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dataExports(householdId) });
    },
  });
}

export function useDataExports(householdId: string) {
  return useQuery({
    queryKey: queryKeys.dataExports(householdId),
    queryFn: () => apiClient.getDataExports(householdId),
    enabled: !!householdId,
  });
}

export function useDataExport(householdId: string, exportId: string) {
  return useQuery({
    queryKey: queryKeys.dataExport(householdId, exportId),
    queryFn: () => apiClient.getDataExport(householdId, exportId),
    enabled: !!householdId && !!exportId,
  });
}

export function useDeleteDataExport(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exportId: string) => apiClient.deleteDataExport(householdId, exportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dataExports(householdId) });
    },
  });
}

export function useAuditLogs(householdId: string, query?: AuditLogQuery) {
  return useQuery({
    queryKey: queryKeys.auditLogs(householdId, query),
    queryFn: () => apiClient.getAuditLogs(householdId, query),
    enabled: !!householdId,
  });
}

export function useAuditLogSummary(householdId: string) {
  return useQuery({
    queryKey: queryKeys.auditLogSummary(householdId),
    queryFn: () => apiClient.getAuditLogSummary(householdId),
    enabled: !!householdId,
  });
}

export function usePerformanceMetrics(householdId: string) {
  return useQuery({
    queryKey: queryKeys.performanceMetrics(householdId),
    queryFn: () => apiClient.getPerformanceMetrics(householdId),
    enabled: !!householdId,
  });
}

export function usePerformanceHistory(householdId: string, period?: string) {
  return useQuery({
    queryKey: queryKeys.performanceHistory(householdId, period),
    queryFn: () => apiClient.getPerformanceHistory(householdId, period),
    enabled: !!householdId,
  });
}

export function useUsageMetrics(householdId: string) {
  return useQuery({
    queryKey: queryKeys.usageMetrics(householdId),
    queryFn: () => apiClient.getUsageMetrics(householdId),
    enabled: !!householdId,
  });
}

export function useErrorMetrics(householdId: string) {
  return useQuery({
    queryKey: queryKeys.errorMetrics(householdId),
    queryFn: () => apiClient.getErrorMetrics(householdId),
    enabled: !!householdId,
  });
}

export function useResolveError(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (errorId: string) => apiClient.resolveError(householdId, errorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.errorMetrics(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.performanceMetrics(householdId) });
    },
  });
}

// ===== Community & Social Hooks (F16.1-F16.5) =====

export function useForumPosts(householdId: string, params?: { category?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.forumPosts(householdId, params),
    queryFn: () => apiClient.getForumPosts(householdId, params),
    enabled: !!householdId,
  });
}

export function useForumPost(householdId: string, postId: string) {
  return useQuery({
    queryKey: queryKeys.forumPost(householdId, postId),
    queryFn: () => apiClient.getForumPost(householdId, postId),
    enabled: !!householdId && !!postId,
  });
}

export function useCreateForumPost(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateForumPostRequest) => apiClient.createForumPost(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'forumPosts' && q.queryKey[1] === householdId }); },
  });
}

export function useCreateForumReply(householdId: string, postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateForumReplyRequest) => apiClient.createForumReply(householdId, postId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.forumPost(householdId, postId) }); },
  });
}

export function useLikeForumPost(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.likeForumPost(householdId, postId),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'forumPosts' && q.queryKey[1] === householdId }); },
  });
}

export function useDeleteForumPost(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.deleteForumPost(householdId, postId),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'forumPosts' && q.queryKey[1] === householdId }); },
  });
}

export function useSocialChallenges(householdId: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.socialChallenges(householdId, status),
    queryFn: () => apiClient.getSocialChallenges(householdId, status),
    enabled: !!householdId,
  });
}

export function useSocialChallenge(householdId: string, challengeId: string) {
  return useQuery({
    queryKey: queryKeys.socialChallenge(householdId, challengeId),
    queryFn: () => apiClient.getSocialChallenge(householdId, challengeId),
    enabled: !!householdId && !!challengeId,
  });
}

export function useCreateSocialChallenge(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSocialChallengeRequest) => apiClient.createSocialChallenge(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'socialChallenges' && q.queryKey[1] === householdId }); },
  });
}

export function useJoinSocialChallenge(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => apiClient.joinSocialChallenge(householdId, challengeId),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'socialChallenges' && q.queryKey[1] === householdId }); },
  });
}

export function useSocialFeed(householdId: string, params?: { visibility?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.socialFeed(householdId, params),
    queryFn: () => apiClient.getSocialFeed(householdId, params),
    enabled: !!householdId,
  });
}

export function useSocialPost(householdId: string, postId: string) {
  return useQuery({
    queryKey: queryKeys.socialPost(householdId, postId),
    queryFn: () => apiClient.getSocialPost(householdId, postId),
    enabled: !!householdId && !!postId,
  });
}

export function useCreateSocialPost(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSocialPostRequest) => apiClient.createSocialPost(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'socialFeed' && q.queryKey[1] === householdId }); },
  });
}

export function useCreateSocialComment(householdId: string, postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSocialCommentRequest) => apiClient.createSocialComment(householdId, postId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.socialPost(householdId, postId) }); },
  });
}

export function useLikeSocialPost(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.likeSocialPost(householdId, postId),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'socialFeed' && q.queryKey[1] === householdId }); },
  });
}

export function useFriends(householdId: string) {
  return useQuery({
    queryKey: queryKeys.friends(householdId),
    queryFn: () => apiClient.getFriends(householdId),
    enabled: !!householdId,
  });
}

export function useSendFriendRequest(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFriendRequestPayload) => apiClient.sendFriendRequest(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.friends(householdId) }); },
  });
}

export function useRespondToFriendRequest(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, status }: { connectionId: string; status: 'accepted' | 'declined' }) =>
      apiClient.respondToFriendRequest(householdId, connectionId, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.friends(householdId) }); },
  });
}

export function useRemoveFriend(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => apiClient.removeFriend(householdId, connectionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.friends(householdId) }); },
  });
}

export function useFriendSuggestions(householdId: string) {
  return useQuery({
    queryKey: queryKeys.friendSuggestions(householdId),
    queryFn: () => apiClient.getFriendSuggestions(householdId),
    enabled: !!householdId,
  });
}

export function useCommunityEvents(householdId: string, params?: { status?: string; eventType?: string }) {
  return useQuery({
    queryKey: queryKeys.communityEvents(householdId, params),
    queryFn: () => apiClient.getCommunityEvents(householdId, params),
    enabled: !!householdId,
  });
}

export function useCommunityEvent(householdId: string, eventId: string) {
  return useQuery({
    queryKey: queryKeys.communityEvent(householdId, eventId),
    queryFn: () => apiClient.getCommunityEvent(householdId, eventId),
    enabled: !!householdId && !!eventId,
  });
}

export function useCreateCommunityEvent(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommunityEventRequest) => apiClient.createCommunityEvent(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'communityEvents' && q.queryKey[1] === householdId }); },
  });
}

export function useJoinCommunityEvent(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => apiClient.joinCommunityEvent(householdId, eventId),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'communityEvents' && q.queryKey[1] === householdId }); },
  });
}

export function useUpdateCommunityEvent(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Partial<CreateCommunityEventRequest> }) =>
      apiClient.updateCommunityEvent(householdId, eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'communityEvents' && q.queryKey[1] === householdId });
      queryClient.invalidateQueries({ queryKey: queryKeys.communityEvent(householdId, eventId) });
    },
  });
}

export function useDeleteCommunityEvent(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => apiClient.deleteCommunityEvent(householdId, eventId),
    onSuccess: () => { queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'communityEvents' && q.queryKey[1] === householdId }); },
  });
}

// ===== Phase 17: Smart Automation & AI Hooks =====

// F17.1 Smart Scheduling
export function useSmartScheduleConfig(householdId: string) {
  return useQuery({
    queryKey: queryKeys.smartScheduleConfig(householdId),
    queryFn: () => apiClient.getSmartScheduleConfig(householdId),
  });
}

export function useUpdateSmartScheduleConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSmartScheduleConfigRequest) => apiClient.updateSmartScheduleConfig(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.smartScheduleConfig(householdId) }); },
  });
}

export function useRunScheduleOptimization(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.runScheduleOptimization(householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.smartScheduleConfig(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleConflicts(householdId) });
    },
  });
}

export function useScheduleConflicts(householdId: string) {
  return useQuery({
    queryKey: queryKeys.scheduleConflicts(householdId),
    queryFn: () => apiClient.getScheduleConflicts(householdId),
  });
}

export function useResolveScheduleConflict(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conflictId, resolution }: { conflictId: string; resolution: string }) =>
      apiClient.resolveScheduleConflict(householdId, conflictId, resolution),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.scheduleConflicts(householdId) }); },
  });
}

// F17.2 AI Chore Suggestions
export function useAISuggestions(householdId: string) {
  return useQuery({
    queryKey: queryKeys.aiSuggestions(householdId),
    queryFn: () => apiClient.getAISuggestions(householdId),
  });
}

export function useProvideSuggestionFeedback(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedback: SuggestionFeedback) => apiClient.provideSuggestionFeedback(householdId, feedback),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.aiSuggestions(householdId) }); },
  });
}

export function useSuggestionPreferences(householdId: string) {
  return useQuery({
    queryKey: queryKeys.suggestionPreferences(householdId),
    queryFn: () => apiClient.getSuggestionPreferences(householdId),
  });
}

export function useUpdateSuggestionPreferences(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSuggestionPreferencesRequest) => apiClient.updateSuggestionPreferences(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.suggestionPreferences(householdId) }); },
  });
}

export function useGenerateSuggestions(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.generateSuggestions(householdId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.aiSuggestions(householdId) }); },
  });
}

// F17.3 Automation Rules
export function useAutomationRules(householdId: string) {
  return useQuery({
    queryKey: queryKeys.automationRules(householdId),
    queryFn: () => apiClient.getAutomationRules(householdId),
  });
}

export function useCreateAutomationRule(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAutomationRuleRequest) => apiClient.createAutomationRule(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.automationRules(householdId) }); },
  });
}

export function useAutomationRule(householdId: string, ruleId: string) {
  return useQuery({
    queryKey: queryKeys.automationRule(householdId, ruleId),
    queryFn: () => apiClient.getAutomationRule(householdId, ruleId),
    enabled: !!ruleId,
  });
}

export function useUpdateAutomationRule(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: UpdateAutomationRuleRequest }) =>
      apiClient.updateAutomationRule(householdId, ruleId, data),
    onSuccess: (_, { ruleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automationRules(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.automationRule(householdId, ruleId) });
    },
  });
}

export function useDeleteAutomationRule(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => apiClient.deleteAutomationRule(householdId, ruleId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.automationRules(householdId) }); },
  });
}

export function useAutomationRuleLogs(householdId: string, ruleId: string) {
  return useQuery({
    queryKey: queryKeys.automationRuleLogs(householdId, ruleId),
    queryFn: () => apiClient.getAutomationRuleLogs(householdId, ruleId),
    enabled: !!ruleId,
  });
}

export function useTestAutomationRule(householdId: string) {
  return useMutation({
    mutationFn: (ruleId: string) => apiClient.testAutomationRule(householdId, ruleId),
  });
}

// F17.4 Predictive Analytics
export function usePredictions(householdId: string) {
  return useQuery({
    queryKey: queryKeys.predictions(householdId),
    queryFn: () => apiClient.getPredictions(householdId),
  });
}

export function usePredictiveInsights(householdId: string) {
  return useQuery({
    queryKey: queryKeys.predictiveInsights(householdId),
    queryFn: () => apiClient.getPredictiveInsights(householdId),
  });
}

export function useMarkInsightRead(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (insightId: string) => apiClient.markInsightRead(householdId, insightId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.predictiveInsights(householdId) }); },
  });
}

export function usePredictiveAnalyticsConfig(householdId: string) {
  return useQuery({
    queryKey: queryKeys.predictiveAnalyticsConfig(householdId),
    queryFn: () => apiClient.getPredictiveAnalyticsConfig(householdId),
  });
}

export function useUpdatePredictiveAnalyticsConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePredictiveAnalyticsConfigRequest) => apiClient.updatePredictiveAnalyticsConfig(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.predictiveAnalyticsConfig(householdId) }); },
  });
}

export function useGeneratePredictions(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.generatePredictions(householdId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.predictions(householdId) }); },
  });
}

// F17.5 Natural Language Commands
export function useExecuteCommand(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CommandRequest) => apiClient.executeCommand(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.commandHistory(householdId) }); },
  });
}

export function useCommandHistory(householdId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: queryKeys.commandHistory(householdId, params),
    queryFn: () => apiClient.getCommandHistory(householdId, params),
  });
}

export function useCommandCapabilities(householdId: string) {
  return useQuery({
    queryKey: queryKeys.commandCapabilities(householdId),
    queryFn: () => apiClient.getCommandCapabilities(householdId),
  });
}

// ===== Phase 18: Communication & Calendar Integration =====

// F18.1 Calendar Sync
export function useCalendarConnections(householdId: string) {
  return useQuery({
    queryKey: queryKeys.calendarConnections(householdId),
    queryFn: () => apiClient.getCalendarConnections(householdId),
  });
}

export function useCreateCalendarConnection(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { memberId: string } & CreateCalendarConnectionRequest) => apiClient.createCalendarConnection(householdId, data.memberId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.calendarConnections(householdId) }); },
  });
}

export function useDeleteCalendarConnection(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => apiClient.deleteCalendarConnection(householdId, connectionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.calendarConnections(householdId) }); },
  });
}

export function useSyncCalendarConnection(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => apiClient.syncCalendarConnection(householdId, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarConnections(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarEvents(householdId) });
    },
  });
}

export function useCalendarEvents(householdId: string, params?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: queryKeys.calendarEvents(householdId, params),
    queryFn: () => apiClient.getCalendarEvents(householdId, params),
  });
}

export function useCalendarSyncConfig(householdId: string) {
  return useQuery({
    queryKey: queryKeys.calendarSyncConfig(householdId),
    queryFn: () => apiClient.getCalendarSyncConfig(householdId),
  });
}

export function useUpdateCalendarSyncConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCalendarSyncConfigRequest) => apiClient.updateCalendarSyncConfig(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.calendarSyncConfig(householdId) }); },
  });
}

// F18.2 Family Chat
export function useChatChannels(householdId: string) {
  return useQuery({
    queryKey: queryKeys.chatChannels(householdId),
    queryFn: () => apiClient.getChatChannels(householdId),
  });
}

export function useCreateChatChannel(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChatChannelRequest) => apiClient.createChatChannel(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.chatChannels(householdId) }); },
  });
}

export function useChatMessages(householdId: string, channelId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: queryKeys.chatMessages(householdId, channelId, params),
    queryFn: () => apiClient.getChatMessages(householdId, channelId, params),
    enabled: !!channelId,
  });
}

export function useSendChatMessage(householdId: string, channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChatMessageRequest) => apiClient.sendChatMessage(householdId, channelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(householdId, channelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(householdId) });
    },
  });
}

export function useChatUnreadCounts(householdId: string) {
  return useQuery({
    queryKey: queryKeys.chatUnread(householdId),
    queryFn: () => apiClient.getChatUnreadCounts(householdId),
  });
}

// F18.3 Photo Albums
export function usePhotoAlbums(householdId: string) {
  return useQuery({
    queryKey: queryKeys.photoAlbums(householdId),
    queryFn: () => apiClient.getPhotoAlbums(householdId),
  });
}

export function useCreatePhotoAlbum(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePhotoAlbumRequest) => apiClient.createPhotoAlbum(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.photoAlbums(householdId) }); },
  });
}

export function useAlbumPhotos(householdId: string, albumId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: queryKeys.albumPhotos(householdId, albumId, params),
    queryFn: () => apiClient.getAlbumPhotos(householdId, albumId, params),
    enabled: !!albumId,
  });
}

export function useUploadPhoto(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UploadPhotoRequest) => apiClient.uploadPhoto(householdId, data),
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: queryKeys.albumPhotos(householdId, variables.albumId) }); },
  });
}

export function useDeletePhoto(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => apiClient.deletePhoto(householdId, photoId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.photoAlbums(householdId) }); },
  });
}

// F18.4 Shareable Achievements
export function useShareableAchievements(householdId: string) {
  return useQuery({
    queryKey: queryKeys.shareableAchievements(householdId),
    queryFn: () => apiClient.getShareableAchievements(householdId),
  });
}

export function useCreateShareableAchievement(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { memberId: string } & CreateShareableAchievementRequest) => apiClient.createShareableAchievement(householdId, data.memberId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.shareableAchievements(householdId) }); },
  });
}

export function useShareAchievement(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { achievementId: string; platform: string }) => apiClient.shareAchievementToSocial(householdId, data.achievementId, data.platform),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.shareableAchievements(householdId) }); },
  });
}

export function useShareSettings(householdId: string) {
  return useQuery({
    queryKey: queryKeys.shareSettings(householdId),
    queryFn: () => apiClient.getShareSettings(householdId),
  });
}

export function useUpdateShareSettings(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateShareSettingsRequest) => apiClient.updateShareSettings(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.shareSettings(householdId) }); },
  });
}

// F18.5 Progressive Unlocks
export function useProgressiveUnlocks(householdId: string, params?: { category?: string }) {
  return useQuery({
    queryKey: queryKeys.progressiveUnlocks(householdId, params),
    queryFn: () => apiClient.getProgressiveUnlocks(householdId, params),
  });
}

export function useMemberUnlockProgress(householdId: string, memberId: string) {
  return useQuery({
    queryKey: queryKeys.memberUnlockProgress(householdId, memberId),
    queryFn: () => apiClient.getMemberUnlockProgress(householdId, memberId),
    enabled: !!memberId,
  });
}

export function useUnlockProgressSummary(householdId: string, memberId: string) {
  return useQuery({
    queryKey: queryKeys.unlockProgressSummary(householdId, memberId),
    queryFn: () => apiClient.getUnlockProgressSummary(householdId, memberId),
    enabled: !!memberId,
  });
}

export function useCheckUnlocks(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => apiClient.checkUnlocks(householdId, memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberUnlockProgress(householdId, memberId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.unlockProgressSummary(householdId, memberId) });
    },
  });
}

// ===== Phase 19: Financial Integration & Advanced Scheduling =====

// F19.1 Banking Integration
export function useBankingConnections(householdId: string) {
  return useQuery({
    queryKey: queryKeys.bankingConnections(householdId),
    queryFn: () => apiClient.getBankingConnections(householdId),
  });
}

export function useCreateBankingConnection(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBankingConnectionRequest) => apiClient.createBankingConnection(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.bankingConnections(householdId) }); },
  });
}

export function useDeleteBankingConnection(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => apiClient.deleteBankingConnection(householdId, connectionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.bankingConnections(householdId) }); },
  });
}

export function useVerifyBankingConnection(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => apiClient.verifyBankingConnection(householdId, connectionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.bankingConnections(householdId) }); },
  });
}

export function useAllowanceDeposits(householdId: string) {
  return useQuery({
    queryKey: queryKeys.allowanceDeposits(householdId),
    queryFn: () => apiClient.getAllowanceDeposits(householdId),
  });
}

export function useTriggerDeposit(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { memberId: string; bankingConnectionId: string; amount: number; currency?: string }) => apiClient.triggerDeposit(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.allowanceDeposits(householdId) }); },
  });
}

export function useDepositConfigs(householdId: string) {
  return useQuery({
    queryKey: queryKeys.depositConfigs(householdId),
    queryFn: () => apiClient.getDepositConfigs(householdId),
  });
}

export function useCreateDepositConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAllowanceDepositConfigRequest) => apiClient.createDepositConfig(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.depositConfigs(householdId) }); },
  });
}

export function useUpdateDepositConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { configId: string } & UpdateAllowanceDepositConfigRequest) => apiClient.updateDepositConfig(householdId, data.configId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.depositConfigs(householdId) }); },
  });
}

export function useDeleteDepositConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configId: string) => apiClient.deleteDepositConfig(householdId, configId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.depositConfigs(householdId) }); },
  });
}

export function useDepositSummary(householdId: string) {
  return useQuery({
    queryKey: queryKeys.depositSummary(householdId),
    queryFn: () => apiClient.getDepositSummary(householdId),
  });
}

// F19.2 Rotation System
export function useChoreRotations(householdId: string) {
  return useQuery({
    queryKey: queryKeys.choreRotations(householdId),
    queryFn: () => apiClient.getChoreRotations(householdId),
  });
}

export function useCreateChoreRotation(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChoreRotationRequest) => apiClient.createChoreRotation(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreRotations(householdId) }); },
  });
}

export function useChoreRotation(householdId: string, rotationId: string) {
  return useQuery({
    queryKey: queryKeys.choreRotation(householdId, rotationId),
    queryFn: () => apiClient.getChoreRotation(householdId, rotationId),
    enabled: !!rotationId,
  });
}

export function useUpdateChoreRotation(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rotationId: string } & UpdateChoreRotationRequest) => apiClient.updateChoreRotation(householdId, data.rotationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.choreRotations(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.choreRotation(householdId, variables.rotationId) });
    },
  });
}

export function useDeleteChoreRotation(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rotationId: string) => apiClient.deleteChoreRotation(householdId, rotationId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreRotations(householdId) }); },
  });
}

export function useAdvanceRotation(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rotationId: string) => apiClient.advanceRotation(householdId, rotationId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreRotations(householdId) }); },
  });
}

export function useSkipRotation(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rotationId: string; reason?: string }) => apiClient.skipRotation(householdId, data.rotationId, data.reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreRotations(householdId) }); },
  });
}

export function useRotationHistory(householdId: string, rotationId: string) {
  return useQuery({
    queryKey: queryKeys.rotationHistory(householdId, rotationId),
    queryFn: () => apiClient.getRotationHistory(householdId, rotationId),
    enabled: !!rotationId,
  });
}

export function useRotationFairness(householdId: string, rotationId: string) {
  return useQuery({
    queryKey: queryKeys.rotationFairness(householdId, rotationId),
    queryFn: () => apiClient.getRotationFairness(householdId, rotationId),
    enabled: !!rotationId,
  });
}

// F19.3 Chore Chains
export function useChoreChains(householdId: string) {
  return useQuery({
    queryKey: queryKeys.choreChains(householdId),
    queryFn: () => apiClient.getChoreChains(householdId),
  });
}

export function useCreateChoreChain(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChoreChainRequest) => apiClient.createChoreChain(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreChains(householdId) }); },
  });
}

export function useChoreChainProgress(householdId: string, chainId: string) {
  return useQuery({
    queryKey: queryKeys.choreChainProgress(householdId, chainId),
    queryFn: () => apiClient.getChoreChainProgress(householdId, chainId),
    enabled: !!chainId,
  });
}

export function useUpdateChoreChain(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { chainId: string } & UpdateChoreChainRequest) => apiClient.updateChoreChain(householdId, data.chainId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.choreChains(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.choreChainProgress(householdId, variables.chainId) });
    },
  });
}

export function useDeleteChoreChain(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chainId: string) => apiClient.deleteChoreChain(householdId, chainId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreChains(householdId) }); },
  });
}

export function useCompleteChainStep(householdId: string, chainId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => apiClient.completeChainStep(householdId, chainId, stepId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.choreChainProgress(householdId, chainId) }); },
  });
}

// F19.4 Responsibilities vs Jobs
export function useResponsibilityConfig(householdId: string) {
  return useQuery({
    queryKey: queryKeys.responsibilityConfig(householdId),
    queryFn: () => apiClient.getResponsibilityConfig(householdId),
  });
}

export function useUpdateResponsibilityConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateResponsibilityConfigRequest) => apiClient.updateResponsibilityConfig(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.responsibilityConfig(householdId) }); },
  });
}

export function useChoreClassifications(householdId: string) {
  return useQuery({
    queryKey: queryKeys.choreClassifications(householdId),
    queryFn: () => apiClient.getChoreClassifications(householdId),
  });
}

export function useClassifyChore(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassifyChoreRequest) => apiClient.classifyChore(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.choreClassifications(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.classificationSummary(householdId) });
    },
  });
}

export function useClassificationSummary(householdId: string) {
  return useQuery({
    queryKey: queryKeys.classificationSummary(householdId),
    queryFn: () => apiClient.getClassificationSummary(householdId),
  });
}

// F19.5 Chore Marketplace
export function useMarketplaceListings(householdId: string) {
  return useQuery({
    queryKey: queryKeys.marketplaceListings(householdId),
    queryFn: () => apiClient.getMarketplaceListings(householdId),
  });
}

export function useCreateMarketplaceListing(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMarketplaceListingRequest) => apiClient.createMarketplaceListing(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceListings(householdId) }); },
  });
}

export function useClaimMarketplaceListing(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => apiClient.claimMarketplaceListing(householdId, listingId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceListings(householdId) }); },
  });
}

export function useCompleteMarketplaceListing(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => apiClient.completeMarketplaceListing(householdId, listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceListings(householdId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceStats(householdId) });
    },
  });
}

export function useCancelMarketplaceListing(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => apiClient.cancelMarketplaceListing(householdId, listingId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceListings(householdId) }); },
  });
}

export function useMarketplaceStats(householdId: string) {
  return useQuery({
    queryKey: queryKeys.marketplaceStats(householdId),
    queryFn: () => apiClient.getMarketplaceStats(householdId),
  });
}

export function useMarketplaceConfig(householdId: string) {
  return useQuery({
    queryKey: queryKeys.marketplaceConfig(householdId),
    queryFn: () => apiClient.getMarketplaceConfig(householdId),
  });
}

export function useUpdateMarketplaceConfig(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMarketplaceConfigRequest) => apiClient.updateMarketplaceConfig(householdId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceConfig(householdId) }); },
  });
}
