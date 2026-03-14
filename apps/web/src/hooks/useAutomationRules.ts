import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationRulesApi, type AutomationRule } from '../lib/api';

export function useAutomationRules(householdId: string) {
  return useQuery({
    queryKey: ['automation-rules', householdId],
    queryFn: () => automationRulesApi.list(householdId),
    enabled: !!householdId,
  });
}

export function useCreateAutomationRule(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AutomationRule, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) =>
      automationRulesApi.create(householdId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', householdId] });
    },
  });
}

export function useUpdateAutomationRule(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: Partial<Omit<AutomationRule, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>> }) =>
      automationRulesApi.update(householdId, ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', householdId] });
    },
  });
}

export function useDeleteAutomationRule(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => automationRulesApi.remove(householdId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', householdId] });
    },
  });
}

export function useToggleAutomationRule(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => automationRulesApi.toggle(householdId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', householdId] });
    },
  });
}
