import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button, cn } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useSupportThreads,
  useSupportThread,
  useCreateSupportThread,
  useCreateSupportMessage,
  useUpdateSupportThreadStatus,
} from '@chorechamp/api-client';
import { Skeleton } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { FeatureGate } from '../components/subscription/FeatureGate';
import { hasFeature } from '../lib/subscription';
import type { SupportMessage } from '@chorechamp/types';

function formatTimestamp(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function resolveSenderName(message: SupportMessage, memberMap: Map<string, string>) {
  if (message.senderRole === 'system') return 'ChoreChamp Support';
  if (!message.senderMemberId) return 'Support';
  return memberMap.get(message.senderMemberId) || 'Support';
}

export default function Support() {
  const { householdId } = useParams<{ householdId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members } = useMembers(householdId!);
  const { data: threads, isLoading: loadingThreads } = useSupportThreads(householdId!);
  const createThread = useCreateSupportThread(householdId!);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [subject, setSubject] = useState(searchParams.get('topic') || '');
  const [initialMessage, setInitialMessage] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: threadData } = useSupportThread(householdId!, selectedThreadId || '');
  const createMessage = useCreateSupportMessage(householdId!, selectedThreadId || '');
  const updateThreadStatus = useUpdateSupportThreadStatus(householdId!, selectedThreadId || '');

  const isPremium = hasFeature(household, 'priority_support');

  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((member) => member.userId === user.id) || null;
  }, [members, user]);

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    (members || []).forEach((member) => map.set(member.id, member.name));
    return map;
  }, [members]);

  useEffect(() => {
    if (!selectedThreadId && threads && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  const handleCreateThread = async () => {
    if (!subject.trim() || !initialMessage.trim()) {
      setError('Please add a subject and message.');
      return;
    }
    setError('');
    try {
      const response = await createThread.mutateAsync({
        subject: subject.trim(),
        message: initialMessage.trim(),
      });
      setSelectedThreadId(response.thread.id);
      setSubject('');
      setInitialMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create support request.');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedThreadId) return;
    setError('');
    try {
      await createMessage.mutateAsync({ message: message.trim() });
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    }
  };

  const handleCloseThread = async () => {
    if (!selectedThreadId) return;
    try {
      await updateThreadStatus.mutateAsync('closed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close thread.');
    }
  };

  if (loadingHousehold || loadingThreads) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        <header className="border-b bg-[var(--app-surface)] shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-80 rounded-xl" />
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm text-blue-600">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeThread = threadData?.thread || null;
  const messages = threadData?.messages || [];

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link to={`/households/${householdId}`} className="text-gray-500 hover:text-gray-700">
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Your Requests</h2>
              <div className="mt-3 space-y-2">
                {threads && threads.length > 0 ? (
                  threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-left text-sm transition',
                        selectedThreadId === thread.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{thread.subject}</span>
                        {thread.priority === 'priority' && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Priority</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{thread.status}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No support requests yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">New Request</h3>
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  value={initialMessage}
                  onChange={(event) => setInitialMessage(event.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  size="sm"
                  onClick={handleCreateThread}
                  disabled={createThread.isPending || !currentMember}
                >
                  {createThread.isPending ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            {activeThread ? (
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{activeThread.subject}</h2>
                    <p className="text-xs text-gray-500">Status: {activeThread.status}</p>
                  </div>
                  {activeThread.status !== 'closed' && (
                    <Button size="sm" variant="outline" onClick={handleCloseThread}>
                      Close
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{resolveSenderName(msg, memberMap)}</span>
                        <span>{formatTimestamp(msg.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-800">{msg.body}</p>
                    </div>
                  ))}
                </div>

                <FeatureGate
                  household={household}
                  feature="priority_support"
                  title="Priority support chat"
                  description="Upgrade to Premium for real-time in-app chat with our support team."
                >
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Type your message"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={!isPremium || activeThread.status === 'closed'}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!isPremium || !message.trim() || activeThread.status === 'closed'}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </FeatureGate>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Select a support request to view the conversation.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
