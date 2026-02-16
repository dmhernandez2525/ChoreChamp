import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar,
  MessageCircle,
  Image,
  Share2,
  Unlock,
  ChevronLeft,
  Plus,
  Send,
  Search,
} from 'lucide-react';

type FamilyHubTab = 'calendar' | 'chat' | 'photos' | 'sharing' | 'unlocks';

function CalendarSyncTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Calendar Sync
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Connect Calendar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['Google', 'Apple', 'Outlook', 'iCal'].map((provider) => (
          <button
            key={provider}
            className="p-4 rounded-lg text-center transition-colors"
            style={{
              backgroundColor: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
            }}
          >
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--app-accent)' }} />
            <div className="font-medium text-sm">{provider}</div>
          </button>
        ))}
      </div>

      <div
        className="text-center py-12 rounded-lg"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      >
        <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
        <p style={{ color: 'var(--app-text-muted)' }}>No calendars connected</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Connect your calendar to automatically sync chore schedules
        </p>
      </div>
    </div>
  );
}

function FamilyChatTab() {
  const [message, setMessage] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Family Chat
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Household', 'Direct', 'Chore Discussion'].map((type) => (
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
        className="rounded-lg mb-4"
        style={{ backgroundColor: 'var(--app-surface-muted)', minHeight: '200px' }}
      >
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <MessageCircle
              className="w-10 h-10 mx-auto mb-2"
              style={{ color: 'var(--app-text-muted)' }}
            />
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              No messages yet
            </p>
          </div>
        </div>
      </div>

      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
            }}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoAlbumTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Family Photo Album
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          New Album
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Chore Completions', 'Achievements', 'Milestones', 'General'].map((filter) => (
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
        <Image className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
        <p style={{ color: 'var(--app-text-muted)' }}>No photo albums yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Create albums to collect chore completion photos and family memories
        </p>
      </div>
    </div>
  );
}

function ShareableAchievementsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Shareable Achievements
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Shared', value: '0' },
          { label: 'Views', value: '0' },
          { label: 'Cards', value: '0' },
          { label: 'Platforms', value: '6' },
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

      <div className="flex flex-wrap gap-2 mb-6">
        {['Minimal', 'Colorful', 'Animated', 'Classic'].map((style) => (
          <button
            key={style}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {style}
          </button>
        ))}
      </div>

      <div
        className="text-center py-12 rounded-lg"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      >
        <Share2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
        <p style={{ color: 'var(--app-text-muted)' }}>No shareable achievements yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Earn badges and hit milestones to create shareable achievement cards
        </p>
      </div>
    </div>
  );
}

function ProgressiveUnlocksTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Progressive Unlocks
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: '0' },
          { label: 'Unlocked', value: '0' },
          { label: 'Progress', value: '0%' },
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
          placeholder="Search unlocks..."
          className="w-full pl-10 pr-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Feature', 'Cosmetic', 'Gamification', 'Social', 'Advanced'].map((category) => (
          <button
            key={category}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <div
        className="text-center py-12 rounded-lg"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      >
        <Unlock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-text-muted)' }} />
        <p style={{ color: 'var(--app-text-muted)' }}>No unlocks available yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Complete chores, earn streaks, and level up to unlock new features
        </p>
      </div>
    </div>
  );
}

export default function FamilyHub() {
  const { householdId } = useParams();
  const [activeTab, setActiveTab] = useState<FamilyHubTab>('calendar');

  const tabs: Array<{ id: FamilyHubTab; label: string; icon: typeof Calendar }> = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'sharing', label: 'Share', icon: Share2 },
    { id: 'unlocks', label: 'Unlocks', icon: Unlock },
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
            Family Hub
          </h1>
          <p style={{ color: 'var(--app-text-muted)' }}>
            Calendar sync, family chat, photo albums, achievements, and unlocks
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
          {activeTab === 'calendar' && <CalendarSyncTab />}
          {activeTab === 'chat' && <FamilyChatTab />}
          {activeTab === 'photos' && <PhotoAlbumTab />}
          {activeTab === 'sharing' && <ShareableAchievementsTab />}
          {activeTab === 'unlocks' && <ProgressiveUnlocksTab />}
        </div>
      </div>
    </div>
  );
}
