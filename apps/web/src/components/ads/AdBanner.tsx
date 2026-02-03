import { Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';

interface AdBannerProps {
  visible: boolean;
  householdId?: string | null;
}

export function AdBanner({ visible, householdId }: AdBannerProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(560px,92vw)] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Sponsored</p>
          <p className="text-sm font-medium text-amber-900">SparkleClean Kits</p>
          <p className="text-xs text-amber-700">Premium supplies to make chore time fly by.</p>
        </div>
        {householdId && (
          <Button size="sm" asChild>
            <Link to={`/households/${householdId}/subscription`}>Remove Ads</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
