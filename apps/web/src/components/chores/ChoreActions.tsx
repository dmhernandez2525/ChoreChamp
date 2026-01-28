import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type { Chore } from '@chorechamp/types';

interface ChoreActionsProps {
  chore: Chore;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  isArchiving?: boolean;
}

export function ChoreActions({
  chore,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  isDeleting,
  isArchiving,
}: ChoreActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* Three-dot menu button */}
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <span className="text-lg">⋮</span>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowMenu(false);
              setShowDeleteConfirm(false);
            }}
          />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => {
                onEdit();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>✏️</span>
              <span>Edit Chore</span>
            </button>

            <button
              onClick={() => {
                onDuplicate();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>📋</span>
              <span>Duplicate</span>
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              onClick={() => {
                onArchive();
                setShowMenu(false);
              }}
              disabled={isArchiving}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
            >
              <span>📦</span>
              <span>{isArchiving ? 'Archiving...' : chore.isActive ? 'Archive' : 'Restore'}</span>
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            ) : (
              <div className="px-4 py-2">
                <p className="mb-2 text-xs text-red-600">Delete this chore?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-xs"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Compact delete confirmation modal
interface DeleteChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  choreName: string;
  isDeleting?: boolean;
}

export function DeleteChoreModal({
  isOpen,
  onClose,
  onConfirm,
  choreName,
  isDeleting,
}: DeleteChoreModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900">Delete Chore</h3>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete "{choreName}"? This action cannot be undone.
          </p>

          <div className="mt-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">
              All completion history for this chore will also be deleted.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Chore'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
