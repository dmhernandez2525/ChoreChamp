import { useState } from 'react';
import { Save, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@chorechamp/ui';
import { useCreateSavedFilter } from '@chorechamp/api-client';
import { useFilterStore } from '@/stores/filter-store';
import type { FilterVisibility } from '@chorechamp/types';

interface SaveFilterDialogProps {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveFilterDialog({ householdId, open, onOpenChange }: SaveFilterDialogProps) {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<FilterVisibility>('private');
  const { activeFilters } = useFilterStore();
  const createFilter = useCreateSavedFilter(householdId);

  const handleSave = () => {
    if (!name.trim() || activeFilters.length === 0) return;

    createFilter.mutate(
      { name: name.trim(), filters: activeFilters, visibility },
      {
        onSuccess: () => {
          setName('');
          setVisibility('private');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
          data-testid="save-filter-dialog"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Save Filter View
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="filter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g., "My Overdue Chores"'
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisibility('private')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    visibility === 'private'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Just Me
                </button>
                <button
                  onClick={() => setVisibility('household')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    visibility === 'household'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Whole Household
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Saving {activeFilters.length} active filter{activeFilters.length !== 1 ? 's' : ''} as a named view.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || activeFilters.length === 0 || createFilter.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createFilter.isPending ? 'Saving...' : 'Save View'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
