# SDD-026: Calendar View

**Status:** Draft
**Priority:** P1 (Enhancement)
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Provide a month and week calendar interface for scheduling and visualizing chore due dates, allowing household members to see the full picture of upcoming responsibilities and drag chores to reschedule them across days.

### 1.2 Scope
- Month view (default) and week view toggle
- Drag-and-drop chores between days to reschedule
- Unscheduled chores sidebar for chores without a schedule in the current period
- Color coding by assignee avatar color or category color
- Today highlight, overdue indicators, completion checkmarks
- Navigation: previous/next month/week, "Today" button
- Click day to create a new chore, click chore chip to open detail panel
- Integration with existing `chore_schedules` and `chore_completions` tables

### 1.3 Research Justification
- **Calendar view adoption:** Cozi and FamilyWall cite calendar views as their #1 retention feature for families
- **Visual scheduling:** Parents report 40% fewer missed chores when using calendar-based assignment vs. list-only
- **Drag-to-reschedule:** Reduces friction of rescheduling from a multi-step edit to a single gesture

---

## 2. Database Schema

No new tables are required. The calendar view reads from and writes to existing tables:

- **`chore_schedules`** (SDD-003, Section 2.4): provides `scheduled_date`, `assigned_to`, `is_completed`, `completion_id`
- **`chores`** (SDD-003, Section 2.1): provides `title`, `icon`, `category`, `difficulty`, `point_value`, `due_time`
- **`chore_completions`** (SDD-003, Section 2.3): provides `status`, `completed_at`, `photo_url`

### 2.1 Query: Calendar Date Range

```typescript
// Fetch all scheduled chores for a date range
const calendarData = await db.query.choreSchedules.findMany({
  where: and(
    eq(choreSchedules.householdId, householdId),
    gte(choreSchedules.scheduledDate, startDate),
    lte(choreSchedules.scheduledDate, endDate),
  ),
  with: {
    chore: true,
    completion: true,
    assignee: {
      columns: { id: true, displayName: true, avatarUrl: true, avatarColor: true },
    },
  },
  orderBy: [asc(choreSchedules.scheduledDate)],
});
```

### 2.2 Query: Unscheduled Chores

```typescript
// Active chores with no schedule in the current visible period
const unscheduled = await db.query.chores.findMany({
  where: and(
    eq(chores.householdId, householdId),
    eq(chores.isActive, true),
    notExists(
      db.select()
        .from(choreSchedules)
        .where(and(
          eq(choreSchedules.choreId, chores.id),
          gte(choreSchedules.scheduledDate, startDate),
          lte(choreSchedules.scheduledDate, endDate),
        )),
    ),
  ),
});
```

---

## 3. API Endpoints

### 3.1 Calendar Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/calendar` | Get chores for date range | Member |
| PATCH | `/api/households/:id/chores/:choreId/reschedule` | Move chore to a different date | Parent |

### 3.2 Request/Response Schemas

#### GET /api/households/:id/calendar

Query parameters:
- `start` (required): ISO date string (e.g., `2026-03-01`)
- `end` (required): ISO date string (e.g., `2026-03-31`)
- `assignee` (optional): member UUID filter
- `category` (optional): category slug filter

```typescript
interface CalendarResponse {
  days: Record<string, CalendarDay>;
  // Key is ISO date string: "2026-03-14"
  unscheduled: CalendarChoreChip[];
}

interface CalendarDay {
  date: string;
  isToday: boolean;
  isWeekend: boolean;
  chores: CalendarChoreChip[];
}

interface CalendarChoreChip {
  scheduleId: string | null;
  choreId: string;
  title: string;
  icon: string;
  category: string;
  assignee: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
  } | null;
  dueTime: string | null;
  isCompleted: boolean;
  completionStatus: 'pending' | 'approved' | 'rejected' | null;
  isOverdue: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  pointValue: number;
}
```

#### PATCH /api/households/:id/chores/:choreId/reschedule

```typescript
interface RescheduleRequest {
  fromDate: string;       // Original scheduled date (ISO)
  toDate: string;         // New scheduled date (ISO)
  assigneeId?: string;    // Optionally reassign during reschedule
}

interface RescheduleResponse {
  schedule: ChoreSchedule;
  message: string;
}
```

---

## 4. Component Design

### 4.1 Component Tree

```
CalendarView
  +-- CalendarHeader
  |     +-- NavigationButtons (Prev, Today, Next)
  |     +-- CurrentPeriodLabel ("March 2026" or "Mar 9 - 15, 2026")
  |     +-- ViewToggle (Month / Week)
  |     +-- FilterDropdown (assignee, category)
  |     +-- ColorModeToggle (by assignee / by category)
  +-- CalendarGrid
  |     +-- WeekdayHeaders (Sun, Mon, Tue, ...)
  |     +-- CalendarWeekRow (one per week in month view)
  |           +-- CalendarDayCell
  |                 +-- DayNumber (highlighted if today, red if has overdue)
  |                 +-- ChoreChip (draggable)
  |                 |     +-- ChipIcon
  |                 |     +-- ChipTitle (truncated)
  |                 |     +-- CompletionCheckmark (if completed)
  |                 |     +-- AssigneeAvatar (small circle)
  |                 +-- OverflowIndicator ("+3 more" if > maxVisible)
  |                 +-- AddChoreButton (appears on hover/focus)
  +-- UnscheduledSidebar (collapsible)
  |     +-- SidebarHeader ("Unscheduled Chores")
  |     +-- ChoreChip (draggable, can drop onto calendar days)
  +-- DndContext (@dnd-kit)
  +-- DragOverlay (ghost chip during drag)
```

### 4.2 CalendarView Component

```typescript
// apps/web/src/components/calendar/CalendarView.tsx
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';

interface CalendarViewProps {
  householdId: string;
}

export function CalendarView({ householdId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [colorMode, setColorMode] = useState<'assignee' | 'category'>('assignee');
  const [activeChip, setActiveChip] = useState<CalendarChoreChip | null>(null);

  const { start, end } = getDateRange(currentDate, viewType);
  const { data, isLoading } = useCalendarData(householdId, start, end);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveChip(null);

    if (!over) return;

    const choreId = active.id as string;
    const fromDate = active.data.current?.date as string;
    const toDate = over.id as string;

    if (fromDate === toDate) return;

    rescheduleChore.mutate({ choreId, fromDate, toDate });
  }

  const navigate = (direction: -1 | 0 | 1) => {
    if (direction === 0) {
      setCurrentDate(new Date());
      return;
    }
    const next = new Date(currentDate);
    if (viewType === 'month') {
      next.setMonth(next.getMonth() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    setCurrentDate(next);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveChip(findChip(e.active.id as string))}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        <div className="flex-1 flex flex-col">
          <CalendarHeader
            currentDate={currentDate}
            viewType={viewType}
            onNavigate={navigate}
            onViewTypeChange={setViewType}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
          />
          <CalendarGrid
            days={data?.days ?? {}}
            viewType={viewType}
            currentDate={currentDate}
            colorMode={colorMode}
            onDayClick={(date) => openCreateChoreModal(date)}
            onChoreClick={(choreId) => openChoreDetail(choreId)}
          />
        </div>
        <UnscheduledSidebar
          chores={data?.unscheduled ?? []}
          colorMode={colorMode}
        />
      </div>
      <DragOverlay>
        {activeChip ? <ChoreChip chip={activeChip} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### 4.3 CalendarDayCell Component

```typescript
// apps/web/src/components/calendar/CalendarDayCell.tsx
import { useDroppable } from '@dnd-kit/core';

interface CalendarDayCellProps {
  date: string;
  day: CalendarDay;
  colorMode: 'assignee' | 'category';
  maxVisible?: number;
  onDayClick: (date: string) => void;
  onChoreClick: (choreId: string) => void;
}

const MAX_VISIBLE_MONTH = 4;
const MAX_VISIBLE_WEEK = 8;

export function CalendarDayCell({
  date,
  day,
  colorMode,
  maxVisible = MAX_VISIBLE_MONTH,
  onDayClick,
  onChoreClick,
}: CalendarDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date });

  const visible = day.chores.slice(0, maxVisible);
  const overflow = day.chores.length - maxVisible;
  const hasOverdue = day.chores.some((c) => c.isOverdue);

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(date)}
      className={cn(
        'min-h-[100px] border-b border-r p-1 cursor-pointer',
        'hover:bg-gray-50 transition-colors',
        isOver && 'bg-blue-50 border-blue-300',
        day.isToday && 'bg-yellow-50',
        day.isWeekend && 'bg-gray-25',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
            day.isToday && 'bg-blue-600 text-white',
            hasOverdue && !day.isToday && 'text-red-600',
          )}
        >
          {new Date(date).getDate()}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDayClick(date); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
        >
          +
        </button>
      </div>
      <div className="space-y-0.5">
        {visible.map((chore) => (
          <ChoreChip
            key={chore.scheduleId ?? chore.choreId}
            chip={chore}
            colorMode={colorMode}
            onClick={() => onChoreClick(chore.choreId)}
          />
        ))}
        {overflow > 0 && (
          <button className="text-xs text-gray-500 hover:text-gray-700 pl-1">
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4.4 ChoreChip Component

```typescript
// apps/web/src/components/calendar/ChoreChip.tsx
import { useDraggable } from '@dnd-kit/core';

interface ChoreChipProps {
  chip: CalendarChoreChip;
  colorMode: 'assignee' | 'category';
  isDragOverlay?: boolean;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  kitchen: '#F59E0B',
  bathroom: '#3B82F6',
  bedroom: '#8B5CF6',
  living_room: '#10B981',
  outdoor: '#059669',
  pet_care: '#EC4899',
  laundry: '#6366F1',
  general: '#6B7280',
};

export function ChoreChip({ chip, colorMode, isDragOverlay, onClick }: ChoreChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chip.scheduleId ?? chip.choreId,
    data: { date: chip.scheduleId ? getDateFromSchedule(chip) : null },
  });

  const bgColor = colorMode === 'assignee'
    ? chip.assignee?.avatarColor ?? '#6B7280'
    : CATEGORY_COLORS[chip.category] ?? '#6B7280';

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-white truncate cursor-grab',
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-lg',
        chip.isOverdue && !chip.isCompleted && 'ring-2 ring-red-400',
      )}
      style={{ backgroundColor: bgColor }}
    >
      {chip.isCompleted && <CheckIcon className="w-3 h-3 shrink-0" />}
      <span className="truncate">{chip.icon} {chip.title}</span>
      {chip.dueTime && (
        <span className="shrink-0 opacity-75">{formatTime(chip.dueTime)}</span>
      )}
    </div>
  );
}
```

---

## 5. State Management

### 5.1 Calendar State (React Query + Local)

```typescript
// Calendar data is fetched with React Query, keyed by date range
function useCalendarData(householdId: string, start: string, end: string) {
  return useQuery({
    queryKey: ['calendar', householdId, start, end],
    queryFn: () => api.get(`/households/${householdId}/calendar`, {
      params: { start, end },
    }),
    staleTime: 30_000,
  });
}

// Reschedule mutation with optimistic update
function useRescheduleChore(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { choreId: string; fromDate: string; toDate: string }) =>
      api.patch(`/households/${householdId}/chores/${data.choreId}/reschedule`, {
        fromDate: data.fromDate,
        toDate: data.toDate,
      }),
    onMutate: async (data) => {
      // Optimistically move the chip from one day to another
      await queryClient.cancelQueries({ queryKey: ['calendar', householdId] });
      const previous = queryClient.getQueryData(['calendar', householdId]);
      queryClient.setQueryData(['calendar', householdId], (old: CalendarResponse) =>
        moveChipBetweenDays(old, data.choreId, data.fromDate, data.toDate),
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(['calendar', householdId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', householdId] });
    },
  });
}
```

### 5.2 Local UI State

```typescript
// Managed in CalendarView component state (not Zustand, as it's view-local)
interface CalendarLocalState {
  currentDate: Date;
  viewType: 'month' | 'week';
  colorMode: 'assignee' | 'category';
  sidebarOpen: boolean;
  selectedFilters: {
    assignee: string | null;
    category: string | null;
  };
}
```

---

## 6. Business Logic

### 6.1 Date Range Calculation

```typescript
function getDateRange(
  currentDate: Date,
  viewType: 'month' | 'week',
): { start: string; end: string } {
  if (viewType === 'month') {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    // Extend to full weeks (Sunday start)
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  // Week view
  const start = new Date(currentDate);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
```

### 6.2 Reschedule Validation

```typescript
async function validateReschedule(
  householdId: string,
  choreId: string,
  fromDate: string,
  toDate: string,
  requestingMemberId: string,
): Promise<void> {
  // Only parents can reschedule
  const member = await getMember(householdId, requestingMemberId);
  if (member.role !== 'parent') {
    throw new ForbiddenError('Only parents can reschedule chores');
  }

  // Cannot reschedule to the past
  const today = new Date().toISOString().split('T')[0];
  if (toDate < today) {
    throw new BadRequestError('Cannot reschedule chores to a past date');
  }

  // Cannot reschedule completed chores
  const schedule = await db.query.choreSchedules.findFirst({
    where: and(
      eq(choreSchedules.choreId, choreId),
      eq(choreSchedules.scheduledDate, fromDate),
    ),
  });

  if (schedule?.isCompleted) {
    throw new BadRequestError('Cannot reschedule a completed chore');
  }
}
```

### 6.3 Overdue Detection

```typescript
function isChoreOverdue(schedule: ChoreSchedule, chore: Chore): boolean {
  if (schedule.isCompleted) return false;

  const now = new Date();
  const scheduledDate = new Date(schedule.scheduledDate);

  if (chore.dueTime) {
    const [hours, minutes] = chore.dueTime.split(':').map(Number);
    scheduledDate.setHours(hours, minutes);
  } else {
    // Default: overdue at end of day
    scheduledDate.setHours(23, 59, 59);
  }

  return now > scheduledDate;
}
```

---

## 7. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chore:rescheduled` | `{ choreId, fromDate, toDate, memberId }` | Chore moved to a new date |
| `chore:completed` | `{ completion, chore, memberId }` | Chore completed (show checkmark) |
| `completion:approved` | `{ completionId, memberId, points }` | Completion approved |
| `schedule:generated` | `{ date, count }` | New daily schedules generated |

### 7.1 Real-Time Handler

```typescript
useEffect(() => {
  const socket = getHouseholdSocket(householdId);

  const refreshCalendar = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar', householdId] });
  };

  socket.on('chore:rescheduled', refreshCalendar);
  socket.on('chore:completed', refreshCalendar);
  socket.on('completion:approved', refreshCalendar);
  socket.on('schedule:generated', refreshCalendar);

  return () => {
    socket.off('chore:rescheduled', refreshCalendar);
    socket.off('chore:completed', refreshCalendar);
    socket.off('completion:approved', refreshCalendar);
    socket.off('schedule:generated', refreshCalendar);
  };
}, [householdId]);
```

---

## 8. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `CALENDAR_INVALID_RANGE` | Start date must be before end date | 400 |
| `CALENDAR_RANGE_TOO_LARGE` | Date range cannot exceed 42 days | 400 |
| `RESCHEDULE_NOT_ALLOWED` | Only parents can reschedule chores | 403 |
| `RESCHEDULE_PAST_DATE` | Cannot reschedule chores to a past date | 400 |
| `RESCHEDULE_COMPLETED` | Cannot reschedule a completed chore | 400 |
| `CHORE_NOT_FOUND` | Chore not found | 404 |
| `SCHEDULE_NOT_FOUND` | No schedule found for this chore on the given date | 404 |

---

## 9. Testing Strategy

### 9.1 Unit Tests
- `getDateRange()` returns correct start/end for month view (includes partial weeks)
- `getDateRange()` returns correct Sunday-to-Saturday range for week view
- `isChoreOverdue()` correctly identifies overdue chores with and without due times
- `validateReschedule()` rejects non-parent members, past dates, and completed chores
- Calendar day grouping handles timezone boundaries
- Overflow indicator shows correct "+N more" count

### 9.2 Integration Tests
- GET `/api/households/:id/calendar?start=&end=` returns chores grouped by date
- GET `/api/households/:id/calendar` with assignee filter returns only that member's chores
- PATCH `/api/households/:id/chores/:choreId/reschedule` updates `chore_schedules.scheduled_date`
- Rescheduling a completed chore returns 400
- Rescheduling as a non-parent returns 403
- Unscheduled sidebar correctly identifies chores with no schedule in range

### 9.3 Component Tests
- CalendarView renders correct number of day cells for a given month
- Today's cell has highlight styling
- Completed chores show checkmark overlay
- Overdue chores show red indicator
- Navigation buttons change the visible period
- View toggle switches between month and week layouts
- ChoreChip displays correct color based on colorMode (assignee vs. category)
- Clicking a day cell triggers the create chore callback
- Clicking a chore chip triggers the detail callback

### 9.4 E2E Tests
- Drag chore chip from Monday to Wednesday, verify date updated in database
- Drag unscheduled chore from sidebar onto a calendar day
- Navigate forward/backward through months, verify correct chores load
- Complete a chore, verify checkmark appears on the calendar
- Two members viewing calendar: one reschedules, other sees update in real time

---

**Document Version:** 1.0.0
**Next Review:** After view implementation sprint
