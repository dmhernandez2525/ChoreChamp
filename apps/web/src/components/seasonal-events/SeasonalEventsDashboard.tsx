import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Trophy,
  Gift,
  Star,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { SeasonalEvent, EventCalendar } from '@chorechamp/types';
import { getEventTimeRemaining, formatEventDate, getEventProgress } from '@chorechamp/types';

interface SeasonalEventsDashboardProps {
  householdId: string;
  onSelectEvent?: (event: SeasonalEvent) => void;
}

export function SeasonalEventsDashboard({ householdId, onSelectEvent }: SeasonalEventsDashboardProps) {
  const [calendar, setCalendar] = useState<EventCalendar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await apiClient.getEventCalendar(householdId);
      setCalendar(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadCalendar(false);
  }, [loadCalendar]);

  const handleRefresh = useCallback(() => {
    loadCalendar(true);
  }, [loadCalendar]);

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span>{error}</span>
        </div>
        <button onClick={handleRefresh} className="mt-3 text-sm text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500">
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!calendar) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg">
            <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Seasonal Events
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Special challenges and exclusive rewards
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Refresh events"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {/* Active Events */}
      {calendar.currentEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            Active Events
          </h3>
          {calendar.currentEvents.map((event) => (
            <ActiveEventCard
              key={event.id}
              event={event}
              onSelect={() => onSelectEvent?.(event)}
              householdId={householdId}
              onJoin={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      {calendar.upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" aria-hidden="true" />
            Upcoming Events
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {calendar.upcomingEvents.map((event) => (
              <UpcomingEventCard
                key={event.id}
                event={event}
                onSelect={() => onSelectEvent?.(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {calendar.pastEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gray-400" aria-hidden="true" />
            Past Events
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {calendar.pastEvents.map((event) => (
              <PastEventCard key={event.id} event={event} onSelect={() => onSelectEvent?.(event)} />
            ))}
          </div>
        </div>
      )}

      {calendar.currentEvents.length === 0 && calendar.upcomingEvents.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Active Events</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Check back soon for new seasonal events!</p>
        </div>
      )}
    </div>
  );
}

function ActiveEventCard({
  event,
  onSelect,
  householdId,
  onJoin,
}: {
  event: SeasonalEvent;
  onSelect: () => void;
  householdId: string;
  onJoin: () => void;
}) {
  const [isJoining, setIsJoining] = useState(false);
  const timeRemaining = getEventTimeRemaining(event.endDate);
  const progress = getEventProgress(event);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsJoining(true);
      await apiClient.joinEvent(householdId, event.id);
      onJoin();
    } catch (err) {
      console.error('Failed to join event:', err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <article
      onClick={onSelect}
      className="relative overflow-hidden rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all"
      style={{ borderColor: event.theme.primaryColor }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      aria-label={`${event.name} event - ${event.isParticipating ? 'Participating' : 'Not participating'}`}
    >
      {/* Banner gradient */}
      <div
        className="h-24 p-4"
        style={{
          background: `linear-gradient(135deg, ${event.theme.primaryColor}20, ${event.theme.secondaryColor})`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <span
              className="inline-block px-2 py-1 text-xs font-medium rounded"
              style={{ backgroundColor: event.theme.primaryColor, color: 'white' }}
            >
              {event.type.toUpperCase()}
            </span>
            <h3 className="mt-2 text-xl font-bold text-gray-900">{event.name}</h3>
          </div>
          {timeRemaining && (
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: event.theme.primaryColor }}>
                {timeRemaining.days}d {timeRemaining.hours}h left
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>

        {/* Progress bar (if participating) */}
        {event.isParticipating && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium" style={{ color: event.theme.primaryColor }}>
                {progress}%
              </span>
            </div>
            <div
              className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Event progress: ${progress}%`}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: event.theme.primaryColor }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Trophy className="w-4 h-4" aria-hidden="true" />
            {event.challenges.length} Challenges
          </span>
          <span className="flex items-center gap-1">
            <Gift className="w-4 h-4" aria-hidden="true" />
            {event.rewards.length} Rewards
          </span>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between">
          {event.isParticipating ? (
            <span
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: event.theme.primaryColor }}
            >
              <Star className="w-4 h-4" aria-hidden="true" />
              Participating
            </span>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="px-4 py-2 text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: event.theme.primaryColor }}
              aria-label={`Join ${event.name}`}
            >
              {isJoining ? 'Joining...' : 'Join Event'}
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function UpcomingEventCard({
  event,
  onSelect,
}: {
  event: SeasonalEvent;
  onSelect: () => void;
}) {
  const startDate = new Date(event.startDate);
  const now = new Date();
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <article
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      tabIndex={0}
      role="button"
      aria-label={`Upcoming event: ${event.name}, starts in ${daysUntil} days`}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${event.theme.primaryColor}20` }}
        >
          <Calendar className="w-5 h-5" style={{ color: event.theme.primaryColor }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{event.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{event.description}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span style={{ color: event.theme.primaryColor }}>
              Starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{formatEventDate(event.startDate)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function PastEventCard({
  event,
  onSelect,
}: {
  event: SeasonalEvent;
  onSelect: () => void;
}) {
  const progress = event.isParticipating ? getEventProgress(event) : 0;

  return (
    <article
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      tabIndex={0}
      role="button"
      aria-label={`Past event: ${event.name}, ended ${formatEventDate(event.endDate)}${event.isParticipating ? `, completed ${progress}%` : ''}`}
      className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all opacity-75 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <h4 className="font-medium text-gray-700 dark:text-gray-300">{event.name}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Ended {formatEventDate(event.endDate)}
      </p>
      {event.isParticipating && (
        <p className="text-xs mt-2" style={{ color: event.theme.primaryColor }}>
          Completed {progress}%
        </p>
      )}
    </article>
  );
}
