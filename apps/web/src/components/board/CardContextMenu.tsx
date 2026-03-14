import { useState, useEffect, useCallback } from 'react';
import {
  Edit, UserPlus, Flag, Copy, Trash2, CheckCircle, ArrowRight,
} from 'lucide-react';
import { cn } from '@chorechamp/ui';
import type { ChorePriority } from '@chorechamp/types';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface CardContextMenuProps {
  choreId: string;
  choreTitle: string;
  position: ContextMenuPosition | null;
  onClose: () => void;
  onEdit?: (choreId: string) => void;
  onAssign?: (choreId: string) => void;
  onChangePriority?: (choreId: string, priority: ChorePriority) => void;
  onChangeStatus?: (choreId: string, status: string) => void;
  onDuplicate?: (choreId: string) => void;
  onDelete?: (choreId: string) => void;
  onComplete?: (choreId: string) => void;
}

const PRIORITIES: Array<{ value: ChorePriority; label: string; color: string }> = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'low', label: 'Low', color: 'text-gray-500' },
];

const STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function CardContextMenu({
  choreId,
  position,
  onClose,
  onEdit,
  onAssign,
  onChangePriority,
  onChangeStatus,
  onDuplicate,
  onDelete,
  onComplete,
}: CardContextMenuProps) {
  const [submenu, setSubmenu] = useState<'priority' | 'status' | null>(null);

  const handleClickOutside = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!position) return;
    document.addEventListener('click', handleClickOutside);
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', escHandler);
    };
  }, [position, handleClickOutside, onClose]);

  if (!position) return null;

  const menuItems = [
    { icon: Edit, label: 'Edit', action: () => onEdit?.(choreId), visible: !!onEdit },
    { icon: CheckCircle, label: 'Mark Complete', action: () => onComplete?.(choreId), visible: !!onComplete },
    { icon: UserPlus, label: 'Assign...', action: () => onAssign?.(choreId), visible: !!onAssign },
    { icon: Flag, label: 'Priority', action: () => setSubmenu('priority'), visible: !!onChangePriority, hasSubmenu: true },
    { icon: ArrowRight, label: 'Move to...', action: () => setSubmenu('status'), visible: !!onChangeStatus, hasSubmenu: true },
    { icon: Copy, label: 'Duplicate', action: () => onDuplicate?.(choreId), visible: !!onDuplicate },
    { divider: true },
    { icon: Trash2, label: 'Delete', action: () => onDelete?.(choreId), visible: !!onDelete, destructive: true },
  ];

  return (
    <div
      className="fixed z-[200]"
      style={{ left: position.x, top: position.y }}
      data-testid="card-context-menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
        {submenu === 'priority' ? (
          <>
            <button
              onClick={() => setSubmenu(null)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
            >
              Back
            </button>
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                onClick={() => { onChangePriority?.(choreId, p.value); onClose(); }}
                className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50', p.color)}
              >
                <Flag className="h-3.5 w-3.5" />
                {p.label}
              </button>
            ))}
          </>
        ) : submenu === 'status' ? (
          <>
            <button
              onClick={() => setSubmenu(null)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
            >
              Back
            </button>
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { onChangeStatus?.(choreId, s.value); onClose(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </>
        ) : (
          menuItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={i} className="my-1 border-t border-gray-100" />;
            }
            if (!item.visible) return null;
            const Icon = item.icon!;
            return (
              <button
                key={item.label}
                onClick={() => { item.action?.(); if (!item.hasSubmenu) onClose(); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50',
                  item.destructive ? 'text-red-600' : 'text-gray-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.hasSubmenu && <span className="ml-auto text-gray-400">&#9656;</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
