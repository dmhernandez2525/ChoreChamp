import { useState, useEffect } from 'react';
import { ChevronDown, Home, Check, Star, Users } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { UserHouseholdsResponse } from '@chorechamp/types';

interface HouseholdSwitcherProps {
  currentHouseholdId: string | null;
  onHouseholdChange: (householdId: string) => void;
  compact?: boolean;
}

export function HouseholdSwitcher({
  currentHouseholdId,
  onHouseholdChange,
  compact = false,
}: HouseholdSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [householdContext, setHouseholdContext] = useState<UserHouseholdsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    loadHouseholdContext();
  }, []);

  async function loadHouseholdContext() {
    try {
      setIsLoading(true);
      const context = await apiClient.getHouseholdContext();
      setHouseholdContext(context);
    } catch (error) {
      console.error('Failed to load household context:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSwitch(householdId: string, setAsDefault: boolean = false) {
    if (householdId === currentHouseholdId) {
      setIsOpen(false);
      return;
    }

    try {
      setIsSwitching(true);
      await apiClient.switchHousehold(householdId, setAsDefault);
      onHouseholdChange(householdId);
      setIsOpen(false);
      // Reload context to get updated defaults
      await loadHouseholdContext();
    } catch (error) {
      console.error('Failed to switch household:', error);
    } finally {
      setIsSwitching(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (!householdContext || householdContext.households.length <= 1) {
    // Don't show switcher if user only has one household
    return null;
  }

  const currentHousehold = householdContext.households.find(
    (h) => h.household.id === currentHouseholdId
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
          ${isOpen ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
          ${isSwitching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
      >
        <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        {!compact && (
          <>
            <span className="font-medium text-gray-900 dark:text-gray-100 max-w-32 truncate">
              {currentHousehold?.household.name || 'Select Household'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                Your Households
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {householdContext.households.map((context) => {
                const isActive = context.household.id === currentHouseholdId;
                const isDefault = context.isDefault;

                return (
                  <button
                    key={context.household.id}
                    onClick={() => handleSwitch(context.household.id)}
                    disabled={isSwitching}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 text-left transition-colors
                      ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                    `}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: context.member.color || '#6366f1' }}
                    >
                      {context.household.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {context.household.name}
                        </span>
                        {isDefault && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{context.role}</span>
                        {context.linkedMembers.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {context.linkedMembers.length} linked
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {currentHousehold && !currentHousehold.isDefault && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleSwitch(currentHouseholdId!, true)}
                  disabled={isSwitching}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Set as default household
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
