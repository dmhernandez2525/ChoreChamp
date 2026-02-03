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
  stats: (householdId: string, memberId: string) =>
    ['stats', householdId, memberId] as const,
  transactions: (householdId: string, memberId: string) =>
    ['transactions', householdId, memberId] as const,
  streak: (householdId: string, memberId: string) =>
    ['streak', householdId, memberId] as const,
  badges: (householdId: string, memberId: string) =>
    ['badges', householdId, memberId] as const,
  leaderboard: (householdId: string, period?: string) =>
    ['leaderboard', householdId, period] as const,
  // Rewards
  rewards: (householdId: string) => ['rewards', householdId] as const,
  reward: (householdId: string, rewardId: string) =>
    ['reward', householdId, rewardId] as const,
  pendingRedemptions: (householdId: string) =>
    ['pendingRedemptions', householdId] as const,
  supportThreads: (householdId: string) => ['supportThreads', householdId] as const,
  supportThread: (householdId: string, threadId: string) =>
    ['supportThread', householdId, threadId] as const,
  apiKeys: (householdId: string) => ['apiKeys', householdId] as const,
  // Boss Battles
  currentBossBattle: (householdId: string) =>
    ['currentBossBattle', householdId] as const,
  bossBattleHistory: (householdId: string) =>
    ['bossBattleHistory', householdId] as const,
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
    mutationFn: (data: CreateInviteCodeRequest) =>
      apiClient.createInviteCode(householdId, data),
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
    mutationFn: ({
      rewardId,
      data,
    }: {
      rewardId: string;
      data: Partial<CreateRewardRequest>;
    }) => apiClient.updateReward(householdId, rewardId, data),
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
    mutationFn: (redemptionId: string) =>
      apiClient.approveRedemption(householdId, redemptionId),
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
    mutationFn: (redemptionId: string) =>
      apiClient.fulfillRedemption(householdId, redemptionId),
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
    mutationFn: ({
      redemptionId,
      reason,
    }: {
      redemptionId: string;
      reason: string;
    }) => apiClient.rejectRedemption(householdId, redemptionId, reason),
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
    mutationFn: (data: CreateBossBattleRequest) =>
      apiClient.createBossBattle(householdId, data),
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

export function useActivityStats(
  householdId: string,
  period?: 'day' | 'week' | 'month'
) {
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
