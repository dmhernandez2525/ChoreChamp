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
} from '@chorechamp/types';

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
  storeCatalog: (householdId: string, options?: Record<string, unknown>) =>
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
  activityFeed: (householdId: string, options?: Record<string, unknown>) =>
    ['activityFeed', householdId, options] as const,
  activityStats: (householdId: string, period?: string) =>
    ['activityStats', householdId, period] as const,
  // Reports
  reportSummary: (householdId: string, options?: Record<string, unknown>) =>
    ['reportSummary', householdId, options] as const,
  reportTrend: (householdId: string, options?: Record<string, unknown>) =>
    ['reportTrend', householdId, options] as const,
  reportCategories: (householdId: string, options?: Record<string, unknown>) =>
    ['reportCategories', householdId, options] as const,
  // Wellness
  wellnessActivityLogs: (householdId: string, params?: Record<string, unknown>) =>
    ['wellnessActivityLogs', householdId, params] as const,
  wellnessActivityStats: (householdId: string, memberId?: string) =>
    ['wellnessActivityStats', householdId, memberId] as const,
  wellnessActivityGoals: (householdId: string) =>
    ['wellnessActivityGoals', householdId] as const,
  wellnessCheckIns: (householdId: string, params?: Record<string, unknown>) =>
    ['wellnessCheckIns', householdId, params] as const,
  wellnessTrends: (householdId: string, params?: Record<string, unknown>) =>
    ['wellnessTrends', householdId, params] as const,
  sleepLogs: (householdId: string, memberId?: string) =>
    ['sleepLogs', householdId, memberId] as const,
  sleepStats: (householdId: string, params?: Record<string, unknown>) =>
    ['sleepStats', householdId, params] as const,
  mealPlans: (householdId: string, params?: Record<string, unknown>) =>
    ['mealPlans', householdId, params] as const,
  mentalHealthResources: (householdId: string, category?: string) =>
    ['mentalHealthResources', householdId, category] as const,
  gratitudeEntries: (householdId: string, memberId?: string) =>
    ['gratitudeEntries', householdId, memberId] as const,
  moodJournal: (householdId: string, params?: Record<string, unknown>) =>
    ['moodJournal', householdId, params] as const,
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
