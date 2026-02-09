import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import { GeofenceList } from '../components/geofencing/GeofenceCard';
import { GEOFENCE_PRESETS } from '@chorechamp/types';

type TabId = 'overview' | 'geofences' | 'members' | 'automations' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'geofences', label: 'Geofences', icon: '📍' },
  { id: 'members', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'automations', label: 'Automations', icon: '⚡' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Mock data
const mockGeofences = [
  {
    id: '1',
    name: 'Home',
    type: 'home',
    description: 'Our family home',
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 100,
    address: '123 Main St, San Francisco, CA',
    isEnabled: true,
    notifyOnEntry: false,
    notifyOnExit: true,
    totalEntries: 156,
    totalExits: 148,
    lastTriggeredAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    name: 'School',
    type: 'school',
    description: "Emma's Elementary School",
    latitude: 37.7751,
    longitude: -122.4183,
    radiusMeters: 200,
    address: '456 Education Ave, San Francisco, CA',
    isEnabled: true,
    notifyOnEntry: true,
    notifyOnExit: true,
    totalEntries: 92,
    totalExits: 92,
    lastTriggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: "Grandma's House",
    type: 'relative',
    description: null,
    latitude: 37.7850,
    longitude: -122.4100,
    radiusMeters: 100,
    address: '789 Oak Street, San Francisco, CA',
    isEnabled: true,
    notifyOnEntry: true,
    notifyOnExit: true,
    totalEntries: 12,
    totalExits: 12,
    lastTriggeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

const mockMemberLocations = [
  {
    id: '1',
    memberId: 'member-1',
    memberName: 'Emma',
    isAtHome: true,
    currentGeofenceName: 'Home',
    lastUpdatedAt: new Date(Date.now() - 5 * 60 * 1000),
    batteryLevel: 85,
  },
  {
    id: '2',
    memberId: 'member-2',
    memberName: 'Jake',
    isAtHome: false,
    currentGeofenceName: 'School',
    lastUpdatedAt: new Date(Date.now() - 15 * 60 * 1000),
    batteryLevel: 62,
  },
  {
    id: '3',
    memberId: 'member-3',
    memberName: 'Mom',
    isAtHome: true,
    currentGeofenceName: 'Home',
    lastUpdatedAt: new Date(Date.now() - 2 * 60 * 1000),
    batteryLevel: 91,
  },
];

const mockAutomations = [
  {
    id: '1',
    name: 'Welcome Home',
    description: 'Remind about chores when arriving home',
    geofenceName: 'Home',
    triggerType: 'enter',
    isEnabled: true,
    timesTriggered: 45,
    lastTriggeredAt: new Date(Date.now() - 30 * 60 * 1000),
    actions: ['Send notification', 'Show pending chores'],
  },
  {
    id: '2',
    name: 'School Arrival',
    description: 'Notify parents when kids arrive at school',
    geofenceName: 'School',
    triggerType: 'enter',
    isEnabled: true,
    timesTriggered: 92,
    lastTriggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    actions: ['Send notification to parents'],
  },
];

const mockAnalytics = {
  totalGeofences: 3,
  activeGeofences: 3,
  totalEvents: 418,
  membersAtHome: 2,
  membersAway: 1,
};

export function Geofencing() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const memberCounts: Record<string, number> = {
    '1': 2, // 2 members at Home
    '2': 1, // 1 member at School
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location & Geofencing</h1>
          <p className="text-gray-500">
            Track family locations and create location-based automations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Geofence
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Family Status */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Family Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">{mockAnalytics.membersAtHome}</div>
                <div className="text-sm text-white/80">At Home</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">{mockAnalytics.membersAway}</div>
                <div className="text-sm text-white/80">Away</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">{mockAnalytics.activeGeofences}</div>
                <div className="text-sm text-white/80">Active Zones</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">{mockAnalytics.totalEvents}</div>
                <div className="text-sm text-white/80">Events (30d)</div>
              </div>
            </div>
          </div>

          {/* Member Locations */}
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Where is Everyone?</h2>
            <div className="space-y-3">
              {mockMemberLocations.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    member.isAtHome ? 'bg-green-50' : 'bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                        member.isAtHome ? 'bg-green-500' : 'bg-blue-500'
                      )}
                    >
                      {member.memberName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{member.memberName}</div>
                      <div className="text-sm text-gray-500">
                        {member.currentGeofenceName || 'Unknown location'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        member.isAtHome ? 'text-green-600' : 'text-blue-600'
                      )}
                    >
                      {member.isAtHome ? '🏠 Home' : '📍 Away'}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <span>🔋 {member.batteryLevel}%</span>
                      <span>•</span>
                      <span>
                        {Math.round(
                          (Date.now() - new Date(member.lastUpdatedAt).getTime()) / 60000
                        )}m ago
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                <span className="text-green-500">↓</span>
                <span className="text-gray-700">Emma arrived at Home</span>
                <span className="text-gray-400 ml-auto">30m ago</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                <span className="text-blue-500">↓</span>
                <span className="text-gray-700">Jake arrived at School</span>
                <span className="text-gray-400 ml-auto">4h ago</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                <span className="text-orange-500">↑</span>
                <span className="text-gray-700">Jake left Home</span>
                <span className="text-gray-400 ml-auto">4h 20m ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'geofences' && (
        <GeofenceList
          geofences={mockGeofences}
          memberCounts={memberCounts}
          onEdit={(id) => console.log('Edit', id)}
          onDelete={(id) => console.log('Delete', id)}
          onToggle={(id, enabled) => console.log('Toggle', id, enabled)}
        />
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {mockMemberLocations.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {member.memberName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.memberName}</h3>
                    <p className="text-sm text-gray-500">
                      {member.isAtHome ? 'At Home' : `At ${member.currentGeofenceName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">🔋 {member.batteryLevel}%</span>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      member.isAtHome
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {member.isAtHome ? '🏠 Home' : '📍 Away'}
                  </span>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center text-gray-400">
                Map view would appear here
              </div>

              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  View History
                </button>
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  Location Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'automations' && (
        <div className="space-y-4">
          {mockAutomations.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">⚡</span>
              <p className="text-gray-500">No automations configured</p>
              <p className="text-sm text-gray-400">
                Create automations to trigger actions on location events
              </p>
            </div>
          ) : (
            mockAutomations.map((automation) => (
              <div key={automation.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                    {automation.description && (
                      <p className="text-sm text-gray-500">{automation.description}</p>
                    )}
                  </div>
                  <button
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      automation.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        automation.isEnabled ? 'left-6' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {automation.geofenceName}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    On {automation.triggerType}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  Actions: {automation.actions.join(' → ')}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Triggered {automation.timesTriggered} times</span>
                  <span>
                    Last:{' '}
                    {new Date(automation.lastTriggeredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          <button className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
            + Add Automation
          </button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Location Sharing */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Location Sharing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Share with household</div>
                  <div className="text-sm text-gray-500">
                    Allow family members to see your location
                  </div>
                </div>
                <button className="relative w-12 h-6 rounded-full bg-green-500 transition-colors">
                  <div className="absolute top-0.5 left-6 w-5 h-5 rounded-full bg-white shadow" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Blur when away</div>
                  <div className="text-sm text-gray-500">
                    Show approximate location when not at home
                  </div>
                </div>
                <button className="relative w-12 h-6 rounded-full bg-gray-300 transition-colors">
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* History Settings */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Location History</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Store location history</div>
                  <div className="text-sm text-gray-500">Keep a log of past locations</div>
                </div>
                <button className="relative w-12 h-6 rounded-full bg-green-500 transition-colors">
                  <div className="absolute top-0.5 left-6 w-5 h-5 rounded-full bg-white shadow" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  History retention
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-gray-700">
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tracking Mode */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Tracking Mode</h3>
            <div className="space-y-2">
              {[
                { value: 'off', label: 'Off', desc: 'No location tracking' },
                {
                  value: 'geofence_only',
                  label: 'Geofence Only',
                  desc: 'Only track geofence events',
                },
                {
                  value: 'continuous_low',
                  label: 'Continuous (Battery Saver)',
                  desc: 'Low accuracy, longer battery',
                },
                {
                  value: 'continuous_high',
                  label: 'Continuous (High Accuracy)',
                  desc: 'Precise location, higher battery use',
                },
              ].map((mode) => (
                <label
                  key={mode.value}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="trackingMode"
                    value={mode.value}
                    defaultChecked={mode.value === 'geofence_only'}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-700">{mode.label}</div>
                    <div className="text-sm text-gray-500">{mode.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Geofence</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <p className="text-gray-500 mb-4">
              Choose a preset or create a custom geofence.
            </p>

            <div className="space-y-3">
              {GEOFENCE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    console.log('Selected preset', preset.id);
                    setShowCreateModal(false);
                  }}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {typeIcons[preset.type] || '📍'}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">{preset.name}</h3>
                      <p className="text-sm text-gray-500">{preset.description}</p>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  console.log('Create custom');
                  setShowCreateModal(false);
                }}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Custom Location</h3>
                    <p className="text-sm text-gray-500">
                      Create a geofence with custom settings
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const typeIcons: Record<string, string> = {
  home: '🏠',
  school: '🏫',
  work: '🏢',
  relative: '👨‍👩‍👧',
  activity: '⚽',
  friend: '👋',
  store: '🛒',
  custom: '📍',
};
