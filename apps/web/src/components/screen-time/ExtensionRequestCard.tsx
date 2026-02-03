import type { ScreenTimeExtensionRequest } from '@chorechamp/types';

interface ExtensionRequestCardProps {
  request: ScreenTimeExtensionRequest;
  memberName?: string;
  responderName?: string;
  onApprove?: (requestId: string, grantedMinutes: number) => void;
  onDeny?: (requestId: string, note?: string) => void;
  isParentView?: boolean;
}

export function ExtensionRequestCard({
  request,
  memberName,
  responderName,
  onApprove,
  onDeny,
  isParentView = false,
}: ExtensionRequestCardProps) {
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            ⏳ Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            ✓ Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            ✗ Denied
          </span>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
      request.status === 'pending'
        ? 'border-yellow-500'
        : request.status === 'approved'
          ? 'border-green-500'
          : 'border-red-500'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              Extension Request
            </h3>
            {getStatusBadge()}
          </div>
          {memberName && (
            <p className="text-sm text-gray-500 mt-1">From: {memberName}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            +{formatMinutes(request.requestedMinutes)}
          </p>
          <p className="text-xs text-gray-500">{formatDate(request.requestedAt)}</p>
        </div>
      </div>

      {request.reason && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Reason: </span>
            {request.reason}
          </p>
        </div>
      )}

      {/* Response details */}
      {request.status !== 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {request.status === 'approved' ? 'Approved' : 'Denied'} by {responderName || 'Parent'}
            </span>
            {request.respondedAt && (
              <span className="text-gray-400">{formatDate(request.respondedAt)}</span>
            )}
          </div>
          {request.status === 'approved' && request.grantedMinutes && (
            <p className="mt-2 text-green-700 font-medium">
              Granted: +{formatMinutes(request.grantedMinutes)}
            </p>
          )}
          {request.responseNote && (
            <p className="mt-2 text-sm text-gray-600 italic">
              "{request.responseNote}"
            </p>
          )}
        </div>
      )}

      {/* Parent actions */}
      {isParentView && request.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onApprove?.(request.id, request.requestedMinutes)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            ✓ Approve Full
          </button>
          <button
            onClick={() => onApprove?.(request.id, Math.ceil(request.requestedMinutes / 2))}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ½ Partial
          </button>
          <button
            onClick={() => onDeny?.(request.id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            ✗ Deny
          </button>
        </div>
      )}
    </div>
  );
}
