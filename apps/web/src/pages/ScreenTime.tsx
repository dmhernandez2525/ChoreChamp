import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type {
  ChoreScreenTimeReward,
  TrackedDevice,
  ScreenTimeUsage as ScreenTimeUsageType,
  ScreenTimeLimit,
  ScreenTimeReward,
  ScreenTimeExtensionRequest,
} from '@chorechamp/types';
import {
  useTrackedDevices,
  useScreenTimeUsage,
  useScreenTimeLimits,
  useScreenTimeRewards,
  useScreenTimeExtensions,
  useApproveScreenTimeExtension,
  useMembers,
} from '@chorechamp/api-client';
import { DeviceCard } from '../components/screen-time/DeviceCard';
import { UsageCard } from '../components/screen-time/UsageCard';
import { ExtensionRequestCard } from '../components/screen-time/ExtensionRequestCard';
import { ScreenTimeLimitCard } from '../components/screen-time/ScreenTimeLimitCard';
import { RewardCard } from '../components/screen-time/RewardCard';

type TabType = 'overview' | 'devices' | 'limits' | 'rewards' | 'requests' | 'chore-rewards';

function LoadingSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}

export function ScreenTime() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const { data: membersData } = useMembers(householdId!);
  const { data: devices, isLoading: devicesLoading, error: devicesError } = useTrackedDevices(householdId!);
  const { data: usage, isLoading: usageLoading, error: usageError } = useScreenTimeUsage(householdId!);
  const { data: limits, isLoading: limitsLoading, error: limitsError } = useScreenTimeLimits(householdId!);
  const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useScreenTimeRewards(householdId!);
  const { data: extensions, isLoading: extensionsLoading, error: extensionsError } = useScreenTimeExtensions(householdId!);

  const householdMembers = Array.isArray(membersData) ? (membersData as Array<{ id: string; name: string; role: string }>) : [];

  const { mutate: approveExtension } = useApproveScreenTimeExtension(householdId!);

  const deviceList = Array.isArray(devices) ? (devices as TrackedDevice[]) : [];
  const usageList = Array.isArray(usage) ? (usage as ScreenTimeUsageType[]) : [];
  const usageData = usageList[0] ?? null;
  const limitList = Array.isArray(limits) ? (limits as ScreenTimeLimit[]) : [];
  const rewardList = Array.isArray(rewards) ? (rewards as ScreenTimeReward[]) : [];
  const extensionList = Array.isArray(extensions) ? (extensions as ScreenTimeExtensionRequest[]) : [];

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'devices', label: 'Devices', icon: '📱' },
    { id: 'limits', label: 'Limits', icon: '⏰' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'requests', label: 'Requests', icon: '✋' },
    { id: 'chore-rewards', label: 'Chore Rewards', icon: '🔗' },
  ];

  const handleApproveRequest = (requestId: string, _grantedMinutes: number) => {
    approveExtension({ extensionId: requestId, approved: true });
  };

  const handleDenyRequest = (requestId: string, _note?: string) => {
    approveExtension({ extensionId: requestId, approved: false });
  };

  const handleUseReward = (_rewardId: string) => {
    // Reward usage is tracked server-side; placeholder for future mutation hook
  };

  const handleSyncDevice = (_deviceId: string) => {
    // Device sync is triggered server-side; placeholder for future mutation hook
  };

  const pendingRequests = extensionList.filter((r) => r.status === 'pending');
  const pastRequests = extensionList.filter((r) => r.status !== 'pending');
  const availableRewards = rewardList.filter((r) => !r.isUsed);
  const usedRewards = rewardList.filter((r) => r.isUsed);

  // Derive overview stats from real usage data
  const totalMinutesUsed = usageData?.totalMinutesUsed ?? 0;
  const limitMinutes = usageData?.limitMinutes ?? 0;
  const bonusMinutesEarned = usageData?.bonusMinutesEarned ?? 0;
  const remainingMinutes = Math.max(0, limitMinutes - totalMinutesUsed + bonusMinutesEarned);
  const activeDeviceCount = deviceList.filter((d) => d.isActive).length;

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Screen Time Management</h1>
          <p className="text-gray-500 mt-1">
            Monitor usage, set limits, and reward good habits with screen time
          </p>
        </div>

        {/* Member selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Member:</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Members</option>
            {householdMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Quick stats */}
              {usageLoading ? (
                <LoadingSkeleton count={4} />
              ) : usageError ? (
                <ErrorBanner message={usageError instanceof Error ? usageError.message : 'Failed to load usage data'} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{formatMinutes(totalMinutesUsed)}</p>
                    <p className="text-sm text-gray-500">Used Today</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{formatMinutes(remainingMinutes)}</p>
                    <p className="text-sm text-gray-500">Remaining</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">+{formatMinutes(bonusMinutesEarned)}</p>
                    <p className="text-sm text-gray-500">Bonus Earned</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{activeDeviceCount}</p>
                    <p className="text-sm text-gray-500">Devices Active</p>
                  </div>
                </div>
              )}

              {/* Today's usage */}
              {usageLoading ? (
                <LoadingSkeleton count={1} />
              ) : usageError ? null : usageData ? (
                <UsageCard usage={usageData} memberName={householdMembers.find(m => m.id === selectedMember)?.name ?? 'Member'} />
              ) : null}

              {/* Pending requests alert */}
              {extensionsLoading ? null : pendingRequests.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✋</span>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Pending Extension Requests</h3>
                      <p className="text-sm text-yellow-700">
                        {pendingRequests.length} request(s) waiting for approval
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              )}

              {/* Available rewards */}
              {rewardsLoading ? (
                <LoadingSkeleton count={2} />
              ) : rewardsError ? (
                <ErrorBanner message={rewardsError instanceof Error ? rewardsError.message : 'Failed to load rewards'} />
              ) : (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Available Rewards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableRewards.slice(0, 2).map((reward) => (
                      <RewardCard key={reward.id} reward={reward} onUse={handleUseReward} />
                    ))}
                  </div>
                  {availableRewards.length > 2 && (
                    <button
                      onClick={() => setActiveTab('rewards')}
                      className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                    >
                      View all {availableRewards.length} rewards →
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'devices' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tracked Devices</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Add Device
                </button>
              </div>
              {devicesLoading ? (
                <LoadingSkeleton count={2} />
              ) : devicesError ? (
                <ErrorBanner message={devicesError instanceof Error ? devicesError.message : 'Failed to load devices'} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deviceList.map((device) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onSync={handleSyncDevice}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              )}

              {/* Platform connections */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Connect Platforms</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Apple Screen Time', icon: '🍎', connected: true },
                    { name: 'Google Family Link', icon: '🔵', connected: false },
                    { name: 'Microsoft Family', icon: '🪟', connected: false },
                    { name: 'Nintendo Parental', icon: '🎮', connected: true },
                  ].map((platform) => (
                    <button
                      key={platform.name}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        platform.connected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">{platform.icon}</span>
                      <span className="text-sm font-medium">{platform.name}</span>
                      {platform.connected && (
                        <span className="block text-xs text-green-600 mt-1">✓ Connected</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'limits' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Screen Time Limits</h2>
              </div>
              {limitsLoading ? (
                <LoadingSkeleton count={1} />
              ) : limitsError ? (
                <ErrorBanner message={limitsError instanceof Error ? limitsError.message : 'Failed to load limits'} />
              ) : limitList.length > 0 ? (
                limitList.map((limit) => (
                  <ScreenTimeLimitCard
                    key={limit.id}
                    limit={limit}
                    memberName={householdMembers.find(m => m.id === selectedMember)?.name ?? 'Member'}
                    onEdit={() => {}}
                    onToggle={(_id, _enabled) => { /* TODO: add useUpdateScreenTimeLimit hook */ }}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No limits configured yet</p>
              )}

              {/* Quick limit adjustments */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Adjustments</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                    🔒 Lock Now
                  </button>
                  <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                    +15 Minutes
                  </button>
                  <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    🛌 Start Bedtime
                  </button>
                  <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                    📅 Weekend Mode
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'rewards' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Screen Time Rewards</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Grant Reward
                </button>
              </div>

              {rewardsLoading ? (
                <LoadingSkeleton count={3} />
              ) : rewardsError ? (
                <ErrorBanner message={rewardsError instanceof Error ? rewardsError.message : 'Failed to load rewards'} />
              ) : (
                <>
                  {/* Available rewards */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Available</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableRewards.map((reward) => (
                        <RewardCard key={reward.id} reward={reward} onUse={handleUseReward} />
                      ))}
                    </div>
                  </div>

                  {/* Used rewards */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Used</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {usedRewards.map((reward) => (
                        <RewardCard key={reward.id} reward={reward} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Extension Requests</h2>
              </div>

              {extensionsLoading ? (
                <LoadingSkeleton count={2} />
              ) : extensionsError ? (
                <ErrorBanner message={extensionsError instanceof Error ? extensionsError.message : 'Failed to load requests'} />
              ) : (
                <>
                  {/* Pending requests */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Pending Review</h3>
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <ExtensionRequestCard
                          key={request.id}
                          request={request}
                          memberName={householdMembers.find(m => m.id === selectedMember)?.name ?? 'Member'}
                          isParentView={true}
                          onApprove={handleApproveRequest}
                          onDeny={handleDenyRequest}
                        />
                      ))}
                      {pendingRequests.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No pending requests</p>
                      )}
                    </div>
                  </div>

                  {/* Past requests */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">History</h3>
                    <div className="space-y-4">
                      {pastRequests.map((request) => (
                        <ExtensionRequestCard
                          key={request.id}
                          request={request}
                          memberName={householdMembers.find(m => m.id === selectedMember)?.name ?? 'Member'}
                          responderName="Mom"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'chore-rewards' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Chore-to-Screen Time Rules</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Add Rule
                </button>
              </div>

              <p className="text-gray-600">
                Configure how completing chores earns screen time rewards.
              </p>

              {rewardsLoading ? (
                <LoadingSkeleton count={2} />
              ) : rewardsError ? (
                <ErrorBanner message={rewardsError instanceof Error ? rewardsError.message : 'Failed to load chore rewards'} />
              ) : (
                <div className="space-y-4">
                  {(rewardList as unknown as ChoreScreenTimeReward[]).map((rule) => (
                    <div
                      key={rule.id}
                      className={`bg-white rounded-lg shadow p-4 ${!rule.isEnabled ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {rule.choreName || 'All Chores'}
                            {rule.choreCategory && (
                              <span className="ml-2 text-sm text-gray-500">({rule.choreCategory})</span>
                            )}
                          </h4>
                          <p className="text-lg font-bold text-blue-600 mt-1">
                            +{rule.minutesAmount} minutes
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.isEnabled}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {rule.requirePerfectCompletion && (
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                            ⭐ Perfect completion required
                          </span>
                        )}
                        {rule.requirePhotoProof && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                            📸 Photo proof required
                          </span>
                        )}
                        {rule.onlyOnWeekdays && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            📅 Weekdays only
                          </span>
                        )}
                        {rule.maxPerDay && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            Max {rule.maxPerDay}/day
                          </span>
                        )}
                        {rule.maxPerWeek && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            Max {rule.maxPerWeek}/week
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Earning Summary</h4>
                <p className="text-sm text-green-700">
                  With current rules, completing all daily chores can earn up to{' '}
                  <strong>
                    {(rewardList as unknown as ChoreScreenTimeReward[]).reduce(
                      (sum, r) => sum + (r.isEnabled ? r.minutesAmount : 0),
                      0,
                    )}{' '}
                    minutes
                  </strong>{' '}
                  of bonus screen time per day.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
