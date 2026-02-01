import { useParams } from 'react-router-dom';
import { useDemoAuth } from '../context/DemoAuthContext';
import RewardsStore from './RewardsStore';
import DemoRewardsStore from './DemoRewardsStore';

/**
 * Wrapper component that renders either the real RewardsStore
 * or the DemoRewardsStore based on the demo mode state.
 */
export default function RewardsStoreWrapper() {
  const { householdId } = useParams<{ householdId: string }>();
  const { isDemoMode, demoHouseholdId } = useDemoAuth();

  // If in demo mode and accessing the demo household, show demo page
  if (isDemoMode && householdId === demoHouseholdId) {
    return <DemoRewardsStore />;
  }

  // Otherwise show the real page
  return <RewardsStore />;
}
