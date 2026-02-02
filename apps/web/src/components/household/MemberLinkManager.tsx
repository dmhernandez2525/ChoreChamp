import { useState, useEffect } from 'react';
import { Link2, CheckCircle, XCircle, Home, ChevronRight, AlertCircle } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { Member, Household } from '@chorechamp/types';

interface MemberLinkManagerProps {
  householdId: string;
  member: Member;
  onUpdate?: () => void;
}

interface PendingLink {
  link: {
    id: string;
    primaryMemberId: string;
    linkedMemberId: string;
    sharePoints: boolean;
    shareStreaks: boolean;
  };
  primaryMember: Member;
  primaryHousehold: Household;
}

export function MemberLinkManager({
  householdId,
  member: _member,
  onUpdate,
}: MemberLinkManagerProps) {
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingLinks();
  }, [householdId]);

  async function loadPendingLinks() {
    try {
      setIsLoading(true);
      const links = await apiClient.getPendingMemberLinks(householdId);
      setPendingLinks(links);
    } catch (err) {
      console.error('Failed to load pending links:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(linkId: string) {
    try {
      setIsApproving(linkId);
      setError(null);
      await apiClient.approveMemberLink(householdId, linkId);
      await loadPendingLinks();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve link');
    } finally {
      setIsApproving(null);
    }
  }

  async function handleReject(linkId: string) {
    try {
      setIsApproving(linkId);
      setError(null);
      await apiClient.deleteMemberLink(householdId, linkId);
      await loadPendingLinks();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject link');
    } finally {
      setIsApproving(null);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (pendingLinks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No pending member link requests</p>
        <p className="text-sm mt-1">
          Link requests from other households will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>
          {pendingLinks.length} pending link request{pendingLinks.length !== 1 ? 's' : ''} waiting for approval
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {pendingLinks.map(({ link, primaryMember, primaryHousehold }) => (
          <div
            key={link.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {primaryHousehold.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    wants to link a member
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400" />

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryMember.color }}
                >
                  {primaryMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {primaryMember.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {primaryMember.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              {link.sharePoints && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  Points shared
                </span>
              )}
              {link.shareStreaks && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  Streaks shared
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprove(link.id)}
                disabled={isApproving === link.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {isApproving === link.id ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(link.id)}
                disabled={isApproving === link.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
