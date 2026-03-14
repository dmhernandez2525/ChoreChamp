import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  ChoreComment,
  ChoreAttachment,
  ChoreActivityEntry,
  SavedFilterView,
  BoardPreferences,
  BulkUpdateRequest,
  BulkReorderRequest,
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
    queryFn: () =>
      apiClient.get<BoardPreferences>(
        `/api/households/${householdId}/board/preferences`
      ),
    enabled: !!householdId,
  });
}

export function useUpdateBoardPreferences(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BoardPreferences>) =>
      apiClient.put(`/api/households/${householdId}/board/preferences`, data),
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
    queryFn: () => {
      const params = new URLSearchParams({ startDate, endDate });
      if (memberId) params.set('memberId', memberId);
      return apiClient.get(
        `/api/households/${householdId}/calendar?${params.toString()}`
      );
    },
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
    queryFn: () =>
      apiClient.get(
        `/api/households/${householdId}/calendar/counts?startDate=${startDate}&endDate=${endDate}`
      ),
    enabled: !!householdId && !!startDate && !!endDate,
  });
}

// ===== Comments =====
export function useChoreComments(householdId: string, choreId: string) {
  return useQuery({
    queryKey: boardQueryKeys.choreComments(householdId, choreId),
    queryFn: () =>
      apiClient.get<ChoreComment[]>(
        `/api/households/${householdId}/chores/${choreId}/comments`
      ),
    enabled: !!householdId && !!choreId,
  });
}

export function useAddComment(householdId: string, choreId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentRequest) =>
      apiClient.post(
        `/api/households/${householdId}/chores/${choreId}/comments`,
        data
      ),
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
      apiClient.delete(
        `/api/households/${householdId}/chores/${choreId}/comments/${commentId}`
      ),
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
    queryFn: () =>
      apiClient.get<ChoreAttachment[]>(
        `/api/households/${householdId}/chores/${choreId}/attachments`
      ),
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
    }) =>
      apiClient.post(
        `/api/households/${householdId}/chores/${choreId}/attachments`,
        data
      ),
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
    queryFn: () =>
      apiClient.get<ChoreActivityEntry[]>(
        `/api/households/${householdId}/chores/${choreId}/activity`
      ),
    enabled: !!householdId && !!choreId,
  });
}

// ===== Bulk Actions =====
export function useBulkUpdateChores(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateRequest) =>
      apiClient.patch(
        `/api/households/${householdId}/chores/bulk`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}

export function useBulkReorderChores(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkReorderRequest) =>
      apiClient.patch(
        `/api/households/${householdId}/chores/reorder`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}

export function useBulkDeleteChores(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choreIds: string[]) =>
      apiClient.post(
        `/api/households/${householdId}/chores/bulk-delete`,
        { choreIds }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}

// ===== Saved Filters =====
export function useSavedFilters(householdId: string) {
  return useQuery({
    queryKey: boardQueryKeys.savedFilters(householdId),
    queryFn: () =>
      apiClient.get<SavedFilterView[]>(
        `/api/households/${householdId}/board/filters`
      ),
    enabled: !!householdId,
  });
}

export function useCreateSavedFilter(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavedFilterRequest) =>
      apiClient.post(
        `/api/households/${householdId}/board/filters`,
        data
      ),
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
      apiClient.delete(
        `/api/households/${householdId}/board/filters/${filterId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.savedFilters(householdId),
      });
    },
  });
}
