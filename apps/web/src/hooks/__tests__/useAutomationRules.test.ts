import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { AutomationRule } from '../../lib/api';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useUpdateAutomationRule,
  useDeleteAutomationRule,
  useToggleAutomationRule,
} from '../useAutomationRules';

const mockRules: AutomationRule[] = [
  {
    id: 'rule-1',
    householdId: 'h1',
    name: 'Auto-assign dishes',
    description: 'Assigns dishes chore on Monday',
    trigger: 'schedule',
    triggerConfig: { day: 'monday' },
    action: 'assign',
    actionConfig: { memberId: 'm1' },
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    householdId: 'h1',
    name: 'Notify on completion',
    description: null,
    trigger: 'chore_completed',
    triggerConfig: {},
    action: 'notify',
    actionConfig: { channel: 'push' },
    enabled: false,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

const mockApi = {
  list: vi.fn().mockResolvedValue(mockRules),
  create: vi.fn().mockResolvedValue(mockRules[0]),
  update: vi.fn().mockResolvedValue(mockRules[0]),
  remove: vi.fn().mockResolvedValue(undefined),
  toggle: vi.fn().mockResolvedValue({ ...mockRules[0], enabled: false }),
};

vi.mock('../../lib/api', () => ({
  automationRulesApi: {
    list: (...args: unknown[]) => mockApi.list(...args),
    create: (...args: unknown[]) => mockApi.create(...args),
    update: (...args: unknown[]) => mockApi.update(...args),
    remove: (...args: unknown[]) => mockApi.remove(...args),
    toggle: (...args: unknown[]) => mockApi.toggle(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useAutomationRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches automation rules for a household', async () => {
    const { result } = renderHook(() => useAutomationRules('h1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.list).toHaveBeenCalledWith('h1');
    expect(result.current.data).toEqual(mockRules);
    expect(result.current.data).toHaveLength(2);
  });

  it('does not fetch when householdId is empty', async () => {
    const { result } = renderHook(() => useAutomationRules(''), {
      wrapper: createWrapper(),
    });

    // Should stay in idle/disabled state
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApi.list).not.toHaveBeenCalled();
  });
});

describe('useCreateAutomationRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the create API with the correct arguments', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateAutomationRule('h1'), {
      wrapper,
    });

    const newRule = {
      name: 'New rule',
      description: 'Test',
      trigger: 'schedule',
      triggerConfig: { day: 'friday' },
      action: 'assign',
      actionConfig: { memberId: 'm2' },
      enabled: true,
    };

    result.current.mutate(newRule);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.create).toHaveBeenCalledWith('h1', newRule);
  });
});

describe('useUpdateAutomationRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the update API with ruleId and data', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateAutomationRule('h1'), {
      wrapper,
    });

    result.current.mutate({
      ruleId: 'rule-1',
      data: { name: 'Updated name' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.update).toHaveBeenCalledWith('h1', 'rule-1', {
      name: 'Updated name',
    });
  });
});

describe('useDeleteAutomationRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the remove API with the rule ID', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteAutomationRule('h1'), {
      wrapper,
    });

    result.current.mutate('rule-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.remove).toHaveBeenCalledWith('h1', 'rule-1');
  });
});

describe('useToggleAutomationRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the toggle API with the rule ID', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useToggleAutomationRule('h1'), {
      wrapper,
    });

    result.current.mutate('rule-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.toggle).toHaveBeenCalledWith('h1', 'rule-1');
  });
});
