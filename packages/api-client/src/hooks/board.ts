import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  AddCommentRequest,
  CreateSavedFilterRequest,
} from '@chorechamp/types';

// ===== Query Keys =====
export const boardQueryKeys = {
  boardPreferences: (householdId: string) =>
    ['boardPreferences', householdId] as const,
  calendar: (householdId: string, startDate: string, endDate: string) =>
    ['calendar', householdId, startDate, endDate] as const,
  calendarCounts: (householdId: string, startDate: string, endDate: string) =>
    ['calendarCounts', householdId, startDate, endDate] as const,
  choreComments: (householdId: string, choreId: string) =>
    ['choreComments', householdId, choreId] as const,
  choreAttachments: (householdId: string, choreId: string) =>
    ['choreAttachments', householdId, choreId] as const,
  choreActivity: (householdId: string, choreId: string) =>
    ['choreActivity', householdId, choreId] as const,
  savedFilters: (householdId: string) =>
    ['savedFilters', householdId] as const,
};

// ===== Board Preferences =====
export function useBoardPreferences(householdId: string) {
  return useQuery({
    queryKey: boardQueryKeys.boardPreferences(householdId),
    queryFn: () => apiClient.getBoardPreferences(householdId),
    enabled: !!householdId,
  });
}

export function useUpdateBoardPreferences(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.updateBoardPreferences(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.boardPreferences(householdId),
      });
    },
  });
}

// ===== Calendar =====
export function useCalendarChores(
  householdId: string,
  startDate: string,
  endDate: string,
  memberId?: string
) {
  return useQuery({
    queryKey: boardQueryKeys.calendar(householdId, startDate, endDate),
    queryFn: () => apiClient.getCalendarChores(householdId, startDate, endDate, memberId),
    enabled: !!householdId && !!startDate && !!endDate,
  });
}

export function useCalendarCounts(
  householdId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: boardQueryKeys.calendarCounts(householdId, startDate, endDate),
    queryFn: () => apiClient.getCalendarCounts(householdId, startDate, endDate),
    enabled: !!householdId && !!startDate && !!endDate,
  });
}

// ===== Comments =====
export function useChoreComments(householdId: string, choreId: string) {
  return useQuery({
    queryKey: boardQueryKeys.choreComments(householdId, choreId),
    queryFn: () => apiClient.getChoreComments(householdId, choreId),
    enabled: !!householdId && !!choreId,
  });
}

export function useAddComment(householdId: string, choreId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentRequest) =>
      apiClient.addChoreComment(householdId, choreId, data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.choreComments(householdId, choreId),
      });
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.choreActivity(householdId, choreId),
      });
    },
  });
}

export function useDeleteComment(householdId: string, choreId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient.deleteChoreComment(householdId, choreId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.choreComments(householdId, choreId),
      });
    },
  });
}

// ===== Attachments =====
export function useChoreAttachments(householdId: string, choreId: string) {
  return useQuery({
    queryKey: boardQueryKeys.choreAttachments(householdId, choreId),
    queryFn: () => apiClient.getChoreAttachments(householdId, choreId),
    enabled: !!householdId && !!choreId,
  });
}

export function useAddAttachment(householdId: string, choreId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      isPhotoProof?: boolean;
    }) => apiClient.addChoreAttachment(householdId, choreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.choreAttachments(householdId, choreId),
      });
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.choreActivity(householdId, choreId),
      });
    },
  });
}

// ===== Activity =====
export function useChoreActivity(householdId: string, choreId: string) {
  return useQuery({
    queryKey: boardQueryKeys.choreActivity(householdId, choreId),
    queryFn: () => apiClient.getChoreActivity(householdId, choreId),
    enabled: !!householdId && !!choreId,
  });
}

// ===== Bulk Actions =====
export function useBulkUpdateChores(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { choreIds: string[]; changes: Record<string, unknown> }) =>
      apiClient.bulkUpdateChores(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}

export function useBulkReorderChores(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Array<{ choreId: string; boardOrder: number }>) =>
      apiClient.bulkReorderChores(householdId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}

export function useBulkDeleteChores(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choreIds: string[]) =>
      apiClient.bulkDeleteChores(householdId, choreIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}

// ===== Saved Filters =====
export function useSavedFilters(householdId: string) {
  return useQuery({
    queryKey: boardQueryKeys.savedFilters(householdId),
    queryFn: () => apiClient.getSavedFilters(householdId),
    enabled: !!householdId,
  });
}

export function useCreateSavedFilter(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavedFilterRequest) =>
      apiClient.createSavedFilter(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.savedFilters(householdId),
      });
    },
  });
}

export function useDeleteSavedFilter(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filterId: string) =>
      apiClient.deleteSavedFilter(householdId, filterId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.savedFilters(householdId),
      });
    },
  });
}
