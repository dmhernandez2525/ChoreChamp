import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, cn } from '@chorechamp/ui';
import { useBulkUpdateChores } from '@chorechamp/api-client';
import { useSelectionStore } from '@/stores/selection-store';
import { useUndoStore } from '@/stores/undo-store';
import type { Member } from '@chorechamp/types';

interface BulkAssignDialogProps {
  householdId: string;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkAssignDialog({ householdId, members, open, onOpenChange }: BulkAssignDialogProps) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const { selectedIds, deselectAll } = useSelectionStore();
  const { pushAction } = useUndoStore();
  const bulkUpdate = useBulkUpdateChores(householdId);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAssign = () => {
    if (selectedMemberIds.length === 0) return;

    const choreIds = Array.from(selectedIds);
    bulkUpdate.mutate(
      { choreIds, changes: { assignedTo: selectedMemberIds } },
      {
        onSuccess: () => {
          pushAction({
            type: 'bulk_assign',
            description: `Assigned ${choreIds.length} chore${choreIds.length !== 1 ? 's' : ''} to ${selectedMemberIds.length} member${selectedMemberIds.length !== 1 ? 's' : ''}`,
            undoFn: async () => {
              await bulkUpdate.mutateAsync({ choreIds, changes: { assignedTo: [] } });
            },
            redoFn: async () => {
              await bulkUpdate.mutateAsync({ choreIds, changes: { assignedTo: selectedMemberIds } });
            },
          });
          setSelectedMemberIds([]);
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
          data-testid="bulk-assign-dialog"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Assign to Members
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Assign {selectedIds.size} selected chore{selectedIds.size !== 1 ? 's' : ''} to:
          </p>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {members.map(member => {
              const isSelected = selectedMemberIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                  )}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0]}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900">{member.name}</span>
                  {isSelected && (
                    <span className="text-blue-600 text-sm font-medium">Selected</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={selectedMemberIds.length === 0 || bulkUpdate.isPending}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              {bulkUpdate.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
