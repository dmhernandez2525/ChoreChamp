import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@chorechamp/ui';
import { GeofenceList } from '../components/geofencing/GeofenceCard';
import { GEOFENCE_PRESETS } from '@chorechamp/types';
import {
  useGeofences,
  useMemberLocations,
  useGeofenceEvents,
  useGeofenceAutomations,
  useGeofenceAnalytics,
  useCreateGeofence,
  useDeleteGeofence,
} from '@chorechamp/api-client';

interface GeofenceData {
  id: string;
  name: string;
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string | null;
  isEnabled: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  totalEntries: number;
  totalExits: number;
  lastTriggeredAt: Date | null;
}

interface MemberLocationData {
  id: string;
  memberName: string;
  currentGeofenceName: string | null;
  isAtHome: boolean;
  batteryLevel: number;
  lastUpdatedAt: string;
}

interface GeofenceEventData {
  id: string;
  memberName: string;
  geofenceName: string;
  triggerType: 'enter' | 'exit';
  triggeredAt: string;
}

interface GeofenceAutomationData {
  id: string;
  name: string;
  description: string | null;
  geofenceName: string;
  triggerType: string;
  isEnabled: boolean;
  actions: string[];
  timesTriggered: number;
  lastTriggeredAt: string;
}

interface GeofenceAnalyticsData {
  totalGeofences: number;
  activeGeofences: number;
  totalEvents: number;
  membersAtHome: number;
  membersAway: number;
}

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

function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg" />
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

export function Geofencing() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: geofencesRaw, isLoading: geofencesLoading, error: geofencesError } = useGeofences(householdId!);
  const { data: memberLocationsRaw, isLoading: membersLoading, error: membersError } = useMemberLocations(householdId!);
  const { data: eventsRaw, isLoading: eventsLoading, error: eventsError } = useGeofenceEvents(householdId!);
  const { data: automationsRaw, isLoading: automationsLoading, error: automationsError } = useGeofenceAutomations(householdId!);
  const { data: analyticsRaw, isLoading: analyticsLoading, error: analyticsError } = useGeofenceAnalytics(householdId!);

  const geofences = geofencesRaw as GeofenceData[] | undefined;
  const memberLocations = memberLocationsRaw as MemberLocationData[] | undefined;
  const events = eventsRaw as GeofenceEventData[] | undefined;
  const automations = automationsRaw as GeofenceAutomationData[] | undefined;
  const analytics = analyticsRaw as GeofenceAnalyticsData | undefined;

  const { mutate: createGeofence, isPending: isCreating } = useCreateGeofence(householdId!);
  const { mutate: deleteGeofence } = useDeleteGeofence(householdId!);

  const geofenceList = geofences ?? [];
  const memberLocationList = memberLocations ?? [];
  const automationList = automations ?? [];
  const eventList = events ?? [];
  const analyticsData = analytics ?? {
    totalGeofences: 0,
    activeGeofences: 0,
    totalEvents: 0,
    membersAtHome: 0,
    membersAway: 0,
  };

  // Build member counts per geofence from real location data
  const memberCounts: Record<string, number> = {};
  for (const member of memberLocationList) {
    const matchingGeofence = geofenceList.find(
      (g) => g.name === member.currentGeofenceName
    );
    if (matchingGeofence) {
      memberCounts[matchingGeofence.id] = (memberCounts[matchingGeofence.id] || 0) + 1;
    }
  }

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
          {analyticsLoading ? (
            <LoadingSkeleton lines={1} />
          ) : analyticsError ? (
            <ErrorBanner message={String(analyticsError)} />
          ) : (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Family Status</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold">{analyticsData.membersAtHome}</div>
                  <div className="text-sm text-white/80">At Home</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold">{analyticsData.membersAway}</div>
                  <div className="text-sm text-white/80">Away</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold">{analyticsData.activeGeofences}</div>
                  <div className="text-sm text-white/80">Active Zones</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold">{analyticsData.totalEvents}</div>
                  <div className="text-sm text-white/80">Events (30d)</div>
                </div>
              </div>
            </div>
          )}

          {/* Member Locations */}
          {membersLoading ? (
            <LoadingSkeleton lines={3} />
          ) : membersError ? (
            <ErrorBanner message={String(membersError)} />
          ) : (
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Where is Everyone?</h2>
              {memberLocationList.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No member locations available</p>
              ) : (
                <div className="space-y-3">
                  {memberLocationList.map((member) => (
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
              )}
            </div>
          )}

          {/* Recent Activity */}
          {eventsLoading ? (
            <LoadingSkeleton lines={3} />
          ) : eventsError ? (
            <ErrorBanner message={String(eventsError)} />
          ) : (
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {eventList.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {eventList.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span
                        className={
                          event.triggerType === 'enter' ? 'text-green-500' : 'text-orange-500'
                        }
                      >
                        {event.triggerType === 'enter' ? '↓' : '↑'}
                      </span>
                      <span className="text-gray-700">
                        {event.memberName}{' '}
                        {event.triggerType === 'enter' ? 'arrived at' : 'left'}{' '}
                        {event.geofenceName}
                      </span>
                      <span className="text-gray-400 ml-auto">
                        {Math.round(
                          (Date.now() - new Date(event.triggeredAt).getTime()) / 60000
                        )}m ago
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'geofences' && (
        <>
          {geofencesLoading ? (
            <LoadingSkeleton lines={3} />
          ) : geofencesError ? (
            <ErrorBanner message={String(geofencesError)} />
          ) : (
            <GeofenceList
              geofences={geofenceList as any}
              memberCounts={memberCounts}
              onEdit={(id) => {
                // TODO: implement edit geofence modal
                console.log('Edit geofence:', id);
              }}
              onDelete={(id) => deleteGeofence(id)}
              onToggle={(_id, _enabled) => {
                // TODO: implement toggle when update hook is available
              }}
            />
          )}
        </>
      )}

      {activeTab === 'members' && (
        <>
          {membersLoading ? (
            <LoadingSkeleton lines={3} />
          ) : membersError ? (
            <ErrorBanner message={String(membersError)} />
          ) : memberLocationList.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No member locations available</p>
          ) : (
            <div className="space-y-4">
              {memberLocationList.map((member) => (
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
        </>
      )}

      {activeTab === 'automations' && (
        <>
          {automationsLoading ? (
            <LoadingSkeleton lines={3} />
          ) : automationsError ? (
            <ErrorBanner message={String(automationsError)} />
          ) : (
            <div className="space-y-4">
              {automationList.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">⚡</span>
                  <p className="text-gray-500">No automations configured</p>
                  <p className="text-sm text-gray-400">
                    Create automations to trigger actions on location events
                  </p>
                </div>
              ) : (
                automationList.map((automation) => (
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
        </>
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
                  disabled={isCreating}
                  onClick={() => {
                    createGeofence(
                      {
                        name: preset.name,
                        type: preset.type,
                        description: preset.description,
                        radiusMeters: preset.suggestedRadius,
                      },
                      { onSuccess: () => setShowCreateModal(false) }
                    );
                  }}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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
                disabled={isCreating}
                onClick={() => {
                  createGeofence(
                    {
                      name: 'Custom Location',
                      type: 'custom',
                    },
                    { onSuccess: () => setShowCreateModal(false) }
                  );
                }}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
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
