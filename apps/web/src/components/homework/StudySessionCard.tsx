import type { StudySession, StudySessionType } from '@chorechamp/types';

interface StudySessionCardProps {
  session: StudySession & {
    subject?: { id: string; name: string; color: string } | null;
    assignment?: { id: string; title: string } | null;
  };
  onEnd?: (sessionId: string) => void;
}

const sessionTypeConfig: Record<StudySessionType, { label: string; icon: string; color: string }> = {
  homework: { label: 'Homework', icon: '📝', color: 'blue' },
  reading: { label: 'Reading', icon: '📖', color: 'green' },
  practice: { label: 'Practice', icon: '✏️', color: 'purple' },
  review: { label: 'Review', icon: '🔄', color: 'orange' },
  project: { label: 'Project', icon: '🎯', color: 'teal' },
  research: { label: 'Research', icon: '🔍', color: 'indigo' },
  tutoring: { label: 'Tutoring', icon: '👨‍🏫', color: 'pink' },
  group_study: { label: 'Group Study', icon: '👥', color: 'yellow' },
};

export function StudySessionCard({ session, onEnd }: StudySessionCardProps) {
  const config = sessionTypeConfig[session.sessionType];
  const isActive = !session.endedAt;

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-500' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-500' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-500' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500' },
    };
    return colors[color]?.[type] || colors.blue[type];
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
        isActive ? 'border-green-500 animate-pulse' : getColorClasses(config.color, 'border')
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            getColorClasses(config.color, 'bg')
          }`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {session.title || config.label}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(session.startedAt)} at {formatTime(session.startedAt)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-xl font-bold ${isActive ? 'text-green-600' : 'text-gray-900'}`}>
            {formatDuration(session.durationMinutes)}
          </p>
          {isActive && (
            <span className="text-xs text-green-600 font-medium">In Progress</span>
          )}
        </div>
      </div>

      {/* Subject and assignment */}
      {(session.subject || session.assignment) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {session.subject && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: `${session.subject.color}20`, color: session.subject.color }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: session.subject.color }}
              />
              {session.subject.name}
            </span>
          )}
          {session.assignment && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              📝 {session.assignment.title}
            </span>
          )}
        </div>
      )}

      {/* Session details */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        {session.studyMethod && (
          <div>
            <span className="text-gray-500">Method:</span>
            <span className="ml-1 font-medium">{session.studyMethod}</span>
          </div>
        )}
        {session.location && (
          <div>
            <span className="text-gray-500">Location:</span>
            <span className="ml-1 font-medium">{session.location}</span>
          </div>
        )}
        {session.breaksTaken > 0 && (
          <div>
            <span className="text-gray-500">Breaks:</span>
            <span className="ml-1 font-medium">{session.breaksTaken}</span>
          </div>
        )}
        {session.problemsCompleted && (
          <div>
            <span className="text-gray-500">Problems:</span>
            <span className="ml-1 font-medium">{session.problemsCompleted}</span>
          </div>
        )}
      </div>

      {/* Accomplishments */}
      {session.accomplishments && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{session.accomplishments}</p>
        </div>
      )}

      {/* Ratings */}
      {!isActive && (session.productivityRating || session.comprehensionRating) && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {session.productivityRating && (
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-yellow-500 text-sm">{getRatingStars(session.productivityRating)}</p>
              <p className="text-xs text-gray-500">Productivity</p>
            </div>
          )}
          {session.difficultyRating && (
            <div className="p-2 bg-orange-50 rounded">
              <p className="text-yellow-500 text-sm">{getRatingStars(session.difficultyRating)}</p>
              <p className="text-xs text-gray-500">Difficulty</p>
            </div>
          )}
          {session.comprehensionRating && (
            <div className="p-2 bg-green-50 rounded">
              <p className="text-yellow-500 text-sm">{getRatingStars(session.comprehensionRating)}</p>
              <p className="text-xs text-gray-500">Understanding</p>
            </div>
          )}
        </div>
      )}

      {/* Points earned */}
      {!isActive && (session.pointsEarned > 0 || session.bonusPointsEarned > 0) && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-green-600 font-medium">
            +{session.pointsEarned} points
          </span>
          {session.bonusPointsEarned > 0 && (
            <span className="text-purple-600 font-medium">
              +{session.bonusPointsEarned} bonus
            </span>
          )}
        </div>
      )}

      {/* End session button */}
      {isActive && onEnd && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onEnd(session.id)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            End Session
          </button>
        </div>
      )}
    </div>
  );
}
