import { cn } from '@chorechamp/ui';

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

interface SmartDevice {
  id: string;
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

interface DeviceCardProps {
  device: SmartDevice;
  onControl?: (deviceId: string, command: { type: string; parameters: Record<string, unknown> }) => void;
  onConfigure?: (deviceId: string) => void;
  className?: string;
}

const categoryIcons: Record<string, string> = {
  light: '💡',
  switch: '🔌',
  sensor: '📡',
  thermostat: '🌡️',
  lock: '🔒',
  camera: '📷',
  vacuum: '🤖',
  appliance: '🏠',
  media_player: '📺',
  other: '📦',
};

export function DeviceCard({ device, onControl, onConfigure, className }: DeviceCardProps) {
  const icon = categoryIcons[device.category] || '📦';
  const state = device.currentState;

  const handlePowerToggle = () => {
    if (onControl && device.capabilities.includes('on_off')) {
      onControl(device.id, {
        type: 'set_power',
        parameters: { power: state.power === 'on' ? 'off' : 'on' },
      });
    }
  };

  const handleVacuumToggle = () => {
    if (onControl && device.capabilities.includes('vacuum_control')) {
      onControl(device.id, {
        type: state.vacuumState === 'cleaning' ? 'vacuum_stop' : 'vacuum_start',
        parameters: {},
      });
    }
  };

  const getStatusColor = () => {
    if (!device.isOnline) return 'bg-gray-200';
    if (state.power === 'on') return 'bg-green-100';
    if (state.vacuumState === 'cleaning') return 'bg-blue-100';
    if (state.motion) return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  const getStatusText = () => {
    if (!device.isOnline) return 'Offline';

    switch (device.category) {
      case 'light':
      case 'switch':
        return state.power === 'on' ? 'On' : 'Off';
      case 'vacuum':
        return state.vacuumState === 'cleaning'
          ? 'Cleaning'
          : state.vacuumState === 'charging'
          ? 'Charging'
          : 'Idle';
      case 'sensor':
        if (state.motion !== undefined) return state.motion ? 'Motion detected' : 'No motion';
        if (state.contact !== undefined) return state.contact === 'open' ? 'Open' : 'Closed';
        return 'Active';
      case 'lock':
        return state.locked ? 'Locked' : 'Unlocked';
      case 'thermostat':
        return state.temperature ? `${state.temperature}°` : 'Active';
      default:
        return 'Active';
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 transition-all duration-200',
        getStatusColor(),
        !device.isOnline && 'opacity-60',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{device.name}</h3>
            {device.location && (
              <p className="text-sm text-gray-500">{device.location}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Online indicator */}
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              device.isOnline ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        <span
          className={cn(
            'text-sm font-medium px-2 py-1 rounded-full',
            device.isOnline
              ? state.power === 'on' || state.vacuumState === 'cleaning'
                ? 'bg-green-200 text-green-800'
                : 'bg-gray-200 text-gray-700'
              : 'bg-gray-300 text-gray-600'
          )}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Additional info */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
        {state.brightness !== undefined && (
          <span>Brightness: {state.brightness}%</span>
        )}
        {state.battery !== undefined && (
          <span>🔋 {state.battery}%</span>
        )}
        {state.temperature !== undefined && (
          <span>🌡️ {state.temperature}°</span>
        )}
        {state.humidity !== undefined && (
          <span>💧 {state.humidity}%</span>
        )}
        {device.choreRelatedZone && (
          <span className="text-indigo-600">🧹 {device.choreRelatedZone}</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {device.isOnline && device.capabilities.includes('on_off') && (
          <button
            onClick={handlePowerToggle}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              state.power === 'on'
                ? 'bg-gray-700 text-white hover:bg-gray-800'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            )}
          >
            {state.power === 'on' ? 'Turn Off' : 'Turn On'}
          </button>
        )}
        {device.isOnline && device.capabilities.includes('vacuum_control') && (
          <button
            onClick={handleVacuumToggle}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              state.vacuumState === 'cleaning'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            )}
          >
            {state.vacuumState === 'cleaning' ? 'Stop' : 'Start'}
          </button>
        )}
        {onConfigure && (
          <button
            onClick={() => onConfigure(device.id)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ⚙️
          </button>
        )}
      </div>

      {/* Device info */}
      {(device.manufacturer || device.model) && (
        <div className="mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-400">
          {device.manufacturer && device.model
            ? `${device.manufacturer} ${device.model}`
            : device.manufacturer || device.model}
        </div>
      )}
    </div>
  );
}

interface DeviceGridProps {
  devices: SmartDevice[];
  onControl?: (deviceId: string, command: { type: string; parameters: Record<string, unknown> }) => void;
  onConfigure?: (deviceId: string) => void;
  className?: string;
}

export function DeviceGrid({ devices, onControl, onConfigure, className }: DeviceGridProps) {
  const groupedByLocation = devices.reduce((acc, device) => {
    const location = device.location || 'Unassigned';
    if (!acc[location]) acc[location] = [];
    acc[location].push(device);
    return acc;
  }, {} as Record<string, SmartDevice[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedByLocation).map(([location, locationDevices]) => (
        <div key={location}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{location}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onControl={onControl}
                onConfigure={onConfigure}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
