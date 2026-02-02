import { useState } from 'react';
import { X, ArrowRight, Star, AlertCircle } from 'lucide-react';
import type { Member, TodayChore, CreateTradeRequest } from '@chorechamp/types';

interface CreateTradeModalProps {
  currentMember: Member;
  members: Member[];
  myChores: TodayChore[];
  onClose: () => void;
  onSubmit: (data: CreateTradeRequest) => Promise<void>;
}

export function CreateTradeModal({
  currentMember,
  members,
  myChores,
  onClose,
  onSubmit,
}: CreateTradeModalProps) {
  const [step, setStep] = useState(1);
  const [selectedRecipient, setSelectedRecipient] = useState<Member | null>(null);
  const [selectedOfferedChore, setSelectedOfferedChore] = useState<TodayChore | null>(null);
  const [pointsOffered, setPointsOffered] = useState(0);
  const [pointsRequested, setPointsRequested] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current member and parents from recipients
  const availableRecipients = members.filter(
    (m) => m.id !== currentMember.id && m.role !== 'parent' && m.role !== 'viewer'
  );

  // Get incomplete chores that can be traded
  const tradableChores = myChores.filter((c) => !c.isCompleted);

  const handleRecipientSelect = (member: Member) => {
    setSelectedRecipient(member);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedRecipient || !selectedOfferedChore) {
      setError('Please select a recipient and a chore to offer');
      return;
    }

    // Validate points
    if (pointsOffered > currentMember.pointsCurrent) {
      setError('You don\'t have enough points to offer');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSubmit({
        recipientMemberId: selectedRecipient.id,
        offeredChoreScheduleId: selectedOfferedChore.id,
        requestedChoreScheduleId: undefined,
        pointsOffered,
        pointsRequested,
        message: message || undefined,
        expiresInHours: 24,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Propose a Trade
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Select recipient */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Who do you want to trade with?
              </h3>
              <div className="space-y-2">
                {availableRecipients.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleRecipientSelect(member)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{member.pointsCurrent}</span>
                    </div>
                  </button>
                ))}
                {availableRecipients.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No other members available to trade with
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select chore to offer */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
              >
                ← Back to select recipient
              </button>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Which chore do you want to trade away?
              </h3>
              <div className="space-y-2">
                {tradableChores.map((choreSchedule) => (
                  <button
                    key={choreSchedule.id}
                    onClick={() => {
                      setSelectedOfferedChore(choreSchedule);
                      setStep(3);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedOfferedChore?.id === choreSchedule.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-2xl">{choreSchedule.chore.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {choreSchedule.chore.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Due: {choreSchedule.scheduledDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{choreSchedule.chore.pointValue}</span>
                    </div>
                  </button>
                ))}
                {tradableChores.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No chores available to trade
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Configure trade details */}
          {step === 3 && selectedRecipient && selectedOfferedChore && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
              >
                ← Back to select chore
              </button>

              {/* Trade summary */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mx-auto mb-2"
                    style={{ backgroundColor: currentMember.color }}
                  >
                    {currentMember.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <span className="text-xl">{selectedOfferedChore.chore.icon}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="flex-1 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mx-auto mb-2"
                    style={{ backgroundColor: selectedRecipient.color }}
                  >
                    {selectedRecipient.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRecipient.name}
                  </p>
                </div>
              </div>

              {/* Points offered */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Points to sweeten the deal (optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={currentMember.pointsCurrent}
                    value={pointsOffered}
                    onChange={(e) => setPointsOffered(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Your balance: {currentMember.pointsCurrent} points
                  </span>
                </div>
              </div>

              {/* Points requested */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Points requested in return (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={pointsRequested}
                  onChange={(e) => setPointsRequested(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey, would you be willing to swap chores?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                This trade will expire in 24 hours. {selectedRecipient.name} must accept, then a parent must approve.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 3 && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Proposing...' : 'Propose Trade'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
