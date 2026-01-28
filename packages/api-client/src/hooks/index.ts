import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  SignInRequest,
  SignUpRequest,
  CreateHouseholdRequest,
  AddMemberRequest,
  CreateChoreRequest,
  CompleteChoreRequest,
  JoinHouseholdRequest,
  CreateRewardRequest,
} from '@chorechamp/types';

// ===== Query Keys =====
export const queryKeys = {
  session: ['session'] as const,
  households: ['households'] as const,
  household: (id: string) => ['household', id] as const,
  members: (householdId: string) => ['members', householdId] as const,
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

export function useJoinHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinHouseholdRequest) => apiClient.joinHousehold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
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
