import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Landmark,
  RotateCcw,
  Link2,
  Briefcase,
  ShoppingCart,
  ChevronLeft,
  Plus,
  Search,
  DollarSign,
  RefreshCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  useBankingConnections,
  useDepositSummary,
  useChoreRotations,
  useChoreChains,
  useChores,
  useChoreClassifications,
  useClassificationSummary,
  useMarketplaceListings,
  useMarketplaceStats,
} from '@chorechamp/api-client';
import { Skeleton } from '../components/common';

type FinancialTab = 'banking' | 'rotations' | 'chains' | 'classification' | 'marketplace';

function StatCard({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            {value}
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            {label}
          </div>
        </>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg mb-6"
      style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
      <p className="text-sm" style={{ color: '#991b1b' }}>
        {message}
      </p>
    </div>
  );
}

function BankingTab({ householdId }: { householdId: string }) {
  const { data: connectionsData, isLoading: loadingConnections, isError: connectionsError } = useBankingConnections(householdId);
  const { data: summary, isLoading: loadingSummary, isError: summaryError } = useDepositSummary(householdId);

  const isLoading = loadingConnections || loadingSummary;
  const isError = connectionsError || summaryError;

  const connections = connectionsData?.connections ?? [];
  const totalDeposited = summary?.totalDeposited ?? 0;
  const pendingDeposits = summary?.pendingDeposits ?? 0;
  const activeConfigs = summary?.activeConfigs ?? 0;

  const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`;

  return (
    <div>
      {isError && <ErrorBanner message="Failed to load banking data. Please try again." />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Banking Integration
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Connect Bank
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Deposited" value={formatCurrency(totalDeposited)} isLoading={isLoading} />
        <StatCard label="Pending" value={formatCurrency(pendingDeposits)} isLoading={isLoading} />
        <StatCard label="Active Configs" value={String(activeConfigs)} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {['Plaid', 'Stripe', 'Manual'].map((provider) => (
          <button
            key={provider}
            className="p-4 rounded-lg text-center transition-colors"
            style={{
              backgroundColor: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
            }}
          >
            <Landmark className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--app-accent)' }} />
            <div className="font-medium text-sm">{provider}</div>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 space-y-3">
          <Skeleton className="h-12 w-12 mx-auto rounded-full" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3 w-64 mx-auto" />
        </div>
      ) : connections.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
          <p style={{ color: 'var(--app-text-muted)' }}>No banking connections</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Connect a bank account to automate allowance deposits
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5" style={{ color: 'var(--app-accent)' }} />
                <div>
                  <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                    {conn.institutionName}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                    {conn.accountName} ****{conn.accountMask}
                  </div>
                </div>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: conn.isActive ? '#dcfce7' : '#fef3c7',
                  color: conn.isActive ? '#166534' : '#92400e',
                }}
              >
                {conn.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RotationsTab({ householdId }: { householdId: string }) {
  const { data: rotationsData, isLoading, isError } = useChoreRotations(householdId);

  const rotations = rotationsData?.rotations ?? [];

  const rotationTypeLabels: Record<string, string> = {
    round_robin: 'Round Robin',
    weighted: 'Weighted',
    random: 'Random',
    skill_based: 'Skill-Based',
  };

  return (
    <div>
      {isError && <ErrorBanner message="Failed to load rotation data. Please try again." />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Chore Rotations
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          New Rotation
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Round Robin', 'Weighted', 'Random', 'Skill-Based'].map((type) => (
          <button
            key={type}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : rotations.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <RefreshCcw className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
          <p style={{ color: 'var(--app-text-muted)' }}>No rotations configured</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Set up automatic chore rotation between family members
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rotations.map((rotation) => (
            <div
              key={rotation.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <div>
                <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                  {rotation.choreName}
                </div>
                <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                  {rotationTypeLabels[rotation.rotationType] ?? rotation.rotationType} · {rotation.participantIds.length} participants
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: 'var(--app-accent)' }}>
                  {rotation.frequency}
                </div>
                <div className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  Fairness: {Math.round(rotation.fairnessScore * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChainsTab({ householdId }: { householdId: string }) {
  const { data: chainsData, isLoading, isError } = useChoreChains(householdId);

  const chains = chainsData?.chains ?? [];

  const activeChains = chains.filter((c) => c.status === 'in_progress' || c.status === 'pending');
  const completedChains = chains.filter((c) => c.status === 'completed');
  const totalSteps = chains.reduce((sum, c) => sum + c.totalSteps, 0);

  return (
    <div>
      {isError && <ErrorBanner message="Failed to load chore chain data. Please try again." />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Chore Chains
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          New Chain
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Chains" value={String(activeChains.length)} isLoading={isLoading} />
        <StatCard label="Completed" value={String(completedChains.length)} isLoading={isLoading} />
        <StatCard label="Total Steps" value={String(totalSteps)} isLoading={isLoading} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : chains.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <Link2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
          <p style={{ color: 'var(--app-text-muted)' }}>No chore chains</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Create chains to link dependent chores together with bonus points
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => {
            const progress = chain.totalSteps > 0
              ? Math.round((chain.completedSteps / chain.totalSteps) * 100)
              : 0;
            return (
              <div
                key={chain.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                    {chain.name}
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: chain.status === 'completed' ? '#dcfce7' : chain.status === 'blocked' ? '#fef3c7' : '#dbeafe',
                      color: chain.status === 'completed' ? '#166534' : chain.status === 'blocked' ? '#92400e' : '#1e40af',
                    }}
                  >
                    {chain.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--app-surface-muted)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: 'var(--app-accent)' }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--app-text-muted)' }}>
                    {chain.completedSteps}/{chain.totalSteps}
                  </span>
                </div>
                {chain.bonusPoints > 0 && (
                  <div className="text-xs mt-2" style={{ color: 'var(--app-text-muted)' }}>
                    +{chain.bonusPoints} bonus points on completion
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClassificationTab({ householdId }: { householdId: string }) {
  const { data: summary, isLoading: loadingSummary, isError: summaryError } = useClassificationSummary(householdId);
  const { data: classificationsData, isLoading: loadingClassifications, isError: classificationsError } = useChoreClassifications(householdId);
  const { data: chores, isLoading: loadingChores } = useChores(householdId);

  const isLoading = loadingSummary || loadingClassifications || loadingChores;
  const isError = summaryError || classificationsError;

  const totalChores = summary?.totalChores ?? 0;
  const responsibilities = summary?.responsibilities ?? 0;
  const jobs = summary?.jobs ?? 0;
  const unclassified = summary?.unclassified ?? 0;
  const classifications = classificationsData?.classifications ?? [];

  return (
    <div>
      {isError && <ErrorBanner message="Failed to load classification data. Please try again." />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Responsibilities vs Jobs
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Chores" value={String(totalChores)} isLoading={isLoading} />
        <StatCard label="Responsibilities" value={String(responsibilities)} isLoading={isLoading} />
        <StatCard label="Jobs" value={String(jobs)} isLoading={isLoading} />
        <StatCard label="Unclassified" value={String(unclassified)} isLoading={isLoading} />
      </div>

      <div
        className="p-4 rounded-lg mb-6"
        style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <h3 className="font-medium mb-3" style={{ color: 'var(--app-text)' }}>
          How it works
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--app-surface-muted)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4" style={{ color: 'var(--app-accent)' }} />
              <span className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                Responsibilities
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
              Unpaid duties everyone must do (making bed, picking up toys)
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--app-surface-muted)' }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" style={{ color: 'var(--app-accent)' }} />
              <span className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>Jobs</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
              Extra tasks that earn points or money (washing car, yard work)
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : classifications.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
          <p style={{ color: 'var(--app-text-muted)' }}>No chores classified yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Classify your chores as responsibilities or jobs to teach financial literacy
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {classifications.map((cls) => {
            const chore = (chores ?? []).find((c) => c.id === cls.choreId);
            return (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <div className="flex items-center gap-3">
                  {cls.classification === 'job' ? (
                    <DollarSign className="w-4 h-4" style={{ color: 'var(--app-accent)' }} />
                  ) : (
                    <Check className="w-4 h-4" style={{ color: 'var(--app-accent)' }} />
                  )}
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                      {chore?.title ?? `Chore ${cls.choreId.slice(0, 8)}`}
                    </div>
                    {cls.reason && (
                      <div className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                        {cls.reason}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium capitalize"
                  style={{
                    backgroundColor: cls.classification === 'job' ? '#dbeafe' : '#f3e8ff',
                    color: cls.classification === 'job' ? '#1e40af' : '#6b21a8',
                  }}
                >
                  {cls.classification}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MarketplaceTab({ householdId }: { householdId: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const { data: listingsData, isLoading: loadingListings, isError: listingsError } = useMarketplaceListings(householdId);
  const { data: stats, isLoading: loadingStats, isError: statsError } = useMarketplaceStats(householdId);

  const isLoading = loadingListings || loadingStats;
  const isError = listingsError || statsError;

  const allListings = listingsData?.listings ?? [];

  const filteredListings = useMemo(() => {
    let filtered = allListings;

    if (activeFilter === 'Open') {
      filtered = filtered.filter((l) => l.status === 'open');
    } else if (activeFilter === 'Claimed') {
      filtered = filtered.filter((l) => l.status === 'claimed');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.choreName.toLowerCase().includes(query) ||
          l.listedByName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allListings, activeFilter, searchQuery]);

  const activeListings = stats?.activeListings ?? 0;
  const completedListings = stats?.completedListings ?? 0;
  const totalPointsTraded = stats?.totalPointsTraded ?? 0;
  const totalListings = stats?.totalListings ?? 0;

  return (
    <div>
      {isError && <ErrorBanner message="Failed to load marketplace data. Please try again." />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Chore Marketplace
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Post Chore
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active" value={String(activeListings)} isLoading={isLoading} />
        <StatCard label="Completed" value={String(completedListings)} isLoading={isLoading} />
        <StatCard label="Points Traded" value={String(totalPointsTraded)} isLoading={isLoading} />
        <StatCard label="Total Listings" value={String(totalListings)} isLoading={isLoading} />
      </div>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search marketplace..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Open', 'Claimed', 'My Listings'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === activeFilter ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
              color: filter === activeFilter ? 'var(--app-accent)' : 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <ShoppingCart className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
          <p style={{ color: 'var(--app-text-muted)' }}>
            {allListings.length === 0 ? 'No marketplace listings' : 'No listings match your filters'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            {allListings.length === 0
              ? 'Post chores with point bounties for other family members to claim'
              : 'Try adjusting your search or filter criteria'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <div>
                <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                  {listing.choreName}
                </div>
                <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                  Posted by {listing.listedByName}
                  {listing.claimedByName ? ` · Claimed by ${listing.claimedByName}` : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: 'var(--app-accent)' }}>
                  {listing.pointBounty} pts
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: listing.status === 'open' ? '#dcfce7' : listing.status === 'claimed' ? '#dbeafe' : '#f3f4f6',
                    color: listing.status === 'open' ? '#166534' : listing.status === 'claimed' ? '#1e40af' : '#374151',
                  }}
                >
                  {listing.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinancialScheduling() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<FinancialTab>('banking');

  const tabs: Array<{ id: FinancialTab; label: string; icon: typeof Landmark }> = [
    { id: 'banking', label: 'Banking', icon: Landmark },
    { id: 'rotations', label: 'Rotations', icon: RotateCcw },
    { id: 'chains', label: 'Chains', icon: Link2 },
    { id: 'classification', label: 'Tasks', icon: Briefcase },
    { id: 'marketplace', label: 'Market', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link
            to={`/households/${householdId}`}
            className="inline-flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--app-text-muted)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Household
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--app-text)' }}>
            Financial & Scheduling
          </h1>
          <p style={{ color: 'var(--app-text-muted)' }}>
            Banking integration, chore rotations, task chains, classifications, and marketplace
          </p>
        </div>

        <div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          style={{ borderBottom: '1px solid var(--app-border)' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--app-surface)' : 'transparent',
                  color: isActive ? 'var(--app-accent)' : 'var(--app-text-muted)',
                  borderBottom: isActive ? '2px solid var(--app-accent)' : 'none',
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--app-surface)' }}>
          {activeTab === 'banking' && <BankingTab householdId={householdId!} />}
          {activeTab === 'rotations' && <RotationsTab householdId={householdId!} />}
          {activeTab === 'chains' && <ChainsTab householdId={householdId!} />}
          {activeTab === 'classification' && <ClassificationTab householdId={householdId!} />}
          {activeTab === 'marketplace' && <MarketplaceTab householdId={householdId!} />}
        </div>
      </div>
    </div>
  );
}
