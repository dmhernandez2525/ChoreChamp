import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@chorechamp/ui';
import { useBulkUpdateChores } from '@chorechamp/api-client';
import { useSelectionStore } from '@/stores/selection-store';
import { useUndoStore } from '@/stores/undo-store';

interface BulkRescheduleDialogProps {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkRescheduleDialog({ householdId, open, onOpenChange }: BulkRescheduleDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const { selectedIds, deselectAll } = useSelectionStore();
  const { pushAction } = useUndoStore();
  const bulkUpdate = useBulkUpdateChores(householdId);

  const handleReschedule = () => {
    if (!date) return;

    const choreIds = Array.from(selectedIds);
    const updates: Record<string, string> = { startDate: date };
    if (time) {
      updates.dueTime = time;
    }

    bulkUpdate.mutate(
      { choreIds, updates },
      {
        onSuccess: () => {
          pushAction({
            type: 'bulk_reschedule',
            description: `Rescheduled ${choreIds.length} chore${choreIds.length !== 1 ? 's' : ''} to ${new Date(date).toLocaleDateString()}`,
            undoFn: async () => {
              // Undo sets date back to empty (clearing the reschedule)
              await bulkUpdate.mutateAsync({ choreIds, updates: { startDate: '' } });
            },
            redoFn: async () => {
              await bulkUpdate.mutateAsync({ choreIds, updates });
            },
          });
          setDate('');
          setTime('');
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
          data-testid="bulk-reschedule-dialog"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Reschedule Chores
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Move {selectedIds.size} selected chore{selectedIds.size !== 1 ? 's' : ''} to a new date.
          </p>

          <div className="space-y-3">
            <div>
              <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700 mb-1">
                New Date
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="reschedule-time" className="block text-sm font-medium text-gray-700 mb-1">
                New Due Time <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="reschedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              onClick={handleReschedule}
              disabled={!date || bulkUpdate.isPending}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {bulkUpdate.isPending ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
