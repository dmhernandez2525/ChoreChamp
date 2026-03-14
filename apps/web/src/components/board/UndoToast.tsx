import { useEffect, useCallback } from 'react';
import { Undo2, X } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import { useUndoStore } from '@/stores/undo-store';

export function UndoToast() {
  const { activeToast, undo, dismissToast } = useUndoStore();

  const handleUndo = useCallback(async () => {
    await undo();
  }, [undo]);

  // Keyboard shortcut: Cmd+Z / Ctrl+Z to undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useUndoStore.getState().redo();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleUndo]);

  if (!activeToast) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3',
        'rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-white shadow-xl',
        'animate-in slide-in-from-bottom-4 fade-in duration-200'
      )}
      role="status"
      aria-live="polite"
      data-testid="undo-toast"
    >
      <span className="text-sm">{activeToast.description}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        className="text-white hover:bg-white/20 hover:text-white"
      >
        <Undo2 className="mr-1 h-3.5 w-3.5" />
        Undo
      </Button>
      <button
        onClick={dismissToast}
        className="rounded p-1 text-gray-400 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
