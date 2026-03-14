import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUndoStore } from '../undo-store';

function createAction(overrides: Partial<{ type: string; description: string }> = {}) {
  return {
    type: overrides.type ?? 'move',
    description: overrides.description ?? 'Moved chore',
    undoFn: vi.fn().mockResolvedValue(undefined),
    redoFn: vi.fn().mockResolvedValue(undefined),
  };
}

describe('useUndoStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUndoStore.setState({
      undoStack: [],
      redoStack: [],
      activeToast: null,
      toastTimeoutId: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with empty undo and redo stacks', () => {
      const state = useUndoStore.getState();
      expect(state.undoStack).toHaveLength(0);
      expect(state.redoStack).toHaveLength(0);
      expect(state.activeToast).toBeNull();
    });
  });

  describe('pushAction', () => {
    it('adds an action to the undo stack', () => {
      useUndoStore.getState().pushAction(createAction());

      expect(useUndoStore.getState().undoStack).toHaveLength(1);
    });

    it('assigns a unique ID and timestamp', () => {
      useUndoStore.getState().pushAction(createAction());

      const action = useUndoStore.getState().undoStack[0];
      expect(action.id).toMatch(/^undo-/);
      expect(action.timestamp).toBeGreaterThan(0);
    });

    it('places new actions at the front of the stack', () => {
      useUndoStore.getState().pushAction(createAction({ description: 'first' }));
      useUndoStore.getState().pushAction(createAction({ description: 'second' }));

      expect(useUndoStore.getState().undoStack[0].description).toBe('second');
      expect(useUndoStore.getState().undoStack[1].description).toBe('first');
    });

    it('clears the redo stack on new action', () => {
      useUndoStore.setState({
        redoStack: [{
          id: 'old',
          type: 'test',
          description: 'old action',
          undoFn: async () => {},
          redoFn: async () => {},
          timestamp: Date.now(),
        }],
      });

      useUndoStore.getState().pushAction(createAction());

      expect(useUndoStore.getState().redoStack).toHaveLength(0);
    });

    it('sets the active toast to the new action', () => {
      useUndoStore.getState().pushAction(createAction({ description: 'Moved to Done' }));

      const toast = useUndoStore.getState().activeToast;
      expect(toast).not.toBeNull();
      expect(toast?.description).toBe('Moved to Done');
    });

    it('auto-dismisses the toast after 5 seconds', () => {
      useUndoStore.getState().pushAction(createAction());

      expect(useUndoStore.getState().activeToast).not.toBeNull();

      vi.advanceTimersByTime(5000);

      expect(useUndoStore.getState().activeToast).toBeNull();
    });

    it('resets the toast timer when a new action is pushed', () => {
      useUndoStore.getState().pushAction(createAction({ description: 'first' }));
      vi.advanceTimersByTime(3000);

      useUndoStore.getState().pushAction(createAction({ description: 'second' }));
      vi.advanceTimersByTime(3000);

      // The first timer would have fired at 5s, but the second resets it
      expect(useUndoStore.getState().activeToast).not.toBeNull();
      expect(useUndoStore.getState().activeToast?.description).toBe('second');

      vi.advanceTimersByTime(2000);
      expect(useUndoStore.getState().activeToast).toBeNull();
    });
  });

  describe('stack limits', () => {
    it('caps the undo stack at maxStackSize (50)', () => {
      for (let i = 0; i < 60; i++) {
        useUndoStore.getState().pushAction(createAction({ description: `action ${i}` }));
      }

      expect(useUndoStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    });

    it('keeps the most recent actions when the stack overflows', () => {
      for (let i = 0; i < 55; i++) {
        useUndoStore.getState().pushAction(createAction({ description: `action ${i}` }));
      }

      // The most recent action should be at index 0
      expect(useUndoStore.getState().undoStack[0].description).toBe('action 54');
    });
  });

  describe('undo', () => {
    it('calls the undoFn of the most recent action', async () => {
      const action = createAction();
      useUndoStore.getState().pushAction(action);

      await useUndoStore.getState().undo();

      expect(action.undoFn).toHaveBeenCalledOnce();
    });

    it('moves the action from undo stack to redo stack', async () => {
      useUndoStore.getState().pushAction(createAction({ description: 'test' }));

      await useUndoStore.getState().undo();

      expect(useUndoStore.getState().undoStack).toHaveLength(0);
      expect(useUndoStore.getState().redoStack).toHaveLength(1);
      expect(useUndoStore.getState().redoStack[0].description).toBe('test');
    });

    it('clears the active toast after undo', async () => {
      useUndoStore.getState().pushAction(createAction());

      await useUndoStore.getState().undo();

      expect(useUndoStore.getState().activeToast).toBeNull();
    });

    it('does nothing when the undo stack is empty', async () => {
      await useUndoStore.getState().undo();

      expect(useUndoStore.getState().undoStack).toHaveLength(0);
      expect(useUndoStore.getState().redoStack).toHaveLength(0);
    });

    it('undoes actions in reverse order', async () => {
      const first = createAction({ description: 'first' });
      const second = createAction({ description: 'second' });
      useUndoStore.getState().pushAction(first);
      useUndoStore.getState().pushAction(second);

      await useUndoStore.getState().undo();
      expect(second.undoFn).toHaveBeenCalled();
      expect(first.undoFn).not.toHaveBeenCalled();

      await useUndoStore.getState().undo();
      expect(first.undoFn).toHaveBeenCalled();
    });
  });

  describe('redo', () => {
    it('calls the redoFn of the most recently undone action', async () => {
      const action = createAction();
      useUndoStore.getState().pushAction(action);

      await useUndoStore.getState().undo();
      await useUndoStore.getState().redo();

      expect(action.redoFn).toHaveBeenCalledOnce();
    });

    it('moves the action back to the undo stack', async () => {
      useUndoStore.getState().pushAction(createAction({ description: 'test' }));

      await useUndoStore.getState().undo();
      expect(useUndoStore.getState().undoStack).toHaveLength(0);

      await useUndoStore.getState().redo();
      expect(useUndoStore.getState().undoStack).toHaveLength(1);
      expect(useUndoStore.getState().redoStack).toHaveLength(0);
    });

    it('does nothing when the redo stack is empty', async () => {
      await useUndoStore.getState().redo();

      expect(useUndoStore.getState().undoStack).toHaveLength(0);
      expect(useUndoStore.getState().redoStack).toHaveLength(0);
    });
  });

  describe('canUndo / canRedo (derived)', () => {
    it('cannot undo with empty stack', () => {
      expect(useUndoStore.getState().undoStack.length > 0).toBe(false);
    });

    it('can undo after pushing an action', () => {
      useUndoStore.getState().pushAction(createAction());
      expect(useUndoStore.getState().undoStack.length > 0).toBe(true);
    });

    it('cannot redo with empty stack', () => {
      expect(useUndoStore.getState().redoStack.length > 0).toBe(false);
    });

    it('can redo after undoing', async () => {
      useUndoStore.getState().pushAction(createAction());
      await useUndoStore.getState().undo();

      expect(useUndoStore.getState().redoStack.length > 0).toBe(true);
    });
  });

  describe('clearStacks', () => {
    it('clears undo stack, redo stack, and toast', async () => {
      useUndoStore.getState().pushAction(createAction());
      await useUndoStore.getState().undo();
      useUndoStore.getState().pushAction(createAction());

      useUndoStore.getState().clearStacks();

      const state = useUndoStore.getState();
      expect(state.undoStack).toHaveLength(0);
      expect(state.redoStack).toHaveLength(0);
      expect(state.activeToast).toBeNull();
    });
  });

  describe('dismissToast', () => {
    it('clears the active toast', () => {
      useUndoStore.getState().pushAction(createAction());
      expect(useUndoStore.getState().activeToast).not.toBeNull();

      useUndoStore.getState().dismissToast();

      expect(useUndoStore.getState().activeToast).toBeNull();
      expect(useUndoStore.getState().toastTimeoutId).toBeNull();
    });

    it('clears the auto-dismiss timeout', () => {
      useUndoStore.getState().pushAction(createAction());
      useUndoStore.getState().dismissToast();

      // Advancing timers should not cause errors or state changes
      vi.advanceTimersByTime(10000);
      expect(useUndoStore.getState().activeToast).toBeNull();
    });
  });
});
