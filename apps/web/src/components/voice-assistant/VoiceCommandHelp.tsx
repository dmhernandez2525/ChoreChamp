import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mic, RefreshCw } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { VoiceCommandSample } from '@chorechamp/types';

interface VoiceCommandHelpProps {
  householdId: string;
  onSelectCommand?: (command: string) => void;
}

export function VoiceCommandHelp({ householdId, onSelectCommand }: VoiceCommandHelpProps) {
  const [commands, setCommands] = useState<VoiceCommandSample[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, VoiceCommandSample[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommands();
  }, [householdId]);

  const loadCommands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getVoiceCommands(householdId);
      setCommands(data.commands);
      setByCategory(data.byCategory);
    } catch (err) {
      console.error('Failed to load commands:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commands');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Object.keys(byCategory);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'chores':
        return '🧹';
      case 'points':
        return '⭐';
      case 'streaks':
        return '🔥';
      case 'rewards':
        return '🎁';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'help':
        return '❓';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={loadCommands}
            className="mt-2 flex items-center gap-1 mx-auto text-sm hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Voice Commands
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {commands.length} commands available
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category;
          const categoryCommands = byCategory[category] || [];

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCategoryIcon(category)}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {categoryCommands.length} command{categoryCommands.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {categoryCommands.map((cmd) => (
                    <div
                      key={cmd.intent}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {cmd.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cmd.samples.map((sample, i) => (
                          <button
                            key={i}
                            onClick={() => onSelectCommand?.(sample)}
                            className="inline-flex items-center gap-1 text-sm bg-white dark:bg-gray-600 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-500 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <Mic className="w-3 h-3 text-indigo-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              "{sample}"
                            </span>
                          </button>
                        ))}
                      </div>
                      {cmd.requiresEntity && cmd.requiresEntity.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Requires: {cmd.requiresEntity.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
