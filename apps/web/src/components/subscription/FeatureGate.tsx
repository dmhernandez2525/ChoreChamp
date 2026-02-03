import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import type { Household } from '@chorechamp/types';
import {
  FeatureKey,
  getFeatureDescription,
  getFeatureLabel,
  getFeatureTier,
  hasFeature,
} from '../../lib/subscription';

interface FeatureGateProps {
  household?: Household | null;
  feature: FeatureKey;
  title?: string;
  description?: string;
  preview?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function FeatureGate({
  household,
  feature,
  title,
  description,
  preview,
  className,
  children,
}: FeatureGateProps) {
  const { householdId } = useParams<{ householdId: string }>();
  const unlocked = hasFeature(household, feature);
  const prevUnlocked = useRef(unlocked);
  const [showUnlock, setShowUnlock] = useState(false);

  useEffect(() => {
    const wasUnlocked = prevUnlocked.current;
    prevUnlocked.current = unlocked;
    if (!wasUnlocked && unlocked) {
      setShowUnlock(true);
      const timer = setTimeout(() => setShowUnlock(false), 3500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [unlocked]);

  const tierLabel = useMemo(() => {
    const tier = getFeatureTier(feature);
    return tier === 'family' ? 'Family' : 'Premium';
  }, [feature]);

  if (unlocked) {
    return (
      <div className={cn('relative', className)}>
        {showUnlock && (
          <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-bounce">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Feature unlocked!
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-dashed border-amber-200 bg-amber-50 p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-amber-700">Premium Feature</p>
            <h3 className="text-lg font-semibold text-amber-900">
              {title || getFeatureLabel(feature)}
            </h3>
            <p className="text-sm text-amber-700">
              {description || getFeatureDescription(feature)}
            </p>
          </div>
          {preview && <div className="rounded-lg border border-amber-200 bg-white/60 p-4">{preview}</div>}
          {householdId && (
            <Button asChild size="sm">
              <Link to={`/households/${householdId}/subscription`}>Upgrade to {tierLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
