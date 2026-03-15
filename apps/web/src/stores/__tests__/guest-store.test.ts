import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGuestStore, getDemoTodayChores } from '../guest-store';

describe('useGuestStore', () => {
  beforeEach(() => {
    useGuestStore.getState().reset();
  });

  describe('initial state', () => {
    it('starts in non-guest mode', () => {
      expect(useGuestStore.getState().isGuestMode).toBe(false);
    });

    it('has not seen demo initially', () => {
      expect(useGuestStore.getState().hasSeenDemo).toBe(false);
    });

    it('has demo household data', () => {
      const state = useGuestStore.getState();
      expect(state.demoHousehold.id).toBe('demo-household');
      expect(state.demoHousehold.name).toBe('Demo Family');
      expect(state.demoHousehold.pointsName).toBe('stars');
    });

    it('has demo members', () => {
      const members = useGuestStore.getState().demoMembers;
      expect(members).toHaveLength(3);
      expect(members[0].role).toBe('parent');
      expect(members[1].role).toBe('child');
      expect(members[2].role).toBe('child');
    });

    it('has demo chores', () => {
      const chores = useGuestStore.getState().demoChores;
      expect(chores).toHaveLength(4);
      expect(chores.map((c) => c.title)).toEqual([
        'Make Bed',
        'Clean Room',
        'Set Table',
        'Feed Pets',
      ]);
    });

    it('has demo rewards', () => {
      const rewards = useGuestStore.getState().demoRewards;
      expect(rewards).toHaveLength(3);
      expect(rewards.map((r) => r.title)).toEqual([
        'Extra Screen Time',
        'Ice Cream Treat',
        'Stay Up Late',
      ]);
    });

    it('starts with no completed chores', () => {
      expect(useGuestStore.getState().completedChoreIds).toEqual([]);
    });

    it('starts with sign-up prompt not dismissed', () => {
      expect(useGuestStore.getState().signUpPromptDismissed).toBe(false);
    });

    it('starts with signUpPromptShownAt as null', () => {
      expect(useGuestStore.getState().signUpPromptShownAt).toBeNull();
    });
  });

  describe('enterGuestMode', () => {
    it('sets isGuestMode to true', () => {
      useGuestStore.getState().enterGuestMode();
      expect(useGuestStore.getState().isGuestMode).toBe(true);
    });
  });

  describe('exitGuestMode', () => {
    it('sets isGuestMode to false', () => {
      useGuestStore.getState().enterGuestMode();
      useGuestStore.getState().exitGuestMode();
      expect(useGuestStore.getState().isGuestMode).toBe(false);
    });
  });

  describe('markDemoSeen', () => {
    it('sets hasSeenDemo to true', () => {
      useGuestStore.getState().markDemoSeen();
      expect(useGuestStore.getState().hasSeenDemo).toBe(true);
    });
  });

  describe('completeChore', () => {
    it('adds a chore ID to completedChoreIds', () => {
      useGuestStore.getState().completeChore('chore-1');
      expect(useGuestStore.getState().completedChoreIds).toEqual(['chore-1']);
    });

    it('adds multiple chore IDs', () => {
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-2');
      expect(useGuestStore.getState().completedChoreIds).toEqual(['chore-1', 'chore-2']);
    });

    it('does not add duplicate chore IDs', () => {
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-1');
      expect(useGuestStore.getState().completedChoreIds).toEqual(['chore-1']);
    });

    it('preserves insertion order', () => {
      useGuestStore.getState().completeChore('chore-3');
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-2');
      expect(useGuestStore.getState().completedChoreIds).toEqual(['chore-3', 'chore-1', 'chore-2']);
    });
  });

  describe('dismissSignUpPrompt', () => {
    it('sets signUpPromptDismissed to true', () => {
      useGuestStore.getState().dismissSignUpPrompt();
      expect(useGuestStore.getState().signUpPromptDismissed).toBe(true);
    });

    it('records the timestamp when dismissed', () => {
      const before = Date.now();
      useGuestStore.getState().dismissSignUpPrompt();
      const after = Date.now();

      const shownAt = useGuestStore.getState().signUpPromptShownAt;
      expect(shownAt).not.toBeNull();
      expect(shownAt).toBeGreaterThanOrEqual(before);
      expect(shownAt).toBeLessThanOrEqual(after);
    });
  });

  describe('shouldShowSignUpPrompt', () => {
    it('returns false when not in guest mode', () => {
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-2');

      expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(false);
    });

    it('returns false in guest mode with fewer than 2 completed chores', () => {
      useGuestStore.getState().enterGuestMode();
      useGuestStore.getState().completeChore('chore-1');

      expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(false);
    });

    it('returns false in guest mode with zero completed chores', () => {
      useGuestStore.getState().enterGuestMode();
      expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(false);
    });

    it('returns true in guest mode after completing 2 chores', () => {
      useGuestStore.getState().enterGuestMode();
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-2');

      expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(true);
    });

    it('returns true in guest mode after completing more than 2 chores', () => {
      useGuestStore.getState().enterGuestMode();
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-2');
      useGuestStore.getState().completeChore('chore-3');

      expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(true);
    });

    it('returns false when dismissed less than 5 minutes ago', () => {
      vi.useFakeTimers();
      try {
        useGuestStore.getState().enterGuestMode();
        useGuestStore.getState().completeChore('chore-1');
        useGuestStore.getState().completeChore('chore-2');
        useGuestStore.getState().dismissSignUpPrompt();

        // Advance 3 minutes (less than the 5-minute cooldown)
        vi.advanceTimersByTime(3 * 60 * 1000);

        expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('returns true when dismissed more than 5 minutes ago', () => {
      vi.useFakeTimers();
      try {
        useGuestStore.getState().enterGuestMode();
        useGuestStore.getState().completeChore('chore-1');
        useGuestStore.getState().completeChore('chore-2');
        useGuestStore.getState().dismissSignUpPrompt();

        // Advance 6 minutes (past the 5-minute cooldown)
        vi.advanceTimersByTime(6 * 60 * 1000);

        expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('returns true when dismissed exactly 5 minutes ago', () => {
      vi.useFakeTimers();
      try {
        useGuestStore.getState().enterGuestMode();
        useGuestStore.getState().completeChore('chore-1');
        useGuestStore.getState().completeChore('chore-2');
        useGuestStore.getState().dismissSignUpPrompt();

        // Advance exactly 5 minutes
        vi.advanceTimersByTime(5 * 60 * 1000);

        expect(useGuestStore.getState().shouldShowSignUpPrompt()).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useGuestStore.getState().enterGuestMode();
      useGuestStore.getState().markDemoSeen();
      useGuestStore.getState().completeChore('chore-1');
      useGuestStore.getState().completeChore('chore-2');
      useGuestStore.getState().dismissSignUpPrompt();

      useGuestStore.getState().reset();

      const state = useGuestStore.getState();
      expect(state.isGuestMode).toBe(false);
      expect(state.hasSeenDemo).toBe(false);
      expect(state.completedChoreIds).toEqual([]);
      expect(state.signUpPromptDismissed).toBe(false);
      expect(state.signUpPromptShownAt).toBeNull();
    });

    it('preserves demo data after reset', () => {
      useGuestStore.getState().enterGuestMode();
      useGuestStore.getState().reset();

      const state = useGuestStore.getState();
      expect(state.demoHousehold.id).toBe('demo-household');
      expect(state.demoMembers).toHaveLength(3);
      expect(state.demoChores).toHaveLength(4);
      expect(state.demoRewards).toHaveLength(3);
    });
  });

  describe('demo data integrity', () => {
    it('all demo members belong to the demo household', () => {
      const { demoHousehold, demoMembers } = useGuestStore.getState();
      for (const member of demoMembers) {
        expect(member.householdId).toBe(demoHousehold.id);
      }
    });

    it('all demo chores belong to the demo household', () => {
      const { demoHousehold, demoChores } = useGuestStore.getState();
      for (const chore of demoChores) {
        expect(chore.householdId).toBe(demoHousehold.id);
      }
    });

    it('all demo rewards belong to the demo household', () => {
      const { demoHousehold, demoRewards } = useGuestStore.getState();
      for (const reward of demoRewards) {
        expect(reward.householdId).toBe(demoHousehold.id);
      }
    });

    it('demo chores are assigned to valid demo member IDs', () => {
      const { demoMembers, demoChores } = useGuestStore.getState();
      const memberIds = new Set(demoMembers.map((m) => m.id));

      for (const chore of demoChores) {
        for (const assigneeId of chore.assignedTo) {
          expect(memberIds.has(assigneeId)).toBe(true);
        }
      }
    });

    it('demo chores are created by a valid demo member', () => {
      const { demoMembers, demoChores } = useGuestStore.getState();
      const memberIds = new Set(demoMembers.map((m) => m.id));

      for (const chore of demoChores) {
        expect(memberIds.has(chore.createdBy)).toBe(true);
      }
    });

    it('demo rewards are created by a valid demo member', () => {
      const { demoMembers, demoRewards } = useGuestStore.getState();
      const memberIds = new Set(demoMembers.map((m) => m.id));

      for (const reward of demoRewards) {
        expect(memberIds.has(reward.createdBy)).toBe(true);
      }
    });

    it('has exactly one parent member', () => {
      const parents = useGuestStore.getState().demoMembers.filter((m) => m.role === 'parent');
      expect(parents).toHaveLength(1);
    });

    it('child members require approval', () => {
      const children = useGuestStore.getState().demoMembers.filter((m) => m.role === 'child');
      for (const child of children) {
        expect(child.requiresApproval).toBe(true);
      }
    });
  });
});

describe('getDemoTodayChores', () => {
  it('returns an array of TodayChore objects', () => {
    const todayChores = getDemoTodayChores();
    expect(Array.isArray(todayChores)).toBe(true);
  });

  it('each chore has a schedule ID with the correct format', () => {
    const todayChores = getDemoTodayChores();
    const today = new Date().toISOString().split('T')[0];

    for (const tc of todayChores) {
      expect(tc.id).toMatch(new RegExp(`^schedule-chore-\\d+-${today}$`));
    }
  });

  it('each chore has today as the scheduledDate', () => {
    const todayChores = getDemoTodayChores();
    const today = new Date().toISOString().split('T')[0];

    for (const tc of todayChores) {
      expect(tc.scheduledDate).toBe(today);
    }
  });

  it('each chore starts as not completed', () => {
    const todayChores = getDemoTodayChores();
    for (const tc of todayChores) {
      expect(tc.isCompleted).toBe(false);
      expect(tc.completionId).toBeNull();
      expect(tc.completion).toBeNull();
    }
  });

  it('each chore has a reference to the full chore object', () => {
    const todayChores = getDemoTodayChores();
    for (const tc of todayChores) {
      expect(tc.chore).toBeDefined();
      expect(tc.chore.id).toBe(tc.choreId);
    }
  });

  it('assigns each chore to the first member in its assignedTo list', () => {
    const todayChores = getDemoTodayChores();
    for (const tc of todayChores) {
      expect(tc.assignedTo).toBe(tc.chore.assignedTo[0]);
    }
  });

  it('only includes chores scheduled for today based on recurrenceDays', () => {
    const todayChores = getDemoTodayChores();
    const dayOfWeek = new Date().getDay();

    for (const tc of todayChores) {
      if (tc.chore.recurrenceDays) {
        expect(tc.chore.recurrenceDays).toContain(dayOfWeek);
      }
    }
  });

  it('includes daily chores regardless of day', () => {
    const todayChores = getDemoTodayChores();
    // chore-1 (Make Bed), chore-3 (Set Table), chore-4 (Feed Pets) are daily (all 7 days)
    const dailyChoreIds = todayChores
      .filter((tc) => tc.chore.recurrenceDays?.length === 7)
      .map((tc) => tc.choreId);

    expect(dailyChoreIds).toContain('chore-1');
    expect(dailyChoreIds).toContain('chore-3');
    expect(dailyChoreIds).toContain('chore-4');
  });

  it('includes Clean Room only on Saturday (day 6)', () => {
    const todayChores = getDemoTodayChores();
    const dayOfWeek = new Date().getDay();
    const cleanRoom = todayChores.find((tc) => tc.choreId === 'chore-2');

    if (dayOfWeek === 6) {
      expect(cleanRoom).toBeDefined();
    } else {
      expect(cleanRoom).toBeUndefined();
    }
  });

  it('sets householdId on each chore to the demo household', () => {
    const todayChores = getDemoTodayChores();
    for (const tc of todayChores) {
      expect(tc.householdId).toBe('demo-household');
    }
  });
});
