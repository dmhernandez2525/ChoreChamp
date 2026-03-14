import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? '⌘' : 'Ctrl';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{ keys: string; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: `${mod}+K`, description: 'Open command palette' },
      { keys: '?', description: 'Show keyboard shortcuts' },
      { keys: 'Escape', description: 'Close dialog/panel' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: `${mod}+Z`, description: 'Undo last action' },
      { keys: `${mod}+Shift+Z`, description: 'Redo last action' },
      { keys: `${mod}+Enter`, description: 'Submit comment' },
    ],
  },
  {
    title: 'Board Navigation',
    shortcuts: [
      { keys: 'Tab', description: 'Move to next element' },
      { keys: 'Shift+Tab', description: 'Move to previous element' },
      { keys: 'Enter', description: 'Open selected card' },
      { keys: 'Space', description: 'Toggle selection' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: 'Click', description: 'Select single item' },
      { keys: 'Shift+Click', description: 'Select range' },
      { keys: `${mod}+Click`, description: 'Toggle item in selection' },
      { keys: `${mod}+A`, description: 'Select all (when in bulk mode)' },
    ],
  },
  {
    title: 'List View',
    shortcuts: [
      { keys: 'Click cell', description: 'Enter inline edit mode' },
      { keys: 'Enter', description: 'Save inline edit' },
      { keys: 'Escape', description: 'Cancel inline edit' },
      { keys: 'Tab', description: 'Save and move to next cell' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // "?" key opens the shortcuts help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-md max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
          data-testid="keyboard-shortcuts-help"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-gray-500" />
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {SHORTCUT_GROUPS.map(group => (
              <div key={group.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">{group.title}</h3>
                <div className="space-y-1">
                  {group.shortcuts.map(shortcut => (
                    <div key={shortcut.description} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-3 text-center">
            <p className="text-xs text-gray-400">
              Press <kbd className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-mono">?</kbd> to toggle this dialog
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
