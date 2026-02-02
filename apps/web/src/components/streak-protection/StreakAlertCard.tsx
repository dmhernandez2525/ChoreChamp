import { X, AlertTriangle, Snowflake, Bell, Trophy } from 'lucide-react';
import type { StreakAlert } from '@chorechamp/types';
import { getRiskColor } from '@chorechamp/types';

interface StreakAlertCardProps {
  alert: StreakAlert;
  onDismiss: () => void;
}

export function StreakAlertCard({ alert, onDismiss }: StreakAlertCardProps) {
  const getAlertIcon = () => {
    switch (alert.alertType) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5" />;
      case 'freeze_suggestion':
        return <Snowflake className="w-5 h-5" />;
      case 'milestone_approaching':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertBgColor = () => {
    switch (alert.alertType) {
      case 'urgent':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'freeze_suggestion':
        return 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800';
      case 'milestone_approaching':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    }
  };

  const getAlertTextColor = () => {
    switch (alert.alertType) {
      case 'urgent':
        return 'text-red-700 dark:text-red-300';
      case 'freeze_suggestion':
        return 'text-cyan-700 dark:text-cyan-300';
      case 'milestone_approaching':
        return 'text-purple-700 dark:text-purple-300';
      default:
        return 'text-amber-700 dark:text-amber-300';
    }
  };

  return (
    <div className={`p-4 border-l-4 ${getAlertBgColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={getAlertTextColor()}>
            {getAlertIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-medium ${getAlertTextColor()}`}>
                {alert.title}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${getRiskColor(alert.riskLevel)}20`,
                  color: getRiskColor(alert.riskLevel),
                }}
              >
                {alert.riskLevel}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {alert.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              For: {alert.memberName}
            </p>

            {alert.suggestedAction && (
              <div className="mt-2">
                <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  {alert.suggestedAction.title}
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
