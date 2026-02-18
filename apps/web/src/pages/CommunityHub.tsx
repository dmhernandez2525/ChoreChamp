import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MessageSquare,
  Trophy,
  Share2,
  UserPlus,
  Calendar,
  ChevronLeft,
  Plus,
  Users,
  Search,
} from 'lucide-react';

type CommunityTab = 'forums' | 'challenges' | 'social' | 'friends' | 'events';

function ForumsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Community Forums
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['General', 'Tips', 'Questions', 'Showcase', 'Feedback', 'Off Topic'].map((category) => (
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
        <MessageSquare
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <p style={{ color: 'var(--app-text-muted)' }}>No forum posts yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Start a conversation with the community
        </p>
      </div>
    </div>
  );
}

function SocialChallengesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Social Challenges
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
        >
          <Plus className="w-4 h-4" />
          Create Challenge
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Active Challenges
          </div>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Participating
          </div>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Won
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Competitive', 'Collaborative', 'Milestone'].map((type) => (
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
        <Trophy
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <p style={{ color: 'var(--app-text-muted)' }}>No challenges yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Create or join a challenge to compete with others
        </p>
      </div>
    </div>
  );
}

function SocialFeedTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Social Feed
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Public', 'Friends Only', 'My Posts'].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              color: 'var(--app-text)',
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
        <Share2
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <p style={{ color: 'var(--app-text-muted)' }}>No posts in your feed yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Share your achievements or follow friends to see their posts
        </p>
      </div>
    </div>
  );
}

function FriendsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Friends &amp; Connections
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Friends
          </div>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Pending
          </div>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Suggestions
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search for friends..."
          className="w-full pl-10 pr-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
        />
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--app-text-muted)' }}>
            Friend Requests
          </h3>
          <div
            className="text-center py-8 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface-muted)' }}
          >
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              No pending friend requests
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--app-text-muted)' }}>
            Your Friends
          </h3>
          <div
            className="text-center py-8 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface-muted)' }}
          >
            <Users
              className="w-10 h-10 mx-auto mb-2"
              style={{ color: 'var(--app-text-muted)' }}
            />
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              No friends yet
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--app-text-muted)' }}>
            Suggested
          </h3>
          <div
            className="text-center py-8 rounded-lg"
            style={{ backgroundColor: 'var(--app-surface-muted)' }}
          >
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              No suggestions available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityEventsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Community Events
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Cleanup', 'Fundraiser', 'Competition', 'Workshop', 'Social', 'Other'].map((type) => (
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Upcoming Events
          </div>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
            0
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Participating
          </div>
        </div>
      </div>

      <div
        className="text-center py-12 rounded-lg"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      >
        <Calendar
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: 'var(--app-text-muted)' }}
        />
        <p style={{ color: 'var(--app-text-muted)' }}>No upcoming events</p>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
          Create or join community events in your area
        </p>
      </div>
    </div>
  );
}

export default function CommunityHub() {
  const { householdId } = useParams();
  const [activeTab, setActiveTab] = useState<CommunityTab>('forums');

  const tabs: Array<{ id: CommunityTab; label: string; icon: typeof MessageSquare }> = [
    { id: 'forums', label: 'Forums', icon: MessageSquare },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'friends', label: 'Friends', icon: UserPlus },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link
            to={`/household/${householdId}`}
            className="inline-flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--app-text-muted)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Household
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--app-text)' }}>
            Community Hub
          </h1>
          <p style={{ color: 'var(--app-text-muted)' }}>
            Forums, challenges, social sharing, and community events
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
          {activeTab === 'forums' && <ForumsTab />}
          {activeTab === 'challenges' && <SocialChallengesTab />}
          {activeTab === 'social' && <SocialFeedTab />}
          {activeTab === 'friends' && <FriendsTab />}
          {activeTab === 'events' && <CommunityEventsTab />}
        </div>
      </div>
    </div>
  );
}
