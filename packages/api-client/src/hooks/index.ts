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
