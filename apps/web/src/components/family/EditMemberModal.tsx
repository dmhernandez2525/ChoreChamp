import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, cn } from '@chorechamp/ui';
import type { Member } from '@chorechamp/types';

interface EditMemberModalProps {
  member: Member | null;
  onClose: () => void;
  onSubmit: (
    memberId: string,
    data: { name: string; color: string; birthYear?: number }
  ) => Promise<void>;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export function EditMemberModal({ member, onClose, onSubmit }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: COLORS[0],
    birthYear: undefined as number | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        color: member.color,
        birthYear: member.birthYear || undefined,
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(member.id, {
        name: formData.name.trim(),
        color: formData.color,
        birthYear: formData.birthYear,
      });
      onClose();
    } catch (err) {
      setError('Failed to update member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Dialog.Root open={!!member} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-gray-900">
            Edit Member
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-gray-500">
            Update {member?.name}'s profile information.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
                style={{ backgroundColor: formData.color }}
              >
                {formData.name.charAt(0).toUpperCase() || '?'}
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform',
                      formData.color === color &&
                        'ring-2 ring-offset-2 ring-gray-900 scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Birth Year */}
            <div>
              <label
                htmlFor="edit-birthYear"
                className="block text-sm font-medium text-gray-700"
              >
                Birth Year
              </label>
              <select
                id="edit-birthYear"
                value={formData.birthYear || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    birthYear: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats (read-only) */}
            {member && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Current Streak:</span>
                    <span className="ml-2 font-medium">{member.streakCurrent} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Longest Streak:</span>
                    <span className="ml-2 font-medium">{member.streakLongest} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Points:</span>
                    <span className="ml-2 font-medium">{member.pointsCurrent}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Lifetime Points:</span>
                    <span className="ml-2 font-medium">{member.pointsLifetime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
