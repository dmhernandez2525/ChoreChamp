import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import { QRCodeList } from '../components/qr-verification/QRCodeCard';
import {
  ScanHistoryList,
  ScanStatsSummary,
} from '../components/qr-verification/ScanHistory';
import { QR_CODE_TEMPLATES } from '@chorechamp/types';

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

// Mock data for demonstration
const mockQRCodes = [
  {
    id: '1',
    type: 'task_station',
    name: 'Kitchen Cleaning Station',
    description: 'Scan before and after cleaning the kitchen',
    status: 'active',
    codeData: 'abc123',
    codeUrl: 'chorechamp://qr/abc123',
    locationName: 'Kitchen',
    linkedZoneName: 'Kitchen',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    totalScans: 24,
    lastScannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    checkpointOrder: null,
    checkpointGroupId: null,
  },
  {
    id: '2',
    type: 'location',
    name: 'Trash Can Area',
    description: 'Scan after taking out trash',
    status: 'active',
    codeData: 'def456',
    codeUrl: 'chorechamp://qr/def456',
    locationName: 'Garage',
    linkedZoneName: null,
    verificationRequirement: 'gps_verified',
    requiresPhoto: false,
    totalScans: 18,
    lastScannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    checkpointOrder: null,
    checkpointGroupId: null,
  },
  {
    id: '3',
    type: 'equipment',
    name: 'Vacuum Cleaner',
    description: 'Check out and return the vacuum',
    status: 'active',
    codeData: 'ghi789',
    codeUrl: 'chorechamp://qr/ghi789',
    locationName: 'Closet',
    linkedZoneName: null,
    verificationRequirement: 'scan_only',
    requiresPhoto: false,
    totalScans: 12,
    lastScannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    checkpointOrder: null,
    checkpointGroupId: null,
  },
  {
    id: '4',
    type: 'checkpoint',
    name: 'Bedroom - Bed Made',
    description: 'First checkpoint: verify bed is made',
    status: 'active',
    codeData: 'jkl012',
    codeUrl: 'chorechamp://qr/jkl012',
    locationName: "Kid's Bedroom",
    linkedZoneName: 'Bedroom',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    totalScans: 8,
    lastScannedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    checkpointOrder: 1,
    checkpointGroupId: 'bedroom-clean',
  },
  {
    id: '5',
    type: 'checkpoint',
    name: 'Bedroom - Floor Clear',
    description: 'Second checkpoint: verify floor is clear',
    status: 'active',
    codeData: 'mno345',
    codeUrl: 'chorechamp://qr/mno345',
    locationName: "Kid's Bedroom",
    linkedZoneName: 'Bedroom',
    verificationRequirement: 'scan_and_photo',
    requiresPhoto: true,
    totalScans: 6,
    lastScannedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    checkpointOrder: 2,
    checkpointGroupId: 'bedroom-clean',
  },
];

const mockScans = [
  {
    id: '1',
    qrCodeId: '1',
    memberId: 'member-1',
    scannedAt: new Date(Date.now() - 30 * 60 * 1000),
    verificationStatus: 'success' as const,
    failureReason: null,
    gpsVerified: null,
    gpsDistanceMeters: null,
    photoUrl: 'https://example.com/photo1.jpg',
    bonusPointsAwarded: 5,
    qrCode: { id: '1', name: 'Kitchen Cleaning Station', type: 'task_station' },
    member: { id: 'member-1', name: 'Emma' },
  },
  {
    id: '2',
    qrCodeId: '2',
    memberId: 'member-2',
    scannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    verificationStatus: 'success' as const,
    failureReason: null,
    gpsVerified: true,
    gpsDistanceMeters: 8.5,
    photoUrl: null,
    bonusPointsAwarded: 5,
    qrCode: { id: '2', name: 'Trash Can Area', type: 'location' },
    member: { id: 'member-2', name: 'Jake' },
  },
  {
    id: '3',
    qrCodeId: '2',
    memberId: 'member-1',
    scannedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    verificationStatus: 'failed' as const,
    failureReason: 'Too far from location (45m away, max 20m)',
    gpsVerified: false,
    gpsDistanceMeters: 45,
    photoUrl: null,
    bonusPointsAwarded: 0,
    qrCode: { id: '2', name: 'Trash Can Area', type: 'location' },
    member: { id: 'member-1', name: 'Emma' },
  },
  {
    id: '4',
    qrCodeId: '4',
    memberId: 'member-1',
    scannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    verificationStatus: 'success' as const,
    failureReason: null,
    gpsVerified: null,
    gpsDistanceMeters: null,
    photoUrl: 'https://example.com/photo2.jpg',
    bonusPointsAwarded: 5,
    qrCode: { id: '4', name: 'Bedroom - Bed Made', type: 'checkpoint' },
    member: { id: 'member-1', name: 'Emma' },
  },
];

const mockCheckpointProgress = [
  {
    id: '1',
    memberId: 'member-1',
    checkpointGroupId: 'bedroom-clean',
    totalCheckpoints: 2,
    completedCheckpoints: 1,
    status: 'in_progress',
    startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    checkpoints: [
      { id: '4', name: 'Bedroom - Bed Made', checkpointOrder: 1, completed: true },
      { id: '5', name: 'Bedroom - Floor Clear', checkpointOrder: 2, completed: false },
    ],
    member: { name: 'Emma' },
  },
];

const mockEquipmentCheckouts = [
  {
    id: '1',
    qrCodeId: '3',
    memberId: 'member-1',
    equipmentName: 'Vacuum Cleaner',
    checkedOutAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    checkedInAt: null,
    status: 'checked_out',
    conditionOnCheckout: 'good',
    member: { name: 'Emma' },
  },
];

const mockStats = {
  totalScans: 67,
  successfulScans: 58,
  failedScans: 9,
  successRate: 87,
  totalPointsAwarded: 290,
};

export function QRVerification() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create QR Code
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
          <ScanStatsSummary stats={mockStats} />

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
                <div className="text-sm text-white/80">{mockQRCodes.length} codes</div>
              </button>
              <button
                onClick={() => setActiveTab('scans')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">📜</div>
                <div className="font-medium">View Scans</div>
                <div className="text-sm text-white/80">{mockScans.length} recent</div>
              </button>
              <button
                onClick={() => setActiveTab('checkpoints')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🏁</div>
                <div className="font-medium">Checkpoints</div>
                <div className="text-sm text-white/80">
                  {mockCheckpointProgress.filter((p) => p.status === 'in_progress').length} active
                </div>
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🧹</div>
                <div className="font-medium">Equipment</div>
                <div className="text-sm text-white/80">
                  {mockEquipmentCheckouts.filter((e) => e.status === 'checked_out').length} out
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Scans</h2>
              <div className="space-y-3">
                {mockScans.slice(0, 4).map((scan) => (
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
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">In Progress</h2>
              <div className="space-y-3">
                {mockCheckpointProgress.map((progress) => (
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
                {mockEquipmentCheckouts
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
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'codes' && (
        <QRCodeList
          qrCodes={mockQRCodes}
          onView={(id) => console.log('View', id)}
          onEdit={(id) => console.log('Edit', id)}
          onDelete={(id) => console.log('Delete', id)}
          onRegenerate={(id) => console.log('Regenerate', id)}
          onDownload={(id) => console.log('Download', id)}
        />
      )}

      {activeTab === 'scans' && <ScanHistoryList scans={mockScans} />}

      {activeTab === 'checkpoints' && (
        <div className="space-y-4">
          {mockCheckpointProgress.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">🏁</span>
              <p className="text-gray-500">No checkpoint progress</p>
              <p className="text-sm text-gray-400">
                Start scanning checkpoint QR codes to track progress
              </p>
            </div>
          ) : (
            mockCheckpointProgress.map((progress) => (
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
          {mockEquipmentCheckouts.length === 0 ? (
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
              {mockEquipmentCheckouts
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
                  onClick={() => {
                    console.log('Selected template', template.id);
                    setShowCreateModal(false);
                  }}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
                onClick={() => {
                  console.log('Create custom');
                  setShowCreateModal(false);
                }}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
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
