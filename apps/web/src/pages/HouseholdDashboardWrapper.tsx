import { useParams } from 'react-router-dom';
import { useDemoAuth } from '../context/DemoAuthContext';
import HouseholdDashboard from './HouseholdDashboard';
import DemoHouseholdDashboard from './DemoHouseholdDashboard';

/**
 * Wrapper component that renders either the real HouseholdDashboard
 * or the DemoHouseholdDashboard based on the demo mode state.
 */
export default function HouseholdDashboardWrapper() {
  const { householdId } = useParams<{ householdId: string }>();
  const { isDemoMode, demoHouseholdId } = useDemoAuth();

  // If in demo mode and accessing the demo household, show demo dashboard
  if (isDemoMode && householdId === demoHouseholdId) {
    return <DemoHouseholdDashboard />;
  }

  // Otherwise show the real dashboard
  return <HouseholdDashboard />;
}
