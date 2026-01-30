import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, cn } from '@chorechamp/ui';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    role: string;
    color: string;
    birthYear?: number;
  }) => Promise<void>;
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

const ROLES = [
  { value: 'child', label: 'Child', description: 'Kids under 13' },
  { value: 'teen', label: 'Teen', description: 'Teenagers 13-17' },
  { value: 'parent', label: 'Parent', description: 'Can manage household' },
];

export function AddMemberModal({ open, onClose, onSubmit }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'child',
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    birthYear: undefined as number | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        role: formData.role,
        color: formData.color,
        birthYear: formData.birthYear,
      });
      // Reset form
      setFormData({
        name: '',
        role: 'child',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        birthYear: undefined,
      });
      onClose();
    } catch {
      setError('Failed to add member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-gray-900">
            Add Family Member
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-gray-500">
            Add a child or teen to your household. They'll be able to see and
            complete assigned chores.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Emma"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="space-y-2">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{role.label}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
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

            {/* Birth Year (optional) */}
            <div>
              <label
                htmlFor="birthYear"
                className="block text-sm font-medium text-gray-700"
              >
                Birth Year (optional)
              </label>
              <select
                id="birthYear"
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
              <p className="mt-1 text-xs text-gray-500">
                Used for age-appropriate chore suggestions
              </p>
            </div>

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
                {isSubmitting ? 'Adding...' : 'Add Member'}
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
