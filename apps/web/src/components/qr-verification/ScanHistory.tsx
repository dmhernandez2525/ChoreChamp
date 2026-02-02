import { cn } from '@chorechamp/ui';

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
  qrCode?: {
    id: string;
    name: string;
    type: string;
  };
  member?: {
    id: string;
    name: string;
  };
}

interface ScanHistoryCardProps {
  scan: QRCodeScan;
  onClick?: (scanId: string) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  success: {
    label: 'Verified',
    color: 'bg-green-100 text-green-700',
    icon: '✅',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700',
    icon: '❌',
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    icon: '⏳',
  },
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ScanHistoryCard({
  scan,
  onClick,
  className,
}: ScanHistoryCardProps) {
  const status = statusConfig[scan.verificationStatus];

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow cursor-pointer',
        className
      )}
      onClick={() => onClick?.(scan.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {scan.qrCode?.name || 'Unknown QR Code'}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  status.color
                )}
              >
                {status.label}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {scan.member?.name || 'Unknown Member'} • {formatTime(scan.scannedAt)}
            </div>
          </div>
        </div>

        <div className="text-right">
          {scan.bonusPointsAwarded > 0 && (
            <div className="text-green-600 font-medium">
              +{scan.bonusPointsAwarded} pts
            </div>
          )}
          {scan.gpsVerified !== null && (
            <div className="text-xs text-gray-500">
              {scan.gpsVerified ? '📍 GPS verified' : '📍 GPS failed'}
              {scan.gpsDistanceMeters && ` (${Math.round(scan.gpsDistanceMeters)}m)`}
            </div>
          )}
          {scan.photoUrl && (
            <div className="text-xs text-blue-500">📷 Photo attached</div>
          )}
        </div>
      </div>

      {scan.failureReason && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
          {scan.failureReason}
        </div>
      )}
    </div>
  );
}

interface ScanHistoryListProps {
  scans: QRCodeScan[];
  onClick?: (scanId: string) => void;
  className?: string;
}

export function ScanHistoryList({
  scans,
  onClick,
  className,
}: ScanHistoryListProps) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📜</span>
        <p className="text-gray-500">No scans yet</p>
        <p className="text-sm text-gray-400">
          Scan history will appear here
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = scans.reduce((acc, scan) => {
    const dateKey = new Date(scan.scannedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(scan);
    return acc;
  }, {} as Record<string, QRCodeScan[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(grouped).map(([date, dateScans]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
          <div className="space-y-2">
            {dateScans.map((scan) => (
              <ScanHistoryCard key={scan.id} scan={scan} onClick={onClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ScanStatsSummaryProps {
  stats: {
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    successRate: number;
    totalPointsAwarded: number;
  };
  className?: string;
}

export function ScanStatsSummary({ stats, className }: ScanStatsSummaryProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-5 gap-4', className)}>
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm text-gray-500">Total Scans</div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalScans}</div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm text-gray-500">Successful</div>
        <div className="text-2xl font-bold text-green-600">{stats.successfulScans}</div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm text-gray-500">Failed</div>
        <div className="text-2xl font-bold text-red-600">{stats.failedScans}</div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm text-gray-500">Success Rate</div>
        <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm text-gray-500">Points Earned</div>
        <div className="text-2xl font-bold text-purple-600">{stats.totalPointsAwarded}</div>
      </div>
    </div>
  );
}
