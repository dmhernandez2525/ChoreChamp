import type {
  TrackedDevice,
  DeviceType,
  ScreenTimePlatform,
} from '@chorechamp/types';

interface DeviceCardProps {
  device: TrackedDevice;
  onEdit?: (device: TrackedDevice) => void;
  onDelete?: (deviceId: string) => void;
  onSync?: (deviceId: string) => void;
}

const deviceIcons: Record<DeviceType, string> = {
  smartphone: '📱',
  tablet: '📲',
  computer: '💻',
  gaming_console: '🎮',
  smart_tv: '📺',
  streaming_device: '🔌',
  handheld_gaming: '🕹️',
  vr_headset: '🥽',
  other: '📟',
};

const platformNames: Record<ScreenTimePlatform, string> = {
  apple_screen_time: 'Apple Screen Time',
  google_family_link: 'Google Family Link',
  microsoft_family: 'Microsoft Family',
  amazon_parent_dashboard: 'Amazon Parent Dashboard',
  nintendo_parental: 'Nintendo Parental',
  playstation_family: 'PlayStation Family',
  xbox_family: 'Xbox Family',
  samsung_kids_mode: 'Samsung Kids Mode',
  custom_integration: 'Custom Integration',
  manual: 'Manual',
};

export function DeviceCard({ device, onEdit, onDelete, onSync }: DeviceCardProps) {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never synced';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
      device.isConnected ? 'border-green-500' : 'border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {device.iconUrl ? (
              <img src={device.iconUrl} alt={device.name} className="w-10 h-10 rounded" />
            ) : (
              deviceIcons[device.type]
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {device.type.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            device.isConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {device.isConnected ? '● Connected' : '○ Offline'}
          </span>
          {!device.isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              Paused
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Platform</span>
          <p className="font-medium">{platformNames[device.platform]}</p>
        </div>
        <div>
          <span className="text-gray-500">Last Sync</span>
          <p className="font-medium">{formatLastSync(device.lastSyncAt)}</p>
        </div>
      </div>

      {device.platform !== 'manual' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          {onSync && (
            <button
              onClick={() => onSync(device.id)}
              className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              🔄 Sync Now
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(device)}
              className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(device.id)}
              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}
