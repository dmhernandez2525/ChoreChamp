import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@chorechamp/ui';
import {
  useDetectionRules,
  useDetectionEvents,
  useCleanlinessMetrics,
  useDetectionAnalytics,
  useCreateDetectionRule,
  useUpdateDetectionRule,
  useDeleteDetectionRule,
  useConfirmDetectionEvent,
} from '@chorechamp/api-client';
import { DetectionRuleList } from '../components/chore-detection/DetectionRuleCard';
import {
  DetectionEventList,
  PendingDetections,
} from '../components/chore-detection/DetectionEventCard';
import {
  CleanlinessGrid,
  CleanlinessSummary,
} from '../components/chore-detection/CleanlinessScore';
import {
  DETECTION_TEMPLATES,
  type DetectionEvent,
  type DetectionRule,
  type CleanlinessMetric,
  type DetectionAnalytics,
} from '@chorechamp/types';

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

function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <div className="font-medium">Something went wrong</div>
      <div className="text-sm mt-1">{message}</div>
    </div>
  );
}

export function ChoreDetection() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showTemplates, setShowTemplates] = useState(false);

  const {
    data: rules,
    isLoading: rulesLoading,
    error: rulesError,
  } = useDetectionRules(householdId!);

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useDetectionEvents(householdId!);

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useCleanlinessMetrics(householdId!);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useDetectionAnalytics(householdId!);

  const { mutate: createRule, isPending: isCreating } = useCreateDetectionRule(householdId!);
  const { mutate: updateRule } = useUpdateDetectionRule(householdId!);
  const { mutate: deleteRule } = useDeleteDetectionRule(householdId!);
  const { mutate: confirmEvent } = useConfirmDetectionEvent(householdId!);

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateRule({ ruleId, isEnabled: enabled });
  };

  const handleConfirmEvent = (eventId: string, wasAccurate: boolean) => {
    confirmEvent({ eventId, wasAccurate });
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRule(ruleId);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const template = DETECTION_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      createRule({
        name: template.name,
        description: template.description,
        sensorType: template.sensorType,
        choreType: template.choreType,
        detectionMode: template.detectionMode,
        conditions: template.conditions,
      });
    }
    setShowTemplates(false);
  };

  const safeRules = Array.isArray(rules) ? (rules as DetectionRule[]) : [];
  const safeEvents = Array.isArray(events) ? (events as DetectionEvent[]) : [];
  const safeMetrics = Array.isArray(metrics) ? (metrics as CleanlinessMetric[]) : [];
  const safeAnalytics = (analytics && typeof analytics === 'object' && 'totalDetections' in (analytics as object)) ? (analytics as DetectionAnalytics) : {
    totalDetections: 0,
    confirmedCompletions: 0,
    suggestedNeeds: 0,
    falsePositives: 0,
    accuracyRate: 0,
    totalBonusPointsAwarded: 0,
    byChoreType: [],
    byZone: [],
    recentDetections: [],
  } as unknown as DetectionAnalytics;

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
          disabled={isCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : '+ Add Rule'}
        </button>
      </div>

      {/* Pending Detections Banner */}
      {eventsLoading ? (
        <div className="mb-6">
          <LoadingSkeleton lines={1} />
        </div>
      ) : eventsError ? (
        <div className="mb-6">
          <ErrorBanner message="Failed to load detection events." />
        </div>
      ) : (
        <PendingDetections
          events={safeEvents}
          onConfirm={handleConfirmEvent}
          className="mb-6"
        />
      )}

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
          {metricsLoading ? (
            <LoadingSkeleton lines={2} />
          ) : metricsError ? (
            <ErrorBanner message="Failed to load cleanliness metrics." />
          ) : (
            <CleanlinessSummary metrics={safeMetrics} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Detections</h2>
              {eventsLoading ? (
                <LoadingSkeleton lines={3} />
              ) : eventsError ? (
                <ErrorBanner message="Failed to load recent detections." />
              ) : (
                <div className="space-y-3">
                  {safeEvents.slice(0, 3).map((event) => (
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
                  {safeEvents.length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      No detections yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">This Month</h2>
              {analyticsLoading ? (
                <LoadingSkeleton lines={2} />
              ) : analyticsError ? (
                <ErrorBanner message="Failed to load analytics." />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700">
                      {safeAnalytics.confirmedCompletions}
                    </div>
                    <div className="text-sm text-green-600">Chores Detected</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-700">
                      {safeAnalytics.totalBonusPointsAwarded}
                    </div>
                    <div className="text-sm text-blue-600">Bonus Points</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-700">
                      {safeAnalytics.accuracyRate}%
                    </div>
                    <div className="text-sm text-purple-600">Accuracy</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-700">
                      {safeRules.filter((r) => r.isEnabled).length}
                    </div>
                    <div className="text-sm text-orange-600">Active Rules</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <>
          {rulesLoading ? (
            <LoadingSkeleton lines={4} />
          ) : rulesError ? (
            <ErrorBanner message="Failed to load detection rules." />
          ) : (
            <DetectionRuleList
              rules={safeRules}
              onToggle={handleToggleRule}
              onEdit={(id) => updateRule({ ruleId: id })}
              onDelete={handleDeleteRule}
              onTest={(id) => updateRule({ ruleId: id, testRun: true })}
            />
          )}
        </>
      )}

      {activeTab === 'events' && (
        <>
          {eventsLoading ? (
            <LoadingSkeleton lines={4} />
          ) : eventsError ? (
            <ErrorBanner message="Failed to load detection events." />
          ) : (
            <DetectionEventList events={safeEvents} onConfirm={handleConfirmEvent} />
          )}
        </>
      )}

      {activeTab === 'zones' && (
        <>
          {metricsLoading ? (
            <LoadingSkeleton lines={4} />
          ) : metricsError ? (
            <ErrorBanner message="Failed to load zone metrics." />
          ) : (
            <CleanlinessGrid
              metrics={safeMetrics}
              onZoneClick={(_zone) => setActiveTab('analytics')}
            />
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <LoadingSkeleton lines={6} />
          ) : analyticsError ? (
            <ErrorBanner message="Failed to load analytics data." />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Detections</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {safeAnalytics.totalDetections}
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-sm text-gray-500 mb-1">Accuracy Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {safeAnalytics.accuracyRate}%
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-sm text-gray-500 mb-1">False Positives</div>
                  <div className="text-2xl font-bold text-red-600">
                    {safeAnalytics.falsePositives}
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-sm text-gray-500 mb-1">Points Awarded</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {safeAnalytics.totalBonusPointsAwarded}
                  </div>
                </div>
              </div>

              {/* By Chore Type */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">By Chore Type</h3>
                <div className="space-y-3">
                  {(safeAnalytics.byChoreType ?? []).map((item) => (
                    <div key={item.choreType} className="flex items-center gap-4">
                      <div className="w-32 font-medium text-gray-700">
                        {item.choreType.replace(/_/g, ' ')}
                      </div>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${safeAnalytics.totalDetections > 0 ? (item.detections / safeAnalytics.totalDetections) * 100 : 0}%`,
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
                  {(safeAnalytics.byChoreType ?? []).length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      No chore type data yet
                    </div>
                  )}
                </div>
              </div>

              {/* By Zone */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">By Zone</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(safeAnalytics.byZone ?? []).map((item) => (
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
                  {(safeAnalytics.byZone ?? []).length === 0 && (
                    <div className="text-center text-gray-400 py-4 col-span-2">
                      No zone data yet
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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
                  disabled={isCreating}
                  onClick={() => handleCreateFromTemplate(template.id)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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
                  createRule({});
                  setShowTemplates(false);
                }}
                disabled={isCreating}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
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
