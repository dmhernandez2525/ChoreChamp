import { useState } from 'react';
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
} from 'lucide-react';

type FinancialTab = 'banking' | 'rotations' | 'chains' | 'classification' | 'marketplace';

function BankingTab() {
  return (
    <div>
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
        {[
          { label: 'Total Deposited', value: '$0.00' },
          { label: 'Pending', value: '$0.00' },
          { label: 'Active Configs', value: '0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              {stat.label}
            </div>
          </div>
        ))}
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
    </div>
  );
}

function RotationsTab() {
  return (
    <div>
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
    </div>
  );
}

function ChainsTab() {
  return (
    <div>
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
        {[
          { label: 'Active Chains', value: '0' },
          { label: 'Completed', value: '0' },
          { label: 'Total Steps', value: '0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}

function ClassificationTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Responsibilities vs Jobs
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Chores', value: '0' },
          { label: 'Responsibilities', value: '0' },
          { label: 'Jobs', value: '0' },
          { label: 'Unclassified', value: '0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              {stat.label}
            </div>
          </div>
        ))}
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
    </div>
  );
}

function MarketplaceTab() {
  return (
    <div>
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
        {[
          { label: 'Active', value: '0' },
          { label: 'Completed', value: '0' },
          { label: 'Points Traded', value: '0' },
          { label: 'Total Listings', value: '0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search marketplace..."
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === 'All' ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
              color: filter === 'All' ? 'var(--app-accent)' : 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div
        className="text-center py-12 rounded-lg"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      >
        <ShoppingCart className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
        <p style={{ color: 'var(--app-text-muted)' }}>No marketplace listings</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Post chores with point bounties for other family members to claim
        </p>
      </div>
    </div>
  );
}

export default function FinancialScheduling() {
  const { householdId } = useParams();
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
          {activeTab === 'banking' && <BankingTab />}
          {activeTab === 'rotations' && <RotationsTab />}
          {activeTab === 'chains' && <ChainsTab />}
          {activeTab === 'classification' && <ClassificationTab />}
          {activeTab === 'marketplace' && <MarketplaceTab />}
        </div>
      </div>
    </div>
  );
}
