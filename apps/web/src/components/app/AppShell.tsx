import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useHousehold } from '@chorechamp/api-client';
import { applyTheme } from '../../lib/themes';
import { getHouseholdEffectiveTier, hasFeature } from '../../lib/subscription';
import { AdBanner } from '../ads/AdBanner';
import { MobileBottomNav } from './MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

function extractHouseholdId(pathname: string): string | null {
  const match = pathname.match(/\/households\/([^/]+)/);
  return match ? match[1] : null;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const householdId = useMemo(() => extractHouseholdId(location.pathname), [location.pathname]);
  const { data: household } = useHousehold(householdId || '');

  useEffect(() => {
    applyTheme(household?.themeId ?? 'classic');
  }, [household?.themeId]);

  const effectiveTier = getHouseholdEffectiveTier(household);
  const showAds = Boolean(householdId) && !hasFeature(household, 'ad_free');

  return (
    <>
      {children}
      {householdId && <MobileBottomNav householdId={householdId} />}
      <AdBanner visible={showAds} householdId={householdId} />
      {householdId && (
        <span className="sr-only">Current tier: {effectiveTier}</span>
      )}
    </>
  );
}
