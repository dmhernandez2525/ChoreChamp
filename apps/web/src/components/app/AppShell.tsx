import { useEffect, useMemo, type MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useHousehold } from '@chorechamp/api-client';
import { applyTheme } from '../../lib/themes';
import { getHouseholdEffectiveTier, hasFeature } from '../../lib/subscription';
import { AdBanner } from '../ads/AdBanner';
import { useAccessibility } from '../accessibility';
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
  const { announce } = useAccessibility();
  const householdId = useMemo(() => extractHouseholdId(location.pathname), [location.pathname]);
  const { data: household } = useHousehold(householdId || '');

  useEffect(() => {
    applyTheme(household?.themeId ?? 'classic');
  }, [household?.themeId]);

  const effectiveTier = getHouseholdEffectiveTier(household);
  const showAds = Boolean(householdId) && !hasFeature(household, 'ad_free');

  const skipToMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const main = document.querySelector('main, [role="main"]');
    if (main instanceof HTMLElement) {
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const heading = document.querySelector('main h1, [role="main"] h1');
      if (heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      const label =
        heading instanceof HTMLElement && heading.textContent?.trim().length
          ? heading.textContent.trim()
          : location.pathname.replace(/\//g, ' ').trim() || 'page';
      announce(`Navigated to ${label}`);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [announce, location.pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link" onClick={skipToMainContent}>
        Skip to main content
      </a>
      <div id="main-content">{children}</div>
      {householdId && <MobileBottomNav householdId={householdId} />}
      <AdBanner visible={showAds} householdId={householdId} />
      {householdId && (
        <span className="sr-only">Current tier: {effectiveTier}</span>
      )}
    </>
  );
}
