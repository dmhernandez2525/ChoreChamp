import { cn } from '@chorechamp/ui';

function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-200', className)} />
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-skeleton">
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-gray-50 p-3"
        >
          {/* Column header */}
          <div className="flex items-center justify-between">
            <Pulse className="h-5 w-24" />
            <Pulse className="h-5 w-5 rounded-full" />
          </div>

          {/* Card placeholders */}
          {Array.from({ length: 3 }).map((_, cardIdx) => (
            <div
              key={cardIdx}
              className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
            >
              <Pulse className="mb-2 h-4 w-3/4" />
              <Pulse className="mb-3 h-3 w-1/2" />
              <div className="flex items-center justify-between">
                <Pulse className="h-6 w-6 rounded-full" />
                <Pulse className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div data-testid="calendar-skeleton">
      {/* Day-of-week headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid: 5 rows x 7 columns */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, idx) => (
          <div
            key={idx}
            className="flex h-24 flex-col gap-1 rounded-md border border-gray-100 p-2"
          >
            <Pulse className="h-4 w-6 self-end" />
            <Pulse className="h-3 w-full" />
            {idx % 3 === 0 && <Pulse className="h-3 w-2/3" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200" data-testid="list-skeleton">
      {/* Table header */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Pulse className="h-4 w-4" />
        <Pulse className="h-4 w-40" />
        <Pulse className="h-4 w-24" />
        <Pulse className="h-4 w-20" />
        <Pulse className="h-4 w-28" />
        <Pulse className="ml-auto h-4 w-16" />
      </div>

      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
        >
          <Pulse className="h-4 w-4" />
          <Pulse className="h-4 w-48" />
          <Pulse className="h-4 w-20" />
          <Pulse className="h-6 w-6 rounded-full" />
          <Pulse className="h-4 w-24" />
          <Pulse className="ml-auto h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function BoardHeaderSkeleton() {
  return (
    <div
      className="flex flex-wrap items-center gap-3 pb-4"
      data-testid="board-header-skeleton"
    >
      {/* Title */}
      <Pulse className="h-7 w-40" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar */}
      <Pulse className="h-9 w-56 rounded-md" />

      {/* Action buttons */}
      <Pulse className="h-9 w-9 rounded-md" />
      <Pulse className="h-9 w-9 rounded-md" />
      <Pulse className="h-9 w-24 rounded-md" />
    </div>
  );
}
