import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@chorechamp/ui';
import { QRCodeList } from '../components/qr-verification/QRCodeCard';
import {
  ScanHistoryList,
  ScanStatsSummary,
} from '../components/qr-verification/ScanHistory';
import { QR_CODE_TEMPLATES } from '@chorechamp/types';
import {
  useQRCodes,
  useQRScans,
  useQRCheckpoints,
  useCreateQRCode,
} from '@chorechamp/api-client';

interface QRCode {
  id: string;
  type: string;
  name: string;
  description: string | null;
  status: string;
  codeData: string;
  codeUrl: string;
  locationName: string | null;
  linkedZoneName: string | null;
  verificationRequirement: string;
  requiresPhoto: boolean;
  totalScans: number;
  lastScannedAt: Date | null;
  checkpointOrder: number | null;
  checkpointGroupId: string | null;
}

interface QRCodeScan {
  id: string;
  qrCodeId: string;
  memberId: string;
  scannedAt: Date;
  verificationStatus: 'success' | 'failed' | 'pending';
  failureReason: string | null;
  gpsVerified: boolean | null;
  gpsDistanceMeters: number | null;
  photoUrl: string | null;
  bonusPointsAwarded: number;
  qrCode?: { id: string; name: string; type: string };
  member?: { id: string; name: string };
}

interface Checkpoint {
  id: string;
  name: string;
  completed: boolean;
}

interface CheckpointProgress {
  id: string;
  checkpointGroupId: string;
  status: 'in_progress' | 'completed' | 'not_started';
  member: { id: string; name: string };
  startedAt: string;
  checkpoints: Checkpoint[];
  completedCheckpoints: number;
  totalCheckpoints: number;
}

interface EquipmentCheckout {
  id: string;
  equipmentName: string;
  status: 'checked_out' | 'checked_in';
  member: { id: string; name: string };
  checkedOutAt: string;
  conditionOnCheckout: 'good' | 'fair' | 'poor';
}

interface ScanStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  successRate: number;
  totalPointsAwarded: number;
}

interface CheckpointsResponse {
  checkpointProgress: CheckpointProgress[];
  equipmentCheckouts: EquipmentCheckout[];
  stats: ScanStats;
}

type TabId = 'overview' | 'codes' | 'scans' | 'checkpoints' | 'equipment';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'codes', label: 'QR Codes', icon: '📱' },
  { id: 'scans', label: 'Scan History', icon: '📜' },
  { id: 'checkpoints', label: 'Checkpoints', icon: '🏁' },
  { id: 'equipment', label: 'Equipment', icon: '🧹' },
];

function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <span className="text-red-600 font-medium">Error: </span>
      <span className="text-red-500">{message}</span>
    </div>
  );
}

export function QRVerification() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: qrCodesData,
    isLoading: codesLoading,
    error: codesError,
  } = useQRCodes(householdId!);

  const {
    data: scansData,
    isLoading: scansLoading,
    error: scansError,
  } = useQRScans(householdId!);

  const {
    data: checkpointsData,
    isLoading: checkpointsLoading,
    error: checkpointsError,
  } = useQRCheckpoints(householdId!);

  const { mutate: createQRCode, isPending: isCreating } = useCreateQRCode(householdId!);

  const qrCodes = (qrCodesData as QRCode[] | undefined) ?? [];
  const scans = (scansData as QRCodeScan[] | undefined) ?? [];
  const checkpointsTyped = checkpointsData as unknown as CheckpointsResponse | undefined;
  const checkpointProgress: CheckpointProgress[] = checkpointsTyped?.checkpointProgress ?? [];
  const equipmentCheckouts: EquipmentCheckout[] = checkpointsTyped?.equipmentCheckouts ?? [];
  const defaultStats: ScanStats = {
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    successRate: 0,
    totalPointsAwarded: 0,
  };
  const stats: ScanStats = checkpointsTyped?.stats ?? defaultStats;

  const hasError = codesError || scansError || checkpointsError;
  const errorMessage = (codesError || scansError || checkpointsError)?.message ?? 'Something went wrong';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Verification</h1>
          <p className="text-gray-500">
            Verify chore completion with QR code scanning
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={isCreating}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : '+ Create QR Code'}
        </button>
      </div>

      {/* Global Error */}
      {hasError && <div className="mb-6"><ErrorBanner message={errorMessage} /></div>}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
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
          {/* Stats */}
          {checkpointsLoading ? (
            <LoadingSkeleton lines={1} />
          ) : (
            <ScanStatsSummary stats={stats} />
          )}

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('codes')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">📱</div>
                <div className="font-medium">Manage Codes</div>
                <div className="text-sm text-white/80">
                  {codesLoading ? '...' : `${qrCodes.length} codes`}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('scans')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">📜</div>
                <div className="font-medium">View Scans</div>
                <div className="text-sm text-white/80">
                  {scansLoading ? '...' : `${scans.length} recent`}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('checkpoints')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🏁</div>
                <div className="font-medium">Checkpoints</div>
                <div className="text-sm text-white/80">
                  {checkpointsLoading
                    ? '...'
                    : `${checkpointProgress.filter((p: CheckpointProgress) => p.status === 'in_progress').length} active`}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🧹</div>
                <div className="font-medium">Equipment</div>
                <div className="text-sm text-white/80">
                  {checkpointsLoading
                    ? '...'
                    : `${equipmentCheckouts.filter((e: EquipmentCheckout) => e.status === 'checked_out').length} out`}
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Scans</h2>
              {scansLoading ? (
                <LoadingSkeleton lines={4} />
              ) : (
                <div className="space-y-3">
                  {scans.slice(0, 4).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {scan.verificationStatus === 'success' ? '✅' : '❌'}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {scan.qrCode?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scan.member?.name}
                          </div>
                        </div>
                      </div>
                      {scan.bonusPointsAwarded > 0 && (
                        <span className="text-green-600 font-medium">
                          +{scan.bonusPointsAwarded}
                        </span>
                      )}
                    </div>
                  ))}
                  {scans.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No scans yet</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">In Progress</h2>
              {checkpointsLoading ? (
                <LoadingSkeleton lines={3} />
              ) : (
                <div className="space-y-3">
                  {checkpointProgress.map((progress) => (
                    <div
                      key={progress.id}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {progress.checkpointGroupId.replace('-', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {progress.member.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {progress.checkpoints.map((cp) => (
                          <div
                            key={cp.id}
                            className={cn(
                              'flex-1 h-2 rounded-full',
                              cp.completed ? 'bg-green-500' : 'bg-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {progress.completedCheckpoints} of {progress.totalCheckpoints} complete
                      </div>
                    </div>
                  ))}
                  {equipmentCheckouts
                    .filter((e) => e.status === 'checked_out')
                    .map((checkout) => (
                      <div
                        key={checkout.id}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">
                              {checkout.equipmentName}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              checked out by {checkout.member.name}
                            </span>
                          </div>
                          <span className="text-xs text-blue-600">
                            {Math.round(
                              (Date.now() - new Date(checkout.checkedOutAt).getTime()) /
                                (1000 * 60 * 60)
                            )}h ago
                          </span>
                        </div>
                      </div>
                    ))}
                  {checkpointProgress.length === 0 && equipmentCheckouts.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Nothing in progress</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'codes' && (
        codesLoading ? (
          <LoadingSkeleton lines={5} />
        ) : (
          <QRCodeList
            qrCodes={qrCodes}
            onView={(id) => console.log('View', id)}
            onEdit={(id) => console.log('Edit', id)}
            onDelete={(id) => console.log('Delete', id)}
            onRegenerate={(id) => console.log('Regenerate', id)}
            onDownload={(id) => console.log('Download', id)}
          />
        )
      )}

      {activeTab === 'scans' && (
        scansLoading ? (
          <LoadingSkeleton lines={5} />
        ) : (
          <ScanHistoryList scans={scans} />
        )
      )}

      {activeTab === 'checkpoints' && (
        <div className="space-y-4">
          {checkpointsLoading ? (
            <LoadingSkeleton lines={3} />
          ) : checkpointProgress.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">🏁</span>
              <p className="text-gray-500">No checkpoint progress</p>
              <p className="text-sm text-gray-400">
                Start scanning checkpoint QR codes to track progress
              </p>
            </div>
          ) : (
            checkpointProgress.map((progress) => (
              <div
                key={progress.id}
                className="bg-white rounded-xl border p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {progress.checkpointGroupId.replace('-', ' ')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {progress.member.name} •{' '}
                      {new Date(progress.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      progress.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : progress.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {progress.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2">
                  {progress.checkpoints.map((cp, index) => (
                    <div
                      key={cp.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        cp.completed ? 'bg-green-50' : 'bg-gray-50'
                      )}
                    >
                      <span className="text-xl">
                        {cp.completed ? '✅' : '⬜'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Step {index + 1}: {cp.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {progress.completedCheckpoints} of {progress.totalCheckpoints} complete
                    </span>
                    <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            (progress.completedCheckpoints / progress.totalCheckpoints) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(
                        (progress.completedCheckpoints / progress.totalCheckpoints) * 100
                      )}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="space-y-4">
          {checkpointsLoading ? (
            <LoadingSkeleton lines={3} />
          ) : equipmentCheckouts.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">🧹</span>
              <p className="text-gray-500">No equipment checkouts</p>
              <p className="text-sm text-gray-400">
                Scan equipment QR codes to track borrowing
              </p>
            </div>
          ) : (
            <>
              {/* Current Checkouts */}
              <h2 className="text-lg font-semibold text-gray-900">Currently Out</h2>
              {equipmentCheckouts
                .filter((e) => e.status === 'checked_out')
                .map((checkout) => (
                  <div
                    key={checkout.id}
                    className="bg-white rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🧹</span>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {checkout.equipmentName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Checked out by {checkout.member.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(checkout.checkedOutAt).toLocaleString()}
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            checkout.conditionOnCheckout === 'good'
                              ? 'bg-green-100 text-green-700'
                              : checkout.conditionOnCheckout === 'fair'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {checkout.conditionOnCheckout}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Check In
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Create QR Code
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <p className="text-gray-500 mb-4">
              Choose a template or create a custom QR code.
            </p>

            <div className="space-y-3">
              {QR_CODE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  disabled={isCreating}
                  onClick={() => {
                    createQRCode(
                      {
                        householdId: householdId!,
                        templateId: template.id,
                        type: template.type,
                        name: template.name,
                        requiresPhoto: template.requiresPhoto,
                      },
                      {
                        onSuccess: () => setShowCreateModal(false),
                      }
                    );
                  }}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {template.type.replace(/_/g, ' ')}
                      </span>
                      {template.requiresPhoto && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                          Photo
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </button>
              ))}

              <button
                disabled={isCreating}
                onClick={() => {
                  createQRCode(
                    {
                      householdId: householdId!,
                      type: 'custom',
                      name: 'Custom QR Code',
                    },
                    {
                      onSuccess: () => setShowCreateModal(false),
                    }
                  );
                }}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Custom QR Code</h3>
                    <p className="text-sm text-gray-500">
                      Create with full customization options
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
