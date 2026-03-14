import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selection-store';

describe('useSelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({
      selectedIds: new Set(),
      isBulkMode: false,
      lastSelectedId: null,
    });
  });

  describe('initial state', () => {
    it('starts with no selections', () => {
      const state = useSelectionStore.getState();
      expect(state.selectedIds.size).toBe(0);
      expect(state.isBulkMode).toBe(false);
      expect(state.lastSelectedId).toBeNull();
    });
  });

  describe('select', () => {
    it('adds an item to the selection set', () => {
      useSelectionStore.getState().select('c1');
      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(true);
    });

    it('tracks the last selected ID', () => {
      useSelectionStore.getState().select('c1');
      useSelectionStore.getState().select('c2');
      expect(useSelectionStore.getState().lastSelectedId).toBe('c2');
    });

    it('does not duplicate if the same item is selected twice', () => {
      useSelectionStore.getState().select('c1');
      useSelectionStore.getState().select('c1');
      expect(useSelectionStore.getState().selectedIds.size).toBe(1);
    });
  });

  describe('deselect', () => {
    it('removes an item from the selection set', () => {
      useSelectionStore.getState().select('c1');
      useSelectionStore.getState().select('c2');
      useSelectionStore.getState().deselect('c1');

      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(false);
      expect(useSelectionStore.getState().selectedIds.has('c2')).toBe(true);
    });

    it('disables bulk mode when the last item is deselected', () => {
      useSelectionStore.setState({
        selectedIds: new Set(['c1']),
        isBulkMode: true,
      });

      useSelectionStore.getState().deselect('c1');

      expect(useSelectionStore.getState().isBulkMode).toBe(false);
      expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    });

    it('keeps bulk mode active when other items remain', () => {
      useSelectionStore.setState({
        selectedIds: new Set(['c1', 'c2']),
        isBulkMode: true,
      });

      useSelectionStore.getState().deselect('c1');

      expect(useSelectionStore.getState().isBulkMode).toBe(true);
      expect(useSelectionStore.getState().selectedIds.size).toBe(1);
    });
  });

  describe('toggle', () => {
    it('selects an unselected item', () => {
      useSelectionStore.getState().toggle('c1');

      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(true);
      expect(useSelectionStore.getState().isBulkMode).toBe(true);
    });

    it('deselects a selected item', () => {
      useSelectionStore.getState().select('c1');
      useSelectionStore.getState().toggle('c1');

      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(false);
    });

    it('disables bulk mode when toggling off the last item', () => {
      useSelectionStore.getState().toggle('c1');
      expect(useSelectionStore.getState().isBulkMode).toBe(true);

      useSelectionStore.getState().toggle('c1');
      expect(useSelectionStore.getState().isBulkMode).toBe(false);
    });

    it('tracks lastSelectedId on toggle', () => {
      useSelectionStore.getState().toggle('c1');
      expect(useSelectionStore.getState().lastSelectedId).toBe('c1');
    });
  });

  describe('selectAll', () => {
    it('selects all provided IDs', () => {
      useSelectionStore.getState().selectAll(['c1', 'c2', 'c3']);

      const state = useSelectionStore.getState();
      expect(state.selectedIds.size).toBe(3);
      expect(state.selectedIds.has('c1')).toBe(true);
      expect(state.selectedIds.has('c2')).toBe(true);
      expect(state.selectedIds.has('c3')).toBe(true);
    });

    it('enables bulk mode when items are provided', () => {
      useSelectionStore.getState().selectAll(['c1']);
      expect(useSelectionStore.getState().isBulkMode).toBe(true);
    });

    it('does not enable bulk mode with empty array', () => {
      useSelectionStore.getState().selectAll([]);
      expect(useSelectionStore.getState().isBulkMode).toBe(false);
    });

    it('replaces previous selections', () => {
      useSelectionStore.getState().select('c1');
      useSelectionStore.getState().selectAll(['c2', 'c3']);

      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(false);
      expect(useSelectionStore.getState().selectedIds.size).toBe(2);
    });
  });

  describe('deselectAll', () => {
    it('clears all selections', () => {
      useSelectionStore.getState().selectAll(['c1', 'c2', 'c3']);
      useSelectionStore.getState().deselectAll();

      const state = useSelectionStore.getState();
      expect(state.selectedIds.size).toBe(0);
      expect(state.isBulkMode).toBe(false);
      expect(state.lastSelectedId).toBeNull();
    });
  });

  describe('selectRange', () => {
    it('adds a range of IDs to existing selection', () => {
      useSelectionStore.getState().select('c1');
      useSelectionStore.getState().selectRange(['c2', 'c3', 'c4']);

      const state = useSelectionStore.getState();
      expect(state.selectedIds.size).toBe(4);
      expect(state.isBulkMode).toBe(true);
    });

    it('enables bulk mode', () => {
      useSelectionStore.getState().selectRange(['c1']);
      expect(useSelectionStore.getState().isBulkMode).toBe(true);
    });
  });

  describe('selectedCount', () => {
    it('returns the size of the selection set', () => {
      useSelectionStore.getState().selectAll(['c1', 'c2', 'c3']);
      expect(useSelectionStore.getState().selectedIds.size).toBe(3);
    });
  });

  describe('isSelected', () => {
    it('returns true for a selected item', () => {
      useSelectionStore.getState().select('c1');
      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(true);
    });

    it('returns false for an unselected item', () => {
      expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(false);
    });
  });

  describe('toggleBulkMode', () => {
    it('enables bulk mode', () => {
      useSelectionStore.getState().toggleBulkMode();
      expect(useSelectionStore.getState().isBulkMode).toBe(true);
    });

    it('clears selections when disabling bulk mode', () => {
      useSelectionStore.setState({
        selectedIds: new Set(['c1', 'c2']),
        isBulkMode: true,
      });

      useSelectionStore.getState().toggleBulkMode();

      expect(useSelectionStore.getState().isBulkMode).toBe(false);
      expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    });
  });

  describe('setBulkMode', () => {
    it('sets bulk mode to true', () => {
      useSelectionStore.getState().setBulkMode(true);
      expect(useSelectionStore.getState().isBulkMode).toBe(true);
    });

    it('sets bulk mode to false and clears selections', () => {
      useSelectionStore.setState({ selectedIds: new Set(['c1']), isBulkMode: true });
      useSelectionStore.getState().setBulkMode(false);

      expect(useSelectionStore.getState().isBulkMode).toBe(false);
      expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    });
  });
});
