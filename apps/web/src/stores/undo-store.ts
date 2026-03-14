import { create } from 'zustand';

interface UndoAction {
  id: string;
  type: string;
  description: string;
  undoFn: () => Promise<void>;
  redoFn: () => Promise<void>;
  timestamp: number;
}

interface UndoStoreState {
  // Action stacks
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Toast state
  activeToast: UndoAction | null;
  toastTimeoutId: ReturnType<typeof setTimeout> | null;

  // Max stack size
  maxStackSize: number;

  // Actions
  pushAction: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clearStacks: () => void;
  dismissToast: () => void;
}

let actionCounter = 0;

export const useUndoStore = create<UndoStoreState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  activeToast: null,
  toastTimeoutId: null,
  maxStackSize: 50,

  pushAction: (action) => {
    const newAction: UndoAction = {
      ...action,
      id: `undo-${++actionCounter}`,
      timestamp: Date.now(),
    };

    set((state) => {
      // Clear any existing timeout
      if (state.toastTimeoutId) {
        clearTimeout(state.toastTimeoutId);
      }

      const undoStack = [newAction, ...state.undoStack].slice(0, state.maxStackSize);

      // Auto-dismiss toast after 5 seconds
      const timeoutId = setTimeout(() => {
        set({ activeToast: null, toastTimeoutId: null });
      }, 5000);

      return {
        undoStack,
        redoStack: [], // Clear redo stack on new action
        activeToast: newAction,
        toastTimeoutId: timeoutId,
      };
    });
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const [action, ...rest] = undoStack;
    await action.undoFn();

    set((state) => ({
      undoStack: rest,
      redoStack: [action, ...state.redoStack].slice(0, state.maxStackSize),
      activeToast: null,
    }));
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const [action, ...rest] = redoStack;
    await action.redoFn();

    set((state) => ({
      redoStack: rest,
      undoStack: [action, ...state.undoStack].slice(0, state.maxStackSize),
    }));
  },

  clearStacks: () => set({ undoStack: [], redoStack: [], activeToast: null }),

  dismissToast: () => {
    const { toastTimeoutId } = get();
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    set({ activeToast: null, toastTimeoutId: null });
  },
}));
