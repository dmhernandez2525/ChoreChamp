import { useState, useEffect } from 'react';
import { Repeat, Plus, TrendingUp, AlertCircle, Inbox, Send, Clock, History } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { Member, TodayChore, TradeListResponse, TradeStatsResponse, TradeWithDetails } from '@chorechamp/types';
import { TradeCard } from './TradeCard';
import { CreateTradeModal } from './CreateTradeModal';

interface TradeCenterProps {
  householdId: string;
  currentMember: Member;
  members: Member[];
  todayChores: TodayChore[];
}

type TabType = 'incoming' | 'outgoing' | 'approval' | 'history';

export function TradeCenter({
  householdId,
  currentMember,
  members,
  todayChores,
}: TradeCenterProps) {
  const [trades, setTrades] = useState<TradeListResponse | null>(null);
  const [stats, setStats] = useState<TradeStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isParent = currentMember.role === 'parent';

  useEffect(() => {
    loadTrades();
    loadStats();
  }, [householdId]);

  async function loadTrades() {
    try {
      setIsLoading(true);
      const data = await apiClient.getTrades(householdId);
      setTrades(data);
    } catch (err) {
      console.error('Failed to load trades:', err);
      setError('Failed to load trades');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await apiClient.getTradeStats(householdId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load trade stats:', err);
    }
  }

  async function handleAccept(tradeId: string) {
    try {
      setActionLoading(tradeId);
      setError(null);
      await apiClient.respondToTrade(householdId, tradeId, { accept: true });
      await loadTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept trade');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(tradeId: string) {
    try {
      setActionLoading(tradeId);
      setError(null);
      await apiClient.respondToTrade(householdId, tradeId, { accept: false });
      await loadTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline trade');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove(tradeId: string) {
    try {
      setActionLoading(tradeId);
      setError(null);
      await apiClient.approveTrade(householdId, tradeId, { approved: true });
      await loadTrades();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve trade');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(tradeId: string, reason?: string) {
    try {
      setActionLoading(tradeId);
      setError(null);
      await apiClient.approveTrade(householdId, tradeId, {
        approved: false,
        rejectionReason: reason,
      });
      await loadTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject trade');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(tradeId: string) {
    try {
      setActionLoading(tradeId);
      setError(null);
      await apiClient.cancelTrade(householdId, tradeId);
      await loadTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel trade');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateTrade(data: Parameters<typeof apiClient.createTrade>[1]) {
    await apiClient.createTrade(householdId, data);
    await loadTrades();
    await loadStats();
  }

  // Get chores assigned to current member
  const myChores = todayChores.filter(
    (c) => c.assignedTo === currentMember.id && !c.isCompleted
  );

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: 'incoming',
      label: 'Incoming',
      icon: <Inbox className="w-4 h-4" />,
      count: trades?.incoming.length || 0,
    },
    {
      key: 'outgoing',
      label: 'Outgoing',
      icon: <Send className="w-4 h-4" />,
      count: trades?.outgoing.length || 0,
    },
    ...(isParent
      ? [
          {
            key: 'approval' as TabType,
            label: 'Pending Approval',
            icon: <Clock className="w-4 h-4" />,
            count: trades?.pendingApproval.length || 0,
          },
        ]
      : []),
    {
      key: 'history',
      label: 'History',
      icon: <History className="w-4 h-4" />,
      count: trades?.history.length || 0,
    },
  ];

  const getCurrentTrades = (): TradeWithDetails[] => {
    if (!trades) return [];
    switch (activeTab) {
      case 'incoming':
        return trades.incoming;
      case 'outgoing':
        return trades.outgoing;
      case 'approval':
        return trades.pendingApproval;
      case 'history':
        return trades.history;
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Repeat className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Chore Trading
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trade chores with your siblings
            </p>
          </div>
        </div>
        {!isParent && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Trade
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Successful Trades</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {stats.successfulTrades}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Trades Initiated</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {stats.totalTradesInitiated}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Points Gained</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              +{stats.pointsGainedFromTrades}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Points Spent</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              -{stats.pointsSpentOnTrades}
            </p>
          </div>
        </div>
      )}

      {/* Most traded with */}
      {stats?.mostTradedWith && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <TrendingUp className="w-4 h-4" />
          <span>
            Most traded with: <span className="font-medium">{stats.mostTradedWith.memberName}</span>
            {' '}({stats.mostTradedWith.tradeCount} trades)
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Trade list */}
      <div className="space-y-4">
        {getCurrentTrades().length === 0 ? (
          <div className="text-center py-12">
            <Repeat className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'incoming' && 'No incoming trade requests'}
              {activeTab === 'outgoing' && 'No outgoing trade requests'}
              {activeTab === 'approval' && 'No trades pending approval'}
              {activeTab === 'history' && 'No trade history yet'}
            </p>
            {activeTab === 'outgoing' && !isParent && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Propose a new trade
              </button>
            )}
          </div>
        ) : (
          getCurrentTrades().map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              currentMemberId={currentMember.id}
              isParent={isParent}
              onAccept={() => handleAccept(trade.id)}
              onDecline={() => handleDecline(trade.id)}
              onApprove={() => handleApprove(trade.id)}
              onReject={() => handleReject(trade.id)}
              onCancel={() => handleCancel(trade.id)}
              isLoading={actionLoading === trade.id}
            />
          ))
        )}
      </div>

      {/* Create trade modal */}
      {showCreateModal && (
        <CreateTradeModal
          currentMember={currentMember}
          members={members}
          myChores={myChores}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTrade}
        />
      )}
    </div>
  );
}
