import { useState, useEffect } from 'react';
import { cn } from '@chorechamp/ui';
import { DeviceGrid } from '../components/smart-home/DeviceCard';
import { AutomationList } from '../components/smart-home/AutomationCard';

interface DeviceState {
  power?: 'on' | 'off';
  brightness?: number;
  temperature?: number;
  humidity?: number;
  motion?: boolean;
  contact?: 'open' | 'closed';
  locked?: boolean;
  battery?: number;
  vacuumState?: 'cleaning' | 'idle' | 'charging' | 'error';
  mediaState?: 'playing' | 'paused' | 'stopped';
  lastUpdated: Date;
}

interface SmartHomeHub {
  id: string;
  platform: string;
  name: string;
  description: string | null;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastConnectedAt: Date | null;
  lastError: string | null;
}

interface SmartDevice {
  id: string;
  hubId: string;
  name: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
  capabilities: string[];
  currentState: DeviceState;
  isOnline: boolean;
  choreRelatedZone: string | null;
}

interface SmartHomeAutomation {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  trigger: { type: string; config: Record<string, unknown> };
  actions: Array<{ type: string; config: Record<string, unknown>; delay?: number }>;
  lastTriggeredAt: Date | null;
  triggerCount: number;
}

interface Platform {
  id: string;
  name: string;
  description: string;
  requiresUrl: boolean;
  requiresToken: boolean;
}

interface SmartHomeProps {
  householdId: string;
}

export function SmartHome({ householdId }: SmartHomeProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'automations' | 'hubs'>('overview');
  const [hubs, setHubs] = useState<SmartHomeHub[]>([]);
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [automations, setAutomations] = useState<SmartHomeAutomation[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddHub, setShowAddHub] = useState(false);

  // Form state for adding hub
  const [newHub, setNewHub] = useState({
    platform: '',
    name: '',
    description: '',
    hostUrl: '',
    accessToken: '',
  });

  useEffect(() => {
    loadData();
  }, [householdId]);

  async function loadData() {
    setIsLoading(true);
    try {
      // Load platforms
      const platformsRes = await fetch(`/api/${householdId}/smart-home/platforms`);
      if (platformsRes.ok) {
        const data = await platformsRes.json();
        setPlatforms(data.platforms);
      }

      // Load overview
      const overviewRes = await fetch(`/api/${householdId}/smart-home/overview?householdId=${householdId}`);
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setHubs(data.hubs);
      }

      // Load devices
      const devicesRes = await fetch(`/api/${householdId}/smart-home/devices?householdId=${householdId}`);
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.devices);
      }

      // Load automations
      const automationsRes = await fetch(`/api/${householdId}/smart-home/automations?householdId=${householdId}`);
      if (automationsRes.ok) {
        const data = await automationsRes.json();
        setAutomations(data.automations);
      }
    } catch (error) {
      console.error('Failed to load smart home data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnectHub() {
    if (!newHub.platform || !newHub.name) return;

    try {
      const res = await fetch(`/api/${householdId}/smart-home/hubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          platform: newHub.platform,
          name: newHub.name,
          description: newHub.description || undefined,
          configuration: {
            platform: newHub.platform,
            hostUrl: newHub.hostUrl || undefined,
            accessToken: newHub.accessToken || undefined,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHubs([...hubs, data.hub]);
        setDevices([...devices, ...data.devices]);
        setShowAddHub(false);
        setNewHub({ platform: '', name: '', description: '', hostUrl: '', accessToken: '' });
      }
    } catch (error) {
      console.error('Failed to connect hub:', error);
    }
  }

  async function handleControlDevice(deviceId: string, command: { type: string; parameters: Record<string, unknown> }) {
    try {
      const res = await fetch(`/api/${householdId}/smart-home/devices/${deviceId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (res.ok) {
        const data = await res.json();
        setDevices(devices.map(d => d.id === deviceId ? data.device : d));
      }
    } catch (error) {
      console.error('Failed to control device:', error);
    }
  }

  async function handleToggleAutomation(automationId: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/${householdId}/smart-home/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: enabled }),
      });

      if (res.ok) {
        const data = await res.json();
        setAutomations(automations.map(a => a.id === automationId ? data.automation : a));
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  }

  async function handleTriggerAutomation(automationId: string) {
    try {
      const res = await fetch(`/api/${householdId}/smart-home/automations/${automationId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        await res.json();
        // TODO: handle automation trigger
        // Refresh automations to get updated trigger count
        loadData();
      }
    } catch (error) {
      console.error('Failed to trigger automation:', error);
    }
  }

  async function handleDeleteAutomation(automationId: string) {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      const res = await fetch(`/api/${householdId}/smart-home/automations/${automationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAutomations(automations.filter(a => a.id !== automationId));
      }
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  }

  async function handleSyncHub(hubId: string) {
    try {
      const res = await fetch(`/api/${householdId}/smart-home/hubs/${hubId}/sync`, {
        method: 'POST',
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to sync hub:', error);
    }
  }

  async function handleDisconnectHub(hubId: string) {
    if (!confirm('Are you sure you want to disconnect this hub?')) return;

    try {
      const res = await fetch(`/api/${householdId}/smart-home/hubs/${hubId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setHubs(hubs.filter(h => h.id !== hubId));
        setDevices(devices.filter(d => d.hubId !== hubId));
      }
    } catch (error) {
      console.error('Failed to disconnect hub:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading Smart Home...</p>
        </div>
      </div>
    );
  }

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const activeAutomations = automations.filter(a => a.isEnabled).length;
  const connectedHubs = hubs.filter(h => h.status === 'connected').length;

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Smart Home</h1>
            <p className="text-white/80">
              Connect and control your smart devices, automate chore-related tasks
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-1">🏠</div>
            <div className="text-sm text-white/70">{connectedHubs} hubs</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{hubs.length}</div>
            <div className="text-xs text-white/70">Hubs</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{devices.length}</div>
            <div className="text-xs text-white/70">Devices</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{onlineDevices}</div>
            <div className="text-xs text-white/70">Online</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{activeAutomations}</div>
            <div className="text-xs text-white/70">Automations</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'devices', label: 'Devices', icon: '💡' },
          { id: 'automations', label: 'Automations', icon: '🤖' },
          { id: 'hubs', label: 'Hubs', icon: '🔌' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick access devices */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quick Controls</h2>
              <button
                onClick={() => setActiveTab('devices')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </button>
            </div>
            {devices.length > 0 ? (
              <DeviceGrid
                devices={devices.slice(0, 6)}
                onControl={handleControlDevice}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">
                No devices connected. Add a hub to get started.
              </p>
            )}
          </div>

          {/* Recent automations */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Active Automations</h2>
              <button
                onClick={() => setActiveTab('automations')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage →
              </button>
            </div>
            {automations.filter(a => a.isEnabled).length > 0 ? (
              <AutomationList
                automations={automations.filter(a => a.isEnabled).slice(0, 3)}
                onToggle={handleToggleAutomation}
                onTrigger={handleTriggerAutomation}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">
                No active automations. Create one to automate tasks.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">All Devices</h2>
          <DeviceGrid
            devices={devices}
            onControl={handleControlDevice}
          />
        </div>
      )}

      {activeTab === 'automations' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Automations</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              + New Automation
            </button>
          </div>
          <AutomationList
            automations={automations}
            onToggle={handleToggleAutomation}
            onDelete={handleDeleteAutomation}
            onTrigger={handleTriggerAutomation}
          />
        </div>
      )}

      {activeTab === 'hubs' && (
        <div className="space-y-6">
          {/* Connected hubs */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Connected Hubs</h2>
              <button
                onClick={() => setShowAddHub(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Hub
              </button>
            </div>

            {hubs.length > 0 ? (
              <div className="space-y-4">
                {hubs.map((hub) => (
                  <div
                    key={hub.id}
                    className="flex items-center justify-between p-4 border rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">
                          {hub.platform === 'home_assistant' ? '🏠' :
                           hub.platform === 'smartthings' ? '📱' :
                           hub.platform === 'google_home' ? '🔵' :
                           hub.platform === 'amazon_alexa' ? '🔊' : '🔌'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{hub.name}</h3>
                        <p className="text-sm text-gray-500">
                          {platforms.find(p => p.id === hub.platform)?.name || hub.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          hub.status === 'connected' && 'bg-green-100 text-green-700',
                          hub.status === 'disconnected' && 'bg-gray-100 text-gray-700',
                          hub.status === 'error' && 'bg-red-100 text-red-700',
                          hub.status === 'pending' && 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {hub.status}
                      </span>
                      <button
                        onClick={() => handleSyncHub(hub.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Sync devices"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => handleDisconnectHub(hub.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Disconnect"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hubs connected. Add one to start controlling your smart home.
              </p>
            )}
          </div>

          {/* Available platforms */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Supported Platforms</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="p-4 border rounded-xl text-center hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => {
                    setNewHub({ ...newHub, platform: platform.id, name: platform.name });
                    setShowAddHub(true);
                  }}
                >
                  <span className="text-3xl mb-2 block">
                    {platform.id === 'home_assistant' ? '🏠' :
                     platform.id === 'smartthings' ? '📱' :
                     platform.id === 'google_home' ? '🔵' :
                     platform.id === 'amazon_alexa' ? '🔊' :
                     platform.id === 'apple_homekit' ? '🍎' :
                     platform.id === 'hubitat' ? '🔷' :
                     platform.id === 'generic_mqtt' ? '📡' : '🌐'}
                  </span>
                  <h3 className="font-medium text-gray-900 text-sm">{platform.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Hub Modal */}
      {showAddHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Connect Smart Home Hub</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={newHub.platform}
                  onChange={(e) => setNewHub({ ...newHub, platform: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="">Select platform...</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newHub.name}
                  onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                  placeholder="My Home Hub"
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              {platforms.find(p => p.id === newHub.platform)?.requiresUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host URL</label>
                  <input
                    type="url"
                    value={newHub.hostUrl}
                    onChange={(e) => setNewHub({ ...newHub, hostUrl: e.target.value })}
                    placeholder="http://192.168.1.100:8123"
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              )}

              {platforms.find(p => p.id === newHub.platform)?.requiresToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                  <input
                    type="password"
                    value={newHub.accessToken}
                    onChange={(e) => setNewHub({ ...newHub, accessToken: e.target.value })}
                    placeholder="Your access token"
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newHub.description}
                  onChange={(e) => setNewHub({ ...newHub, description: e.target.value })}
                  placeholder="Main home hub"
                  className="w-full p-3 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddHub(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectHub}
                disabled={!newHub.platform || !newHub.name}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartHome;
