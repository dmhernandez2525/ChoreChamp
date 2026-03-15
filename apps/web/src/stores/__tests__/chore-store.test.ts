import { describe, it, expect, beforeEach } from 'vitest';
import { useChoreStore } from '../chore-store';

const defaultFilters = {
  status: 'all' as const,
  assignee: 'all' as const,
  category: 'all' as const,
  sortBy: 'dueTime' as const,
  sortOrder: 'asc' as const,
};

describe('useChoreStore', () => {
  beforeEach(() => {
    useChoreStore.setState({
      selectedHouseholdId: null,
      selectedMemberId: null,
      filters: { ...defaultFilters },
      selectedChoreId: null,
      isDetailModalOpen: false,
    });
  });

  describe('selectedHouseholdId', () => {
    it('defaults to null', () => {
      expect(useChoreStore.getState().selectedHouseholdId).toBeNull();
    });

    it('sets a household ID', () => {
      useChoreStore.getState().setSelectedHousehold('household-1');
      expect(useChoreStore.getState().selectedHouseholdId).toBe('household-1');
    });

    it('clears the household ID when set to null', () => {
      useChoreStore.getState().setSelectedHousehold('household-1');
      useChoreStore.getState().setSelectedHousehold(null);
      expect(useChoreStore.getState().selectedHouseholdId).toBeNull();
    });

    it('replaces the previous household ID', () => {
      useChoreStore.getState().setSelectedHousehold('household-1');
      useChoreStore.getState().setSelectedHousehold('household-2');
      expect(useChoreStore.getState().selectedHouseholdId).toBe('household-2');
    });
  });

  describe('selectedMemberId', () => {
    it('defaults to null', () => {
      expect(useChoreStore.getState().selectedMemberId).toBeNull();
    });

    it('sets a member ID', () => {
      useChoreStore.getState().setSelectedMember('member-1');
      expect(useChoreStore.getState().selectedMemberId).toBe('member-1');
    });

    it('clears the member ID when set to null', () => {
      useChoreStore.getState().setSelectedMember('member-1');
      useChoreStore.getState().setSelectedMember(null);
      expect(useChoreStore.getState().selectedMemberId).toBeNull();
    });

    it('replaces the previous member ID', () => {
      useChoreStore.getState().setSelectedMember('member-1');
      useChoreStore.getState().setSelectedMember('member-2');
      expect(useChoreStore.getState().selectedMemberId).toBe('member-2');
    });
  });

  describe('filters', () => {
    it('starts with default filters', () => {
      expect(useChoreStore.getState().filters).toEqual(defaultFilters);
    });

    it('updates a single filter field', () => {
      useChoreStore.getState().setFilters({ status: 'completed' });

      const filters = useChoreStore.getState().filters;
      expect(filters.status).toBe('completed');
      expect(filters.assignee).toBe('all');
      expect(filters.category).toBe('all');
      expect(filters.sortBy).toBe('dueTime');
      expect(filters.sortOrder).toBe('asc');
    });

    it('updates multiple filter fields at once', () => {
      useChoreStore.getState().setFilters({
        status: 'pending',
        assignee: 'member-1',
        sortBy: 'points',
      });

      const filters = useChoreStore.getState().filters;
      expect(filters.status).toBe('pending');
      expect(filters.assignee).toBe('member-1');
      expect(filters.sortBy).toBe('points');
      expect(filters.category).toBe('all');
      expect(filters.sortOrder).toBe('asc');
    });

    it('merges partial updates without losing existing values', () => {
      useChoreStore.getState().setFilters({ status: 'completed' });
      useChoreStore.getState().setFilters({ category: 'kitchen' });

      const filters = useChoreStore.getState().filters;
      expect(filters.status).toBe('completed');
      expect(filters.category).toBe('kitchen');
    });

    it('sets sort order to descending', () => {
      useChoreStore.getState().setFilters({ sortOrder: 'desc' });
      expect(useChoreStore.getState().filters.sortOrder).toBe('desc');
    });

    it('sets assignee to a specific member', () => {
      useChoreStore.getState().setFilters({ assignee: 'member-42' });
      expect(useChoreStore.getState().filters.assignee).toBe('member-42');
    });

    it('sets status to needs-approval', () => {
      useChoreStore.getState().setFilters({ status: 'needs-approval' });
      expect(useChoreStore.getState().filters.status).toBe('needs-approval');
    });

    it('sets sortBy to each valid option', () => {
      const sortOptions = ['dueTime', 'points', 'difficulty', 'name'] as const;
      for (const sortBy of sortOptions) {
        useChoreStore.getState().setFilters({ sortBy });
        expect(useChoreStore.getState().filters.sortBy).toBe(sortBy);
      }
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to defaults', () => {
      useChoreStore.getState().setFilters({
        status: 'completed',
        assignee: 'member-1',
        category: 'kitchen',
        sortBy: 'points',
        sortOrder: 'desc',
      });

      useChoreStore.getState().resetFilters();

      expect(useChoreStore.getState().filters).toEqual(defaultFilters);
    });

    it('does not affect other state when resetting filters', () => {
      useChoreStore.getState().setSelectedHousehold('household-1');
      useChoreStore.getState().setSelectedMember('member-1');
      useChoreStore.getState().setFilters({ status: 'completed' });

      useChoreStore.getState().resetFilters();

      expect(useChoreStore.getState().selectedHouseholdId).toBe('household-1');
      expect(useChoreStore.getState().selectedMemberId).toBe('member-1');
      expect(useChoreStore.getState().filters).toEqual(defaultFilters);
    });
  });

  describe('chore detail modal', () => {
    it('defaults to closed with no selected chore', () => {
      const state = useChoreStore.getState();
      expect(state.selectedChoreId).toBeNull();
      expect(state.isDetailModalOpen).toBe(false);
    });

    it('opens the detail modal with a chore ID', () => {
      useChoreStore.getState().openChoreDetail('chore-1');

      const state = useChoreStore.getState();
      expect(state.selectedChoreId).toBe('chore-1');
      expect(state.isDetailModalOpen).toBe(true);
    });

    it('closes the detail modal and clears the chore ID', () => {
      useChoreStore.getState().openChoreDetail('chore-1');
      useChoreStore.getState().closeChoreDetail();

      const state = useChoreStore.getState();
      expect(state.selectedChoreId).toBeNull();
      expect(state.isDetailModalOpen).toBe(false);
    });

    it('switches to a different chore while modal is open', () => {
      useChoreStore.getState().openChoreDetail('chore-1');
      useChoreStore.getState().openChoreDetail('chore-2');

      const state = useChoreStore.getState();
      expect(state.selectedChoreId).toBe('chore-2');
      expect(state.isDetailModalOpen).toBe(true);
    });

    it('does not affect filters when opening/closing the modal', () => {
      useChoreStore.getState().setFilters({ status: 'pending' });

      useChoreStore.getState().openChoreDetail('chore-1');
      useChoreStore.getState().closeChoreDetail();

      expect(useChoreStore.getState().filters.status).toBe('pending');
    });
  });

  describe('state independence', () => {
    it('setting household does not affect member or filters', () => {
      useChoreStore.getState().setSelectedMember('member-1');
      useChoreStore.getState().setFilters({ status: 'completed' });
      useChoreStore.getState().setSelectedHousehold('household-1');

      const state = useChoreStore.getState();
      expect(state.selectedMemberId).toBe('member-1');
      expect(state.filters.status).toBe('completed');
    });

    it('setting member does not affect household or filters', () => {
      useChoreStore.getState().setSelectedHousehold('household-1');
      useChoreStore.getState().setFilters({ category: 'kitchen' });
      useChoreStore.getState().setSelectedMember('member-1');

      const state = useChoreStore.getState();
      expect(state.selectedHouseholdId).toBe('household-1');
      expect(state.filters.category).toBe('kitchen');
    });
  });
});
