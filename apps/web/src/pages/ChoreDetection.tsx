import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import { DetectionRuleList } from '../components/chore-detection/DetectionRuleCard';
import {
  DetectionEventList,
  PendingDetections,
} from '../components/chore-detection/DetectionEventCard';
import {
  CleanlinessGrid,
  CleanlinessSummary,
} from '../components/chore-detection/CleanlinessScore';
import { DETECTION_TEMPLATES } from '@chorechamp/types';

type TabId = 'overview' | 'rules' | 'events' | 'zones' | 'analytics';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'rules', label: 'Rules', icon: '⚙️' },
  { id: 'events', label: 'Events', icon: '📋' },
  { id: 'zones', label: 'Zones', icon: '🏠' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

// Mock data for demonstration
const mockRules = [
  {
    id: '1',
    name: 'Robot Vacuum Completed',
    description: 'Detect when the robot vacuum finishes cleaning',
    isEnabled: true,
    deviceId: 'device-1',
    sensorType: 'vacuum_state',
    conditions: [
      { sensorAttribute: 'vacuumState', operator: 'changed_to', value: 'idle' },
    ],
    conditionLogic: 'all' as const,
    choreType: 'vacuuming',
    zoneName: 'Living Room',
    detectionMode: 'completion' as const,
    completionConfidence: 90,
    requireManualConfirm: false,
    cooldownMinutes: 60,
    bonusPointsOnAutoDetect: 5,
    device: { id: 'device-1', name: 'Roomba i7', category: 'vacuum' },
  },
  {
    id: '2',
    name: 'Dishwasher Cycle Done',
    description: 'Detect when dishwasher completes',
    isEnabled: true,
    deviceId: 'device-2',
    sensorType: 'appliance_state',
    conditions: [
      { sensorAttribute: 'power', operator: 'less_than', value: 5 },
    ],
    conditionLogic: 'all' as const,
    choreType: 'dishes',
    zoneName: 'Kitchen',
    detectionMode: 'completion' as const,
    completionConfidence: 85,
    requireManualConfirm: true,
    cooldownMinutes: 120,
    bonusPointsOnAutoDetect: 5,
    device: { id: 'device-2', name: 'Dishwasher Plug', category: 'appliance' },
  },
  {
    id: '3',
    name: 'High Dust Level Alert',
    description: 'Alert when air quality indicates dusting needed',
    isEnabled: false,
    deviceId: 'device-3',
    sensorType: 'air_quality',
    conditions: [
      { sensorAttribute: 'pm25', operator: 'greater_than', value: 35 },
    ],
    conditionLogic: 'all' as const,
    choreType: 'dusting',
    zoneName: 'Bedroom',
    detectionMode: 'needed' as const,
    completionConfidence: 75,
    requireManualConfirm: false,
    cooldownMinutes: 1440,
    bonusPointsOnAutoDetect: 0,
    device: { id: 'device-3', name: 'Air Quality Monitor', category: 'sensor' },
  },
];

const mockEvents = [
  {
    id: '1',
    ruleId: '1',
    eventType: 'completion_detected' as const,
    choreType: 'vacuuming',
    zoneName: 'Living Room',
    sensorData: { vacuumState: 'idle', battery: 85, cleanedArea: 45 },
    confidence: 92,
    wasConfirmed: null,
    confirmedBy: null,
    pointsAwarded: 5,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    processedAt: null,
    rule: { id: '1', name: 'Robot Vacuum Completed' },
    device: { id: 'device-1', name: 'Roomba i7' },
  },
  {
    id: '2',
    ruleId: '2',
    eventType: 'completion_detected' as const,
    choreType: 'dishes',
    zoneName: 'Kitchen',
    sensorData: { power: 2.5, duration: 3600 },
    confidence: 88,
    wasConfirmed: true,
    confirmedBy: 'member-1',
    pointsAwarded: 5,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    processedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    rule: { id: '2', name: 'Dishwasher Cycle Done' },
    device: { id: 'device-2', name: 'Dishwasher Plug' },
  },
  {
    id: '3',
    ruleId: '1',
    eventType: 'completion_detected' as const,
    choreType: 'vacuuming',
    zoneName: 'Living Room',
    sensorData: { vacuumState: 'idle', battery: 90, cleanedArea: 48 },
    confidence: 94,
    wasConfirmed: true,
    confirmedBy: null,
    pointsAwarded: 5,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    processedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    rule: { id: '1', name: 'Robot Vacuum Completed' },
    device: { id: 'device-1', name: 'Roomba i7' },
  },
];

const mockMetrics = [
  {
    id: '1',
    zoneName: 'Living Room',
    overallScore: 85,
    dustLevel: 15,
    humidityLevel: 45,
    lastMotionAt: new Date(Date.now() - 30 * 60 * 1000),
    lastCleanedAt: new Date(Date.now() - 30 * 60 * 1000),
    suggestedChores: [],
    updatedAt: new Date(),
  },
  {
    id: '2',
    zoneName: 'Kitchen',
    overallScore: 72,
    dustLevel: 20,
    humidityLevel: 55,
    lastMotionAt: new Date(Date.now() - 15 * 60 * 1000),
    lastCleanedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    suggestedChores: [
      { choreType: 'dishes', urgency: 'medium' as const, reason: 'Dishwasher available' },
    ],
    updatedAt: new Date(),
  },
  {
    id: '3',
    zoneName: 'Bathroom',
    overallScore: 58,
    dustLevel: null,
    humidityLevel: 72,
    lastMotionAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastCleanedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    suggestedChores: [
      { choreType: 'bathroom_cleaning', urgency: 'high' as const, reason: 'Not cleaned in 3 days' },
    ],
    updatedAt: new Date(),
  },
  {
    id: '4',
    zoneName: 'Bedroom',
    overallScore: 45,
    dustLevel: 42,
    humidityLevel: 40,
    lastMotionAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    lastCleanedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    suggestedChores: [
      { choreType: 'dusting', urgency: 'high' as const, reason: 'High dust level detected' },
      { choreType: 'vacuuming', urgency: 'medium' as const, reason: 'Last vacuumed 7 days ago' },
    ],
    updatedAt: new Date(),
  },
];

const mockAnalytics = {
  totalDetections: 47,
  confirmedCompletions: 38,
  suggestedNeeds: 12,
  falsePositives: 4,
  accuracyRate: 91,
  totalBonusPointsAwarded: 185,
  byChoreType: [
    { choreType: 'vacuuming', detections: 24, accuracy: 96 },
    { choreType: 'dishes', detections: 15, accuracy: 87 },
    { choreType: 'laundry', detections: 8, accuracy: 88 },
  ],
  byZone: mockMetrics.map((m) => ({
    zoneName: m.zoneName,
    cleanlinessScore: m.overallScore,
    detections: Math.floor(Math.random() * 20) + 5,
  })),
};

export function ChoreDetection() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    console.log('Toggle rule', ruleId, enabled);
    // API call would go here
  };

  const handleConfirmEvent = (eventId: string, wasAccurate: boolean) => {
    console.log('Confirm event', eventId, wasAccurate);
    // API call would go here
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chore Detection</h1>
          <p className="text-gray-500">
            Automatically detect chore completion with smart sensors
          </p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Rule
        </button>
      </div>

      {/* Pending Detections Banner */}
      <PendingDetections
        events={mockEvents}
        onConfirm={handleConfirmEvent}
        className="mb-6"
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
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
          <CleanlinessSummary metrics={mockMetrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Detections</h2>
              <div className="space-y-3">
                {mockEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {event.eventType === 'completion_detected' ? '✅' : '⚠️'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.choreType.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-500">{event.zoneName}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.wasConfirmed === null
                        ? 'Pending'
                        : event.wasConfirmed
                        ? 'Confirmed'
                        : 'Rejected'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">This Month</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-700">
                    {mockAnalytics.confirmedCompletions}
                  </div>
                  <div className="text-sm text-green-600">Chores Detected</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-700">
                    {mockAnalytics.totalBonusPointsAwarded}
                  </div>
                  <div className="text-sm text-blue-600">Bonus Points</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-700">
                    {mockAnalytics.accuracyRate}%
                  </div>
                  <div className="text-sm text-purple-600">Accuracy</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-700">
                    {mockRules.filter((r) => r.isEnabled).length}
                  </div>
                  <div className="text-sm text-orange-600">Active Rules</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <DetectionRuleList
          rules={mockRules}
          onToggle={handleToggleRule}
          onEdit={(id) => console.log('Edit', id)}
          onDelete={(id) => console.log('Delete', id)}
          onTest={(id) => console.log('Test', id)}
        />
      )}

      {activeTab === 'events' && (
        <DetectionEventList events={mockEvents} onConfirm={handleConfirmEvent} />
      )}

      {activeTab === 'zones' && (
        <CleanlinessGrid
          metrics={mockMetrics}
          onZoneClick={(zone) => console.log('Zone clicked', zone)}
        />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">Total Detections</div>
              <div className="text-2xl font-bold text-gray-900">
                {mockAnalytics.totalDetections}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">Accuracy Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {mockAnalytics.accuracyRate}%
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">False Positives</div>
              <div className="text-2xl font-bold text-red-600">
                {mockAnalytics.falsePositives}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">Points Awarded</div>
              <div className="text-2xl font-bold text-blue-600">
                {mockAnalytics.totalBonusPointsAwarded}
              </div>
            </div>
          </div>

          {/* By Chore Type */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">By Chore Type</h3>
            <div className="space-y-3">
              {mockAnalytics.byChoreType.map((item) => (
                <div key={item.choreType} className="flex items-center gap-4">
                  <div className="w-32 font-medium text-gray-700">
                    {item.choreType.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(item.detections / mockAnalytics.totalDetections) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-gray-500">
                    {item.detections}
                  </div>
                  <div className="w-16 text-right text-sm text-green-600">
                    {item.accuracy}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Zone */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">By Zone</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockAnalytics.byZone.map((item) => (
                <div
                  key={item.zoneName}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.zoneName}</div>
                    <div className="text-sm text-gray-500">
                      {item.detections} detections
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-xl font-bold',
                      item.cleanlinessScore >= 80
                        ? 'text-green-600'
                        : item.cleanlinessScore >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    )}
                  >
                    {item.cleanlinessScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Detection Rule
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <p className="text-gray-500 mb-4">
              Choose a template to get started quickly, or create a custom rule.
            </p>

            <div className="space-y-3">
              {DETECTION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    console.log('Selected template', template.id);
                    setShowTemplates(false);
                  }}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        template.detectionMode === 'completion'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      )}
                    >
                      {template.detectionMode}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>Sensor: {template.sensorType}</span>
                    <span>Chore: {template.choreType}</span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  console.log('Create custom rule');
                  setShowTemplates(false);
                }}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Custom Rule</h3>
                    <p className="text-sm text-gray-500">
                      Create a rule from scratch with full configuration
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
