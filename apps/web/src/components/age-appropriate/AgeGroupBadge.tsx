import type { AgeGroup, AgeSuitability } from '@chorechamp/types';

interface AgeGroupBadgeProps {
  ageGroup: AgeGroup | string | null;
  size?: 'sm' | 'md';
}

const AGE_GROUP_LABELS: Record<string, string> = {
  toddler: 'Toddler',
  preschool: 'Preschool',
  early_elementary: 'Early Elem',
  late_elementary: 'Late Elem',
  middle_school: 'Middle School',
  high_school: 'High School',
};

const AGE_GROUP_COLORS: Record<string, string> = {
  toddler: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  preschool: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  early_elementary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  late_elementary: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  middle_school: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  high_school: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export function AgeGroupBadge({ ageGroup, size = 'md' }: AgeGroupBadgeProps) {
  if (!ageGroup) return null;

  const label = AGE_GROUP_LABELS[ageGroup] || ageGroup;
  const color = AGE_GROUP_COLORS[ageGroup] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${color} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      {label}
    </span>
  );
}

interface SuitabilityBadgeProps {
  suitability: AgeSuitability | string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const SUITABILITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  perfect: {
    label: 'Perfect',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: '★',
  },
  suitable: {
    label: 'Suitable',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: '✓',
  },
  challenging: {
    label: 'Challenging',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: '!',
  },
  too_young: {
    label: 'Too Young',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: '✕',
  },
  too_easy: {
    label: 'Too Easy',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    icon: '−',
  },
};

export function SuitabilityBadge({ suitability, size = 'md', showLabel = true }: SuitabilityBadgeProps) {
  const config = SUITABILITY_CONFIG[suitability] || SUITABILITY_CONFIG.suitable;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
      title={config.label}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
