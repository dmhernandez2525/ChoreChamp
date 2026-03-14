import { useState } from 'react';
import { cn } from '@chorechamp/ui';

interface PresenceMember {
  id: string;
  name: string;
  avatarUrl?: string;
  idle?: boolean;
  idleSince?: number | null;
}

interface PresenceAvatarsProps {
  members: PresenceMember[];
  maxVisible?: number;
  className?: string;
}

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-lime-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatIdleDuration(idleSince: number | null | undefined): string {
  if (!idleSince) return '';
  const seconds = Math.floor((Date.now() - idleSince) / 1000);
  if (seconds < 60) return 'less than a minute';
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

export function PresenceAvatars({
  members,
  maxVisible = 5,
  className,
}: PresenceAvatarsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (members.length === 0) return null;

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <div
      className={cn('flex items-center', className)}
      data-testid="presence-avatars"
      aria-label={`${members.length} member${members.length === 1 ? '' : 's'} viewing this board`}
    >
      {visible.map((member, index) => {
        const isIdle = member.idle ?? false;
        const initials = getInitials(member.name);
        const idleDuration = formatIdleDuration(member.idleSince);

        return (
          <div
            key={member.id}
            className="relative"
            style={{ marginLeft: index === 0 ? 0 : -8 }}
            onMouseEnter={() => setHoveredId(member.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Tooltip */}
            {hoveredId === member.id && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg z-50 pointer-events-none"
                role="tooltip"
              >
                <span className="font-medium">{member.name}</span>
                {isIdle && idleDuration && (
                  <span className="ml-1 text-gray-300">
                    (idle {idleDuration})
                  </span>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}

            {/* Avatar with status ring */}
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 ring-2',
                'border-white',
                isIdle ? 'ring-yellow-400' : 'ring-green-500'
              )}
            >
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white',
                    getAvatarColor(member.id)
                  )}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {overflow > 0 && (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-600"
          style={{ marginLeft: -8 }}
          data-testid="presence-overflow"
          aria-label={`${overflow} more member${overflow === 1 ? '' : 's'}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
