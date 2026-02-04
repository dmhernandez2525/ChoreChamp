import { Check, Minus } from 'lucide-react';
import { cn } from '@chorechamp/ui';
import type { SubscriptionTier } from '@chorechamp/types';

const FEATURE_ROWS: {
  label: string;
  note?: string;
  tiers: Record<SubscriptionTier, boolean | 'addon'>;
}[] = [
  { label: 'Core chore management', tiers: { free: true, family: true, premium: true } },
  { label: 'Basic gamification (points, streaks, badges)', tiers: { free: true, family: true, premium: true } },
  { label: 'Up to 5 family members', tiers: { free: true, family: false, premium: false } },
  { label: 'Up to 6 family members', tiers: { free: false, family: true, premium: false } },
  { label: 'Unlimited family members', tiers: { free: false, family: false, premium: true } },
  { label: 'Ad-free experience', tiers: { free: false, family: true, premium: true } },
  { label: 'Unlimited custom rewards', tiers: { free: false, family: false, premium: true } },
  { label: 'Custom themes and skins', tiers: { free: false, family: false, premium: true } },
  { label: 'Advanced analytics dashboard', tiers: { free: false, family: false, premium: true } },
  { label: 'Extended reports (2 years)', tiers: { free: false, family: false, premium: true } },
  { label: 'Priority support chat', tiers: { free: false, family: false, premium: true } },
  { label: 'API access for power users', tiers: { free: false, family: false, premium: true } },
  { label: 'White-label branding', note: 'Enterprise add-on', tiers: { free: false, family: false, premium: 'addon' } },
];

function renderCell(value: boolean | 'addon') {
  if (value === 'addon') {
    return <span className="text-xs font-medium text-amber-600">Add-on</span>;
  }
  return value ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Minus className="h-4 w-4 text-gray-400" aria-hidden="true" />;
}

interface FeatureComparisonTableProps {
  currentTier?: SubscriptionTier | null;
}

export function FeatureComparisonTable({ currentTier }: FeatureComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-4 bg-gray-50 text-sm font-semibold text-gray-600">
        <div className="p-4">Feature</div>
        <div className={cn('p-4 text-center', currentTier === 'free' && 'text-blue-600')}>Free</div>
        <div className={cn('p-4 text-center', currentTier === 'family' && 'text-blue-600')}>Family</div>
        <div className={cn('p-4 text-center', currentTier === 'premium' && 'text-blue-600')}>Premium</div>
      </div>
      <div className="divide-y divide-gray-200">
        {FEATURE_ROWS.map((row) => (
          <div key={row.label} className="grid grid-cols-4 items-center text-sm">
            <div className="p-4">
              <p className="font-medium text-gray-900">{row.label}</p>
              {row.note && <p className="text-xs text-gray-500">{row.note}</p>}
            </div>
            <div className="p-4 flex justify-center">{renderCell(row.tiers.free)}</div>
            <div className="p-4 flex justify-center">{renderCell(row.tiers.family)}</div>
            <div className="p-4 flex justify-center">{renderCell(row.tiers.premium)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
