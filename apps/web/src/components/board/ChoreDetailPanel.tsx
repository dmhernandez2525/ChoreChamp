import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X, MessageSquare, Clock, Activity, CheckCircle2,
  Camera, ShieldCheck, User, Star, Zap, Calendar,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import { useChoreComments, useAddComment, useDeleteComment, useChoreActivity } from '@chorechamp/api-client';
import type { Chore, ChoreCompletion, Member } from '@chorechamp/types';

interface ChoreDetailPanelProps {
  chore: Chore | null;
  completion?: ChoreCompletion | null;
  members: Member[];
  householdId: string;
  open: boolean;
  onClose: () => void;
  onComplete?: (choreId: string) => void;
  onEdit?: (choreId: string) => void;
  isCompleting?: boolean;
}

type TabId = 'details' | 'comments' | 'activity';

const difficultyConfig: Record<string, { label: string; color: string }> = {
  trivial: { label: 'Very Easy', color: 'bg-gray-100 text-gray-700' },
  easy: { label: 'Easy', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Hard', color: 'bg-red-100 text-red-700' },
  epic: { label: 'Epic', color: 'bg-purple-100 text-purple-700' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-500' },
  medium: { label: 'Medium', color: 'text-blue-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
};

const categoryLabels: Record<string, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  living_room: 'Living Room',
  outdoor: 'Outdoor',
  pet_care: 'Pet Care',
  laundry: 'Laundry',
  general: 'General',
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function ChoreDetailPanel({
  chore,
  completion,
  members,
  householdId,
  open,
  onClose,
  onComplete,
  onEdit,
  isCompleting,
}: ChoreDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [currentStep, setCurrentStep] = useState(0);
  const [newComment, setNewComment] = useState('');

  const choreId = chore?.id ?? '';

  const { data: comments = [], isLoading: commentsLoading } = useChoreComments(householdId, choreId);
  const { data: activityEntries = [], isLoading: activityLoading } = useChoreActivity(householdId, choreId);
  const addComment = useAddComment(householdId, choreId);
  const deleteComment = useDeleteComment(householdId, choreId);

  if (!chore) return null;

  const isCompleted = completion?.status === 'approved' || (completion?.status === 'pending' && !chore.requiresApproval);
  const needsApproval = chore.requiresApproval && completion?.status === 'pending';
  const isRejected = completion?.status === 'rejected';

  const difficulty = difficultyConfig[chore.difficulty] ?? difficultyConfig.medium;
  const priority = priorityConfig[chore.priority ?? 'medium'] ?? priorityConfig.medium;
  const steps = chore.steps as string[] | null;
  const hasSteps = steps && steps.length > 0;

  const assignees = members.filter(m =>
    Array.isArray(chore.assignedTo) && chore.assignedTo.includes(m.id)
  );

  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text) return;
    addComment.mutate({ comment: text });
    setNewComment('');
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const tabs: Array<{ id: TabId; label: string; icon: typeof MessageSquare }> = [
    { id: 'details', label: 'Details', icon: CheckCircle2 },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          data-testid="chore-detail-panel"
          aria-label={`Details for ${chore.title}`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl',
                  isCompleted ? 'bg-green-100' : 'bg-gray-100'
                )}
              >
                {isCompleted ? '✓' : chore.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-lg font-semibold text-gray-900 truncate">
                  {chore.title}
                </Dialog.Title>
                <p className="text-sm text-gray-500 truncate">
                  {categoryLabels[chore.category] ?? chore.category}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(chore.id)}>
                    Edit
                  </Button>
                )}
                <Dialog.Close asChild>
                  <button
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Status banner */}
            {(isCompleted || needsApproval || isRejected) && (
              <div
                className={cn(
                  'mt-3 rounded-lg px-3 py-2 text-sm font-medium',
                  isCompleted && 'bg-green-50 text-green-800',
                  needsApproval && 'bg-yellow-50 text-yellow-800',
                  isRejected && 'bg-red-50 text-red-800'
                )}
              >
                {isCompleted && `Completed${completion?.pointsAwarded ? ` +${completion.pointsAwarded} pts` : ''}`}
                {needsApproval && 'Waiting for parent approval'}
                {isRejected && `Not approved${completion?.rejectionReason ? `: ${completion.rejectionReason}` : ''}`}
              </div>
            )}

            {/* Tabs */}
            <div className="mt-3 flex gap-1 border-b-0">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeTab === id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                  aria-selected={activeTab === id}
                  role="tab"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-6 py-4">
            {/* Details tab */}
            {activeTab === 'details' && (
              <div className="space-y-5">
                {/* Description */}
                {chore.description && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Description</h4>
                    <p className="text-sm text-gray-700">{chore.description}</p>
                  </div>
                )}

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-gray-500">Points</p>
                      <p className="font-semibold">{chore.pointValue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Difficulty</p>
                      <span className={cn('text-sm font-medium rounded-full px-2 py-0.5', difficulty.color)}>
                        {difficulty.label}
                      </span>
                    </div>
                  </div>
                  {chore.priority && (
                    <div className="flex items-center gap-2">
                      <Activity className={cn('h-4 w-4', priority.color)} />
                      <div>
                        <p className="text-xs text-gray-500">Priority</p>
                        <p className={cn('font-medium text-sm', priority.color)}>{priority.label}</p>
                      </div>
                    </div>
                  )}
                  {chore.estimatedMinutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Estimated</p>
                        <p className="font-medium text-sm">{chore.estimatedMinutes} min</p>
                      </div>
                    </div>
                  )}
                  {chore.dueTime && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-500" />
                      <div>
                        <p className="text-xs text-gray-500">Due By</p>
                        <p className="font-medium text-sm">{formatTime(chore.dueTime)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assignees */}
                {assignees.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Assigned To</h4>
                    <div className="flex flex-wrap gap-2">
                      {assignees.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 rounded-full px-3 py-1"
                          style={{ backgroundColor: `${member.color}20` }}
                        >
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: member.color }} />
                          <span className="text-sm font-medium" style={{ color: member.color }}>
                            {member.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {(chore.requiresPhoto || chore.requiresApproval) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Requirements</h4>
                    <div className="flex gap-3">
                      {chore.requiresPhoto && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Camera className="h-4 w-4" /> Photo required
                        </div>
                      )}
                      {chore.requiresApproval && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <ShieldCheck className="h-4 w-4" /> Approval required
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Steps / Sub-step checklist */}
                {hasSteps && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                      Steps ({currentStep + 1} of {steps.length})
                    </h4>
                    <div className="space-y-1.5">
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className={cn(
                            'flex items-start gap-2.5 rounded-lg border p-2.5 text-sm transition-colors',
                            index < currentStep && 'bg-green-50 border-green-200',
                            index === currentStep && 'bg-blue-50 border-blue-300',
                            index > currentStep && 'bg-gray-50 border-gray-200'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium',
                              index < currentStep && 'bg-green-500 text-white',
                              index === currentStep && 'bg-blue-500 text-white',
                              index > currentStep && 'bg-gray-300 text-gray-600'
                            )}
                          >
                            {index < currentStep ? '✓' : index + 1}
                          </div>
                          <span className={cn(index <= currentStep ? 'text-gray-900' : 'text-gray-500')}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                    {!isCompleted && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                        >
                          <ChevronLeft className="mr-1 h-3 w-3" /> Previous
                        </Button>
                        {currentStep < steps.length - 1 ? (
                          <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                            Next <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        ) : onComplete ? (
                          <Button size="sm" onClick={() => onComplete(chore.id)} disabled={isCompleting}>
                            {isCompleting ? 'Completing...' : 'Mark Complete'}
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* Completion info */}
                {completion && (
                  <div className="border-t pt-4 text-xs text-gray-500">
                    Completed {formatDate(completion.completedAt)}
                    {completion.durationSeconds && (
                      <> in {Math.round(completion.durationSeconds / 60)} minutes</>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {!hasSteps && !isCompleted && !needsApproval && onComplete && (
                  <div className="border-t pt-4">
                    <Button onClick={() => onComplete(chore.id)} disabled={isCompleting} className="w-full">
                      {isCompleting ? 'Completing...' : 'Mark Complete'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Comments tab */}
            {activeTab === 'comments' && (
              <div>
                {/* Add comment form */}
                <div className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddComment();
                      }
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Cmd+Enter to submit</span>
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addComment.isPending}
                    >
                      {addComment.isPending ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>

                {/* Comments list */}
                {commentsLoading ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <p className="mt-2 text-sm text-gray-400">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-400">No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const author = members.find(m => m.id === comment.memberId);
                      return (
                        <div key={comment.id} className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {author && (
                                <>
                                  <span
                                    className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                                    style={{ backgroundColor: author.color }}
                                  >
                                    {author.name[0]}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{author.name}</span>
                                </>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                              aria-label="Delete comment"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-1.5 text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <div>
                {activityLoading ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <p className="mt-2 text-sm text-gray-400">Loading activity...</p>
                  </div>
                ) : activityEntries.length === 0 ? (
                  <div className="py-8 text-center">
                    <Activity className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-400">No activity recorded</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activityEntries.map((entry) => {
                      const actor = members.find(m => m.id === entry.memberId);
                      return (
                        <div key={entry.id} className="flex items-start gap-2.5 py-2">
                          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs">
                            {actor ? (
                              <span style={{ color: actor.color }} className="font-medium">
                                {actor.name[0]}
                              </span>
                            ) : (
                              <User className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">{actor?.name ?? 'Unknown'}</span>
                              {' '}
                              {entry.action.replace(/_/g, ' ')}
                              {entry.oldValue != null && entry.newValue != null ? (
                                <span className="text-gray-500">
                                  {' '}from {String(entry.oldValue)} to {String(entry.newValue)}
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-gray-400">{formatRelativeTime(entry.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
