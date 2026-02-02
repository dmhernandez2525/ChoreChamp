import { cn } from '@chorechamp/ui';

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

interface QRCodeCardProps {
  qrCode: QRCode;
  onView?: (qrCodeId: string) => void;
  onEdit?: (qrCodeId: string) => void;
  onDelete?: (qrCodeId: string) => void;
  onRegenerate?: (qrCodeId: string) => void;
  onDownload?: (qrCodeId: string) => void;
  className?: string;
}

const typeIcons: Record<string, string> = {
  location: '📍',
  chore: '📋',
  equipment: '🧹',
  room: '🚪',
  task_station: '🎯',
  checkpoint: '🏁',
  supply_cabinet: '🗄️',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  expired: 'bg-red-100 text-red-700',
  revoked: 'bg-orange-100 text-orange-700',
};

const requirementLabels: Record<string, string> = {
  scan_only: 'Scan Only',
  scan_and_photo: 'Photo Required',
  scan_and_confirm: 'Confirmation Required',
  timed_scan: 'Timed',
  sequential_scan: 'Sequential',
  gps_verified: 'GPS Verified',
};

function formatDate(date: Date | null): string {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function QRCodeCard({
  qrCode,
  onView,
  onEdit,
  onDelete,
  onRegenerate,
  onDownload,
  className,
}: QRCodeCardProps) {
  const icon = typeIcons[qrCode.type] || '📱';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-md',
        qrCode.status !== 'active' && 'opacity-75',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{qrCode.name}</h3>
            {qrCode.description && (
              <p className="text-sm text-gray-500">{qrCode.description}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            statusColors[qrCode.status] || statusColors.inactive
          )}
        >
          {qrCode.status}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
          {qrCode.type.replace(/_/g, ' ')}
        </span>
        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
          {requirementLabels[qrCode.verificationRequirement] || qrCode.verificationRequirement}
        </span>
        {qrCode.requiresPhoto && (
          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">
            📷 Photo
          </span>
        )}
        {qrCode.checkpointGroupId && (
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            Step {qrCode.checkpointOrder}
          </span>
        )}
      </div>

      {/* Location/Zone */}
      {(qrCode.locationName || qrCode.linkedZoneName) && (
        <div className="text-sm text-gray-600 mb-3">
          {qrCode.locationName && (
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{qrCode.locationName}</span>
            </div>
          )}
          {qrCode.linkedZoneName && (
            <div className="flex items-center gap-1">
              <span>🏠</span>
              <span>{qrCode.linkedZoneName}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span>{qrCode.totalScans} scans</span>
        <span>Last: {formatDate(qrCode.lastScannedAt)}</span>
      </div>

      {/* QR Preview Placeholder */}
      <div
        onClick={() => onView?.(qrCode.id)}
        className="bg-gray-100 rounded-lg p-4 mb-3 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📱</div>
          <div className="text-sm text-gray-500">Click to view QR code</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload?.(qrCode.id)}
          className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          Download
        </button>
        <button
          onClick={() => onEdit?.(qrCode.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onRegenerate?.(qrCode.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
          title="Regenerate code"
        >
          🔄
        </button>
        <button
          onClick={() => onDelete?.(qrCode.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface QRCodeListProps {
  qrCodes: QRCode[];
  onView?: (qrCodeId: string) => void;
  onEdit?: (qrCodeId: string) => void;
  onDelete?: (qrCodeId: string) => void;
  onRegenerate?: (qrCodeId: string) => void;
  onDownload?: (qrCodeId: string) => void;
  className?: string;
}

export function QRCodeList({
  qrCodes,
  onView,
  onEdit,
  onDelete,
  onRegenerate,
  onDownload,
  className,
}: QRCodeListProps) {
  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📱</span>
        <p className="text-gray-500">No QR codes yet</p>
        <p className="text-sm text-gray-400">
          Create QR codes to verify chore completion
        </p>
      </div>
    );
  }

  // Group by type
  const grouped = qrCodes.reduce((acc, code) => {
    const type = code.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(code);
    return acc;
  }, {} as Record<string, QRCode[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(grouped).map(([type, codes]) => (
        <div key={type}>
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-3 flex items-center gap-2">
            <span>{typeIcons[type] || '📱'}</span>
            <span>{type.replace(/_/g, ' ')}</span>
            <span className="text-gray-400">({codes.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codes.map((code) => (
              <QRCodeCard
                key={code.id}
                qrCode={code}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onRegenerate={onRegenerate}
                onDownload={onDownload}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
