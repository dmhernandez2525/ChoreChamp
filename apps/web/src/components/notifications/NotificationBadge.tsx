import { cn } from '@chorechamp/ui';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
