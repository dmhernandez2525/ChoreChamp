import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';
import type { InviteCode } from '@chorechamp/types';

interface InviteCodeSectionProps {
  inviteCodes?: InviteCode[];
  onGenerateCode: (role: string) => Promise<void>;
  isGenerating?: boolean;
}

export function InviteCodeSection({
  inviteCodes = [],
  onGenerateCode,
  isGenerating,
}: InviteCodeSectionProps) {
  const [selectedRole, setSelectedRole] = useState('child');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (code: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my ChoreChamp household',
          text: `Use this code to join our family household: ${code}`,
          url: `${window.location.origin}/households/join?code=${code}`,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy(code);
    }
  };

  const activeInviteCodes = inviteCodes.filter((ic) => {
    if (!ic.isActive) return false;
    if (ic.expiresAt && new Date(ic.expiresAt) < new Date()) return false;
    if (ic.maxUses && ic.useCount >= ic.maxUses) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Generate new code */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-medium text-gray-900">Generate Invite Code</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create a code to invite family members to join your household.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="child">For Child</option>
            <option value="teen">For Teen</option>
            <option value="parent">For Parent</option>
          </select>

          <Button
            onClick={() => onGenerateCode(selectedRole)}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </Button>
        </div>
      </div>

      {/* Active codes */}
      {activeInviteCodes.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-gray-900">Active Invite Codes</h3>
          <div className="mt-4 space-y-3">
            {activeInviteCodes.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold tracking-widest">
                      {invite.code}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        invite.role === 'parent'
                          ? 'bg-purple-100 text-purple-700'
                          : invite.role === 'teen'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      )}
                    >
                      {invite.role}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {invite.maxUses
                      ? `${invite.useCount}/${invite.maxUses} uses`
                      : 'Unlimited uses'}
                    {invite.expiresAt && (
                      <> • Expires {formatDate(invite.expiresAt)}</>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(invite.code)}
                  >
                    {copiedCode === invite.code ? 'Copied!' : 'Copy'}
                  </Button>
                  {'share' in navigator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(invite.code)}
                    >
                      Share
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900">How invite codes work</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Share the code with family members</li>
          <li>• They enter it at the "Join Household" page</li>
          <li>• Codes expire after 7 days</li>
          <li>• Each code can be used up to 5 times</li>
        </ul>
      </div>
    </div>
  );
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
