import { Trash2, X, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@chorechamp/ui';
import { useBulkDeleteChores } from '@chorechamp/api-client';
import { useSelectionStore } from '@/stores/selection-store';

interface BulkDeleteConfirmationProps {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkDeleteConfirmation({ householdId, open, onOpenChange }: BulkDeleteConfirmationProps) {
  const { selectedIds, deselectAll } = useSelectionStore();
  const bulkDelete = useBulkDeleteChores(householdId);

  const handleDelete = () => {
    const choreIds = Array.from(selectedIds);
    bulkDelete.mutate(
      { choreIds },
      {
        onSuccess: () => {
          deselectAll();
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
          data-testid="bulk-delete-confirmation"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Delete {selectedIds.size} Chore{selectedIds.size !== 1 ? 's' : ''}?
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                This will permanently remove the selected chores from your household.
                This action cannot be undone.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={bulkDelete.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {bulkDelete.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
