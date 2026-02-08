import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { DemoProvider, useDemo } from '../context/DemoContext';
import { useDemoAuth } from '../context/DemoAuthContext';
import { DemoBanner } from '../components/DemoBanner';

function DemoRewardsStoreContent() {
  const navigate = useNavigate();
  const { demoRole, demoHouseholdId, exitDemo } = useDemoAuth();
  const {
    household,
    members,
    rewards,
    selectedMemberId,
    setSelectedMemberId,
    redeemReward,
    resetDemo,
  } = useDemo();

  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const isParent = demoRole === 'parent';

  // Get current member
  const currentMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // Get child members for selection
  const childMembers = useMemo(() => {
    return members.filter((m) => m.role === 'child' || m.role === 'teen');
  }, [members]);

  // Handle reward redemption
  const handleRedeem = async (rewardId: string) => {
    if (!currentMember || isParent) return;

    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || currentMember.pointsCurrent < reward.pointCost) return;

    setRedeemingId(rewardId);
    try {
      await redeemReward(rewardId, currentMember.id);
    } finally {
      setRedeemingId(null);
    }
  };

  const handleSignOut = () => {
    resetDemo();
    exitDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${demoHouseholdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Rewards Store</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Member selector for child view */}
            {demoRole === 'child' && childMembers.length > 1 && (
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              >
                {childMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {currentMember && !isParent && (
              <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2">
                <span className="text-lg">*</span>
                <span className="font-semibold text-yellow-700">
                  {currentMember.pointsCurrent} {household.pointsName}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Points Balance Card (for children) */}
        {!isParent && currentMember && (
          <div className="mb-8 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available {household.pointsName}</p>
                <p className="text-4xl font-bold">{currentMember.pointsCurrent}</p>
              </div>
              <span className="text-6xl opacity-50">*</span>
            </div>
          </div>
        )}

        {/* Rewards Grid */}
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Available Rewards</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const canAfford = currentMember ? currentMember.pointsCurrent >= reward.pointCost : false;
            const isLimited = reward.quantity !== null;
            const isAvailable = !isLimited || (reward.quantityRemaining && reward.quantityRemaining > 0);

            return (
              <div
                key={reward.id}
                className="rounded-lg bg-white p-4 sm:p-6 shadow transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 text-4xl">{reward.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{reward.description}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <span>*</span>
                    <span className="font-semibold">{reward.pointCost}</span>
                  </div>
                  {isLimited && (
                    <span className="text-xs text-gray-400">
                      {reward.quantityRemaining} left
                    </span>
                  )}
                </div>

                {!isParent && (
                  <Button
                    className="mt-4 w-full"
                    disabled={!canAfford || !isAvailable || redeemingId === reward.id}
                    onClick={() => handleRedeem(reward.id)}
                  >
                    {redeemingId === reward.id
                      ? 'Redeeming...'
                      : !isAvailable
                      ? 'Out of Stock'
                      : !canAfford
                      ? 'Need More Points'
                      : 'Redeem'}
                  </Button>
                )}

                {isParent && (
                  <div className="mt-4 text-center text-sm text-gray-400">
                    Parent view - Cannot redeem
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Demo Info */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <p>
            <strong>Demo Mode:</strong> Rewards redemption is simulated. Points will be deducted
            temporarily and will reset when you exit demo mode.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DemoRewardsStore() {
  return (
    <DemoProvider>
      <DemoRewardsStoreContent />
    </DemoProvider>
  );
}
