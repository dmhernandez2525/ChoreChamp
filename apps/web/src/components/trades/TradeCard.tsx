import { ArrowRight, Clock, Star, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { TradeWithDetails, TradeStatus } from '@chorechamp/types';

interface TradeCardProps {
  trade: TradeWithDetails;
  currentMemberId: string;
  isParent: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<TradeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_recipient: { label: 'Awaiting Response', color: 'text-amber-600 bg-amber-100', icon: <Clock className="w-4 h-4" /> },
  pending_approval: { label: 'Awaiting Parent Approval', color: 'text-blue-600 bg-blue-100', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'Approved', color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'Rejected', color: 'text-red-600 bg-red-100', icon: <XCircle className="w-4 h-4" /> },
  declined: { label: 'Declined', color: 'text-gray-600 bg-gray-100', icon: <XCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'text-gray-600 bg-gray-100', icon: <XCircle className="w-4 h-4" /> },
  expired: { label: 'Expired', color: 'text-gray-600 bg-gray-100', icon: <AlertTriangle className="w-4 h-4" /> },
};

export function TradeCard({
  trade,
  currentMemberId,
  isParent,
  onAccept,
  onDecline,
  onApprove,
  onReject,
  onCancel,
  isLoading = false,
}: TradeCardProps) {
  const statusConfig = STATUS_CONFIG[trade.status];
  const isInitiator = trade.initiator.id === currentMemberId;
  const isRecipient = trade.recipient.id === currentMemberId;

  const expiresIn = new Date(trade.expiresAt).getTime() - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(expiresIn / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60)));

  const isExpiringSoon = expiresIn > 0 && expiresIn < 2 * 60 * 60 * 1000; // Less than 2 hours

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
          {isExpiringSoon && trade.status.startsWith('pending') && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              Expires soon
            </span>
          )}
        </div>
        {trade.status.startsWith('pending') && expiresIn > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {hoursRemaining}h {minutesRemaining}m left
          </span>
        )}
      </div>

      {/* Trade Details */}
      <div className="flex items-center gap-4 mb-4">
        {/* Initiator */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: trade.initiator.color }}
            >
              {trade.initiator.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {trade.initiator.name}
              {isInitiator && <span className="text-gray-500 dark:text-gray-400 ml-1">(You)</span>}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Offering</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{trade.offeredChore.icon}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {trade.offeredChore.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {trade.offeredChore.scheduledDate}
                </p>
              </div>
            </div>
            {trade.pointsOffered > 0 && (
              <div className="flex items-center gap-1 mt-2 text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-sm font-medium">+{trade.pointsOffered} points</span>
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />

        {/* Recipient */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: trade.recipient.color }}
            >
              {trade.recipient.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {trade.recipient.name}
              {isRecipient && <span className="text-gray-500 dark:text-gray-400 ml-1">(You)</span>}
            </span>
          </div>
          {trade.requestedChore ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">In exchange for</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{trade.requestedChore.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {trade.requestedChore.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {trade.requestedChore.scheduledDate}
                  </p>
                </div>
              </div>
              {trade.pointsRequested > 0 && (
                <div className="flex items-center gap-1 mt-2 text-amber-600 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-medium">+{trade.pointsRequested} points</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                One-way trade
              </p>
              {trade.pointsRequested > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-amber-600 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-medium">{trade.pointsRequested} points</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {trade.message && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            "{trade.message}"
          </p>
        </div>
      )}

      {/* Rejection reason */}
      {trade.status === 'rejected' && trade.rejectionReason && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            Reason: {trade.rejectionReason}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Recipient can accept/decline */}
        {isRecipient && trade.status === 'pending_recipient' && (
          <>
            <button
              onClick={onAccept}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={onDecline}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        )}

        {/* Parent can approve/reject */}
        {isParent && trade.status === 'pending_approval' && (
          <>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </>
        )}

        {/* Initiator can cancel pending trades */}
        {isInitiator && (trade.status === 'pending_recipient' || trade.status === 'pending_approval') && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel Trade
          </button>
        )}
      </div>
    </div>
  );
}
