import { useState, useEffect } from 'react';
import { DollarSign, Plus, Settings, Check, X, AlertCircle } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { Member, HouseholdAllowanceSummary, AllowanceSummary } from '@chorechamp/types';
import { AllowanceCard } from './AllowanceCard';
import { AllowanceSettingsForm } from './AllowanceSettingsForm';

interface AllowanceManagerProps {
  householdId: string;
  members: Member[];
  currentMember: Member;
}

export function AllowanceManager({
  householdId,
  members,
  currentMember,
}: AllowanceManagerProps) {
  const [householdSummary, setHouseholdSummary] = useState<HouseholdAllowanceSummary | null>(null);
  const [memberSummaries, setMemberSummaries] = useState<Map<string, AllowanceSummary>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isParent = currentMember.role === 'parent';
  const childMembers = members.filter((m) => m.role === 'child' || m.role === 'teen');

  useEffect(() => {
    loadAllowanceData();
  }, [householdId]);

  async function loadAllowanceData() {
    try {
      setIsLoading(true);
      setError(null);

      const summary = await apiClient.getHouseholdAllowanceSummary(householdId);
      setHouseholdSummary(summary);

      // Load individual member summaries
      const summaries = new Map<string, AllowanceSummary>();
      for (const member of childMembers) {
        try {
          const memberSummary = await apiClient.getMemberAllowanceSummary(householdId, member.id);
          summaries.set(member.id, memberSummary);
        } catch {
          // Skip if failed to load
        }
      }
      setMemberSummaries(summaries);
    } catch (err) {
      console.error('Failed to load allowance data:', err);
      setError('Failed to load allowance data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateSettings(data: Parameters<typeof apiClient.createAllowanceSettings>[1]) {
    await apiClient.createAllowanceSettings(householdId, data);
    setEditingMemberId(null);
    await loadAllowanceData();
  }

  async function handleGeneratePayout(memberId: string) {
    try {
      setActionLoading(memberId);
      setError(null);
      await apiClient.generatePayout(householdId, memberId);
      await loadAllowanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate payout');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkPaid(payoutId: string) {
    try {
      setActionLoading(payoutId);
      setError(null);
      await apiClient.markPayoutPaid(householdId, payoutId);
      await loadAllowanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark payout as paid');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelPayout(payoutId: string) {
    try {
      setActionLoading(payoutId);
      setError(null);
      await apiClient.cancelPayout(householdId, payoutId);
      await loadAllowanceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel payout');
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Allowance Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Convert points to real money
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Household summary for parents */}
      {isParent && householdSummary && householdSummary.totalPendingPayouts > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {householdSummary.totalPendingPayouts} Pending Payout{householdSummary.totalPendingPayouts !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Total: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: householdSummary.currency,
                }).format(householdSummary.pendingPayoutAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Member allowance cards */}
      {childMembers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No children in household to set up allowance for</p>
        </div>
      ) : (
        <div className="space-y-4">
          {childMembers.map((member) => {
            const summary = memberSummaries.get(member.id);
            const isEditing = editingMemberId === member.id;

            if (isEditing) {
              return (
                <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <AllowanceSettingsForm
                    memberId={member.id}
                    memberName={member.name}
                    existingSettings={summary?.settings}
                    onSave={handleCreateSettings}
                    onCancel={() => setEditingMemberId(null)}
                  />
                </div>
              );
            }

            return (
              <div key={member.id}>
                {summary ? (
                  <div className="space-y-3">
                    <AllowanceCard
                      summary={summary}
                      memberName={member.name}
                      memberColor={member.color}
                    />

                    {/* Actions for parents */}
                    {isParent && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingMemberId(member.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>

                        {!summary.pendingPayout && summary.settings?.isActive && (
                          <button
                            onClick={() => handleGeneratePayout(member.id)}
                            disabled={actionLoading === member.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Generate Payout
                          </button>
                        )}

                        {summary.pendingPayout && (
                          <>
                            <button
                              onClick={() => handleMarkPaid(summary.pendingPayout!.id)}
                              disabled={actionLoading === summary.pendingPayout.id}
                              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleCancelPayout(summary.pendingPayout!.id)}
                              disabled={actionLoading === summary.pendingPayout.id}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">No allowance set up</p>
                        </div>
                      </div>
                      {isParent && (
                        <button
                          onClick={() => setEditingMemberId(member.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Set Up Allowance
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
