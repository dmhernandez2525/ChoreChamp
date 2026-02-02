import type { VolunteerLog } from '@chorechamp/types';

interface VolunteerLogCardProps {
  log: VolunteerLog;
  onVerify?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function VolunteerLogCard({ log, onVerify, onDelete }: VolunteerLogCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">\u2764\uFE0F</span>
            <h4 className="font-medium text-white">{log.organizationName}</h4>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            log.verified
              ? 'bg-green-400 text-green-900'
              : 'bg-yellow-400 text-yellow-900'
          }`}>
            {log.verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-700 mb-3">{log.activityDescription}</p>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-medium">{formatDate(log.volunteerDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Hours</p>
            <p className="font-semibold text-lg text-pink-600">{log.hoursCompleted} hrs</p>
          </div>
        </div>

        {log.supervisorName && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <span>&#128100;</span>
            <span>
              Supervisor: {log.supervisorName}
              {log.supervisorContact && ` (${log.supervisorContact})`}
            </span>
          </div>
        )}

        {log.verified && log.verifiedAt && (
          <div className="flex items-center space-x-2 text-sm text-green-600 mb-2">
            <span>\u2713</span>
            <span>
              Verified on {formatDate(log.verifiedAt)}
              {log.verifiedBy && ` by ${log.verifiedBy}`}
            </span>
          </div>
        )}

        {log.certificateUrl && (
          <div className="flex items-center space-x-2 text-sm mb-2">
            <span>&#128196;</span>
            <a
              href={log.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Certificate
            </a>
          </div>
        )}

        {log.notes && (
          <p className="text-xs text-gray-500 italic mt-2">{log.notes}</p>
        )}

        {(onVerify || onDelete) && (
          <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
            {onVerify && !log.verified && (
              <button
                onClick={() => onVerify(log.id)}
                className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 rounded text-green-600"
              >
                Verify
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(log.id)}
                className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 rounded text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
