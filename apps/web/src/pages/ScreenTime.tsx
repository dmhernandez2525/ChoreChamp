import { useState } from 'react';
import type {
  TrackedDevice,
  ScreenTimeLimit,
  ScreenTimeUsage,
  ScreenTimeReward,
  ScreenTimeExtensionRequest,
  ChoreScreenTimeReward,
} from '@chorechamp/types';
import { DeviceCard } from '../components/screen-time/DeviceCard';
import { UsageCard } from '../components/screen-time/UsageCard';
import { ExtensionRequestCard } from '../components/screen-time/ExtensionRequestCard';
import { ScreenTimeLimitCard } from '../components/screen-time/ScreenTimeLimitCard';
import { RewardCard } from '../components/screen-time/RewardCard';

type TabType = 'overview' | 'devices' | 'limits' | 'rewards' | 'requests' | 'chore-rewards';

// Mock data for demonstration
const mockDevices: TrackedDevice[] = [
  {
    id: '1',
    householdId: 'h1',
    memberId: 'm1',
    name: 'Emma\'s iPad',
    type: 'tablet',
    platform: 'apple_screen_time',
    platformDeviceId: 'abc123',
    isActive: true,
    isConnected: true,
    lastSyncAt: new Date(Date.now() - 15 * 60000),
    iconUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    householdId: 'h1',
    memberId: 'm1',
    name: 'Nintendo Switch',
    type: 'gaming_console',
    platform: 'nintendo_parental',
    platformDeviceId: null,
    isActive: true,
    isConnected: false,
    lastSyncAt: new Date(Date.now() - 2 * 60 * 60000),
    iconUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockUsage: ScreenTimeUsage = {
  id: 'u1',
  memberId: 'm1',
  householdId: 'h1',
  date: new Date(),
  totalMinutesUsed: 85,
  limitMinutes: 120,
  bonusMinutesEarned: 30,
  bonusMinutesUsed: 10,
  deviceUsage: [
    { deviceId: '1', deviceName: 'Emma\'s iPad', minutesUsed: 60 },
    { deviceId: '2', deviceName: 'Nintendo Switch', minutesUsed: 25 },
  ],
  appUsage: [
    { appId: 'yt', appName: 'YouTube', categoryName: 'Entertainment', minutesUsed: 30 },
    { appId: 'mc', appName: 'Minecraft', categoryName: 'Games', minutesUsed: 25 },
    { appId: 'rob', appName: 'Roblox', categoryName: 'Games', minutesUsed: 20 },
    { appId: 'tt', appName: 'TikTok', categoryName: 'Social', minutesUsed: 10 },
  ],
  limitReached: false,
  limitExtended: true,
  lastUpdatedAt: new Date(),
};

const mockLimit: ScreenTimeLimit = {
  id: 'l1',
  householdId: 'h1',
  memberId: 'm1',
  dailyLimitMinutes: 120,
  weekendLimitMinutes: 180,
  allowedStartTime: '08:00',
  allowedEndTime: '20:00',
  bedtimeStart: '20:00',
  bedtimeEnd: '07:00',
  dayLimits: [
    { day: 0, limitMinutes: 180, startTime: '09:00', endTime: '21:00' },
    { day: 6, limitMinutes: 180, startTime: '09:00', endTime: '21:00' },
  ],
  appLimits: [
    { appId: 'yt', appName: 'YouTube', categoryId: null, categoryName: 'Entertainment', limitMinutes: 60 },
    { appId: null, appName: 'All Games', categoryId: 'games', categoryName: 'Games', limitMinutes: 90 },
  ],
  allowExtensions: true,
  pauseOnSchoolDays: false,
  requireChoreCompletion: true,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRewards: ScreenTimeReward[] = [
  {
    id: 'r1',
    memberId: 'm1',
    householdId: 'h1',
    rewardType: 'bonus_minutes',
    minutesAmount: 15,
    description: 'Completed bedroom cleaning',
    earnedFrom: 'chore_completion',
    sourceId: 'c1',
    sourceName: 'Clean Bedroom',
    isUsed: false,
    usedAt: null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60000),
    createdAt: new Date(),
  },
  {
    id: 'r2',
    memberId: 'm1',
    householdId: 'h1',
    rewardType: 'weekend_bonus',
    minutesAmount: 30,
    description: '7-day chore streak bonus',
    earnedFrom: 'streak',
    sourceId: null,
    sourceName: '7-Day Streak',
    isUsed: false,
    usedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60000),
  },
  {
    id: 'r3',
    memberId: 'm1',
    householdId: 'h1',
    rewardType: 'bonus_minutes',
    minutesAmount: 10,
    description: 'Helped with dishes',
    earnedFrom: 'bonus_chore',
    sourceId: 'c2',
    sourceName: 'Wash Dishes',
    isUsed: true,
    usedAt: new Date(Date.now() - 2 * 60 * 60000),
    expiresAt: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60000),
  },
];

const mockRequests: ScreenTimeExtensionRequest[] = [
  {
    id: 'req1',
    memberId: 'm1',
    householdId: 'h1',
    requestedMinutes: 30,
    reason: 'Finishing a movie with family',
    requestedAt: new Date(Date.now() - 30 * 60000),
    status: 'pending',
    respondedBy: null,
    respondedAt: null,
    responseNote: null,
    grantedMinutes: null,
  },
  {
    id: 'req2',
    memberId: 'm1',
    householdId: 'h1',
    requestedMinutes: 15,
    reason: 'Almost done with homework research',
    requestedAt: new Date(Date.now() - 24 * 60 * 60000),
    status: 'approved',
    respondedBy: 'm2',
    respondedAt: new Date(Date.now() - 23 * 60 * 60000),
    responseNote: 'Good job on homework!',
    grantedMinutes: 15,
  },
];

const mockChoreRewards: ChoreScreenTimeReward[] = [
  {
    id: 'cr1',
    householdId: 'h1',
    choreId: null,
    choreName: null,
    choreCategory: null,
    rewardType: 'bonus_minutes',
    minutesAmount: 5,
    requirePerfectCompletion: false,
    requirePhotoProof: false,
    onlyOnWeekdays: false,
    maxPerDay: 30,
    maxPerWeek: null,
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cr2',
    householdId: 'h1',
    choreId: 'c5',
    choreName: 'Clean Room',
    choreCategory: 'Cleaning',
    rewardType: 'bonus_minutes',
    minutesAmount: 15,
    requirePerfectCompletion: true,
    requirePhotoProof: true,
    onlyOnWeekdays: false,
    maxPerDay: 1,
    maxPerWeek: null,
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function ScreenTime() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'devices', label: 'Devices', icon: '📱' },
    { id: 'limits', label: 'Limits', icon: '⏰' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'requests', label: 'Requests', icon: '✋' },
    { id: 'chore-rewards', label: 'Chore Rewards', icon: '🔗' },
  ];

  const handleApproveRequest = (requestId: string, grantedMinutes: number) => {
    console.log('Approve request:', requestId, 'with', grantedMinutes, 'minutes');
  };

  const handleDenyRequest = (requestId: string, note?: string) => {
    console.log('Deny request:', requestId, 'with note:', note);
  };

  const handleUseReward = (rewardId: string) => {
    console.log('Use reward:', rewardId);
  };

  const handleSyncDevice = (deviceId: string) => {
    console.log('Sync device:', deviceId);
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
            <option value="m1">Emma</option>
            <option value="m2">Jack</option>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">1h 25m</p>
                  <p className="text-sm text-gray-500">Used Today</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">45m</p>
                  <p className="text-sm text-gray-500">Remaining</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">+30m</p>
                  <p className="text-sm text-gray-500">Bonus Earned</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">2</p>
                  <p className="text-sm text-gray-500">Devices Active</p>
                </div>
              </div>

              {/* Today's usage */}
              <UsageCard usage={mockUsage} memberName="Emma" />

              {/* Pending requests alert */}
              {mockRequests.filter(r => r.status === 'pending').length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✋</span>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Pending Extension Requests</h3>
                      <p className="text-sm text-yellow-700">
                        {mockRequests.filter(r => r.status === 'pending').length} request(s) waiting for approval
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
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Available Rewards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockRewards.filter(r => !r.isUsed).slice(0, 2).map((reward) => (
                    <RewardCard key={reward.id} reward={reward} onUse={handleUseReward} />
                  ))}
                </div>
                {mockRewards.filter(r => !r.isUsed).length > 2 && (
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                  >
                    View all {mockRewards.filter(r => !r.isUsed).length} rewards →
                  </button>
                )}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onSync={handleSyncDevice}
                    onEdit={(d) => console.log('Edit device:', d)}
                    onDelete={(id) => console.log('Delete device:', id)}
                  />
                ))}
              </div>

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
              <ScreenTimeLimitCard
                limit={mockLimit}
                memberName="Emma"
                onEdit={(l) => console.log('Edit limit:', l)}
                onToggle={(id, enabled) => console.log('Toggle limit:', id, enabled)}
              />

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

              {/* Available rewards */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Available</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockRewards.filter(r => !r.isUsed).map((reward) => (
                    <RewardCard key={reward.id} reward={reward} onUse={handleUseReward} />
                  ))}
                </div>
              </div>

              {/* Used rewards */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockRewards.filter(r => r.isUsed).map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Extension Requests</h2>
              </div>

              {/* Pending requests */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Pending Review</h3>
                <div className="space-y-4">
                  {mockRequests.filter(r => r.status === 'pending').map((request) => (
                    <ExtensionRequestCard
                      key={request.id}
                      request={request}
                      memberName="Emma"
                      isParentView={true}
                      onApprove={handleApproveRequest}
                      onDeny={handleDenyRequest}
                    />
                  ))}
                  {mockRequests.filter(r => r.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-center py-8">No pending requests</p>
                  )}
                </div>
              </div>

              {/* Past requests */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">History</h3>
                <div className="space-y-4">
                  {mockRequests.filter(r => r.status !== 'pending').map((request) => (
                    <ExtensionRequestCard
                      key={request.id}
                      request={request}
                      memberName="Emma"
                      responderName="Mom"
                    />
                  ))}
                </div>
              </div>
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

              <div className="space-y-4">
                {mockChoreRewards.map((rule) => (
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

              {/* Summary */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Earning Summary</h4>
                <p className="text-sm text-green-700">
                  With current rules, completing all daily chores can earn up to{' '}
                  <strong>45 minutes</strong> of bonus screen time per day.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
