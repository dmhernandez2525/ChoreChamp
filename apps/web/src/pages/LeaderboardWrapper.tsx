import { useParams } from 'react-router-dom';
import { useDemoAuth } from '../context/DemoAuthContext';
import Leaderboard from './Leaderboard';
import DemoLeaderboardPage from './DemoLeaderboardPage';

/**
 * Wrapper component that renders either the real Leaderboard
 * or the DemoLeaderboardPage based on the demo mode state.
 */
export default function LeaderboardWrapper() {
  const { householdId } = useParams<{ householdId: string }>();
  const { isDemoMode, demoHouseholdId } = useDemoAuth();

  // If in demo mode and accessing the demo household, show demo page
  if (isDemoMode && householdId === demoHouseholdId) {
    return <DemoLeaderboardPage />;
  }

  // Otherwise show the real page
  return <Leaderboard />;
}
