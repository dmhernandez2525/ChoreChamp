import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type { Member } from '@chorechamp/types';

interface MemberListProps {
  members: Member[];
  currentUserId?: string;
  isParent?: boolean;
  onEditMember?: (member: Member) => void;
  onRemoveMember?: (memberId: string) => void;
}

const roleLabels: Record<string, { label: string; icon: string }> = {
  parent: { label: 'Parent', icon: '👨‍👩‍👧‍👦' },
  child: { label: 'Child', icon: '👧' },
  teen: { label: 'Teen', icon: '🧑' },
  viewer: { label: 'Viewer', icon: '👁️' },
};

export function MemberList({
  members,
  currentUserId,
  isParent,
  onEditMember,
  onRemoveMember,
}: MemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const sortedMembers = [...members].sort((a, b) => {
    // Parents first, then by name
    if (a.role === 'parent' && b.role !== 'parent') return -1;
    if (a.role !== 'parent' && b.role === 'parent') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleRemove = async (memberId: string) => {
    if (!onRemoveMember) return;
    setRemovingId(memberId);
    try {
      await onRemoveMember(memberId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {sortedMembers.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const roleInfo = roleLabels[member.role] || roleLabels.child;
        const canRemove =
          isParent &&
          !isCurrentUser &&
          member.role !== 'parent' &&
          onRemoveMember;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{member.name}</span>
                  {isCurrentUser && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{roleInfo.icon}</span>
                  <span>{roleInfo.label}</span>
                  {member.userId === null && (
                    <span className="text-xs text-gray-400">(No account)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="text-orange-500">🔥</span>
                  <span className="font-medium">{member.streakCurrent || 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-blue-500">⭐</span>
                  <span className="font-medium">
                    {member.pointsCurrent?.toLocaleString() || 0}
                  </span>
                </span>
              </div>

              {/* Actions */}
              {isParent && (
                <div className="flex gap-2">
                  {onEditMember && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMember(member)}
                    >
                      Edit
                    </Button>
                  )}
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingId === member.id ? 'Removing...' : 'Remove'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact version for dashboard sidebar
export function MemberListCompact({ members }: { members: Member[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-2 rounded-full px-3 py-1"
          style={{ backgroundColor: `${member.color}20` }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: member.color }}
          />
          <span className="text-sm font-medium">{member.name}</span>
        </div>
      ))}
    </div>
  );
}
