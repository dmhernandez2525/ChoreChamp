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
  Loader2,
  Heart,
  Eye,
  MessageCircle,
} from 'lucide-react';
import {
  useForumPosts,
  useSocialChallenges,
  useSocialFeed,
  useFriends,
  useFriendSuggestions,
  useCommunityEvents,
} from '@chorechamp/api-client';

type CommunityTab = 'forums' | 'challenges' | 'social' | 'friends' | 'events';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2
        className="w-8 h-8 animate-spin"
        style={{ color: 'var(--app-accent)' }}
      />
    </div>
  );
}

function ForumsTab({ householdId }: { householdId: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useForumPosts(householdId, {
    category: selectedCategory,
  });

  const categories = ['General', 'Tips', 'Questions', 'Showcase', 'Feedback', 'Off Topic'];
  const categoryMap: Record<string, string> = {
    'General': 'general',
    'Tips': 'tips',
    'Questions': 'questions',
    'Showcase': 'showcase',
    'Feedback': 'feedback',
    'Off Topic': 'off_topic',
  };

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
        {categories.map((category) => {
          const catValue = categoryMap[category];
          const isActive = selectedCategory === catValue;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(isActive ? undefined : catValue)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--app-accent)' : 'var(--app-surface-muted)',
                color: isActive ? 'white' : 'var(--app-text)',
                border: isActive ? '1px solid var(--app-accent)' : '1px solid var(--app-border)',
              }}
            >
              {category}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.posts?.length ? (
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
      ) : (
        <div className="space-y-3">
          {data.posts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-lg transition-colors cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: 'var(--app-surface-muted)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {post.isPinned && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                      >
                        Pinned
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--app-surface)',
                        color: 'var(--app-text-muted)',
                        border: '1px solid var(--app-border)',
                      }}
                    >
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>
                    {post.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
                    by {post.authorName}
                  </p>
                </div>
                <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  <Heart className="w-3.5 h-3.5" /> {post.likeCount}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  <MessageCircle className="w-3.5 h-3.5" /> {post.replyCount}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  <Eye className="w-3.5 h-3.5" /> {post.viewCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialChallengesTab({ householdId }: { householdId: string }) {
  const [statusFilter, _setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = useSocialChallenges(householdId, statusFilter);

  const challengeTypes = ['Competitive', 'Collaborative', 'Milestone'];
  const activeChallenges = data?.challenges?.filter((c) => c.status === 'active') ?? [];
  const participatingCount = data?.challenges?.length ?? 0;

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
            {activeChallenges.length}
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
            {participatingCount}
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
            {data?.challenges?.filter((c) => c.status === 'completed').length ?? 0}
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Won
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {challengeTypes.map((type) => (
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
        <LoadingSpinner />
      ) : !data?.challenges?.length ? (
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
      ) : (
        <div className="space-y-3">
          {data.challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="p-4 rounded-lg cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: 'var(--app-surface-muted)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: challenge.status === 'active' ? '#22c55e20' : 'var(--app-surface)',
                        color: challenge.status === 'active' ? '#22c55e' : 'var(--app-text-muted)',
                        border: '1px solid',
                        borderColor: challenge.status === 'active' ? '#22c55e40' : 'var(--app-border)',
                      }}
                    >
                      {challenge.status}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: 'var(--app-surface)',
                        color: 'var(--app-text-muted)',
                        border: '1px solid var(--app-border)',
                      }}
                    >
                      {challenge.challengeType}
                    </span>
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>
                    {challenge.title}
                  </h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--app-text-muted)' }}>
                    {challenge.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                <span>
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  {challenge.participantCount} participants
                </span>
                <span>
                  {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                </span>
                {challenge.prize && (
                  <span>
                    <Trophy className="w-3.5 h-3.5 inline mr-1" />
                    {challenge.prize}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialFeedTab({ householdId }: { householdId: string }) {
  const [visibility, setVisibility] = useState<string | undefined>(undefined);
  const { data, isLoading } = useSocialFeed(householdId, { visibility });

  const filters = ['Public', 'Friends Only', 'My Posts'];
  const filterMap: Record<string, string | undefined> = {
    'Public': 'public',
    'Friends Only': 'friends',
    'My Posts': 'private',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Social Feed
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => {
          const filterValue = filterMap[filter];
          const isActive = visibility === filterValue;
          return (
            <button
              key={filter}
              onClick={() => setVisibility(isActive ? undefined : filterValue)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--app-accent)' : 'var(--app-surface-muted)',
                color: isActive ? 'white' : 'var(--app-text)',
                border: isActive ? '1px solid var(--app-accent)' : '1px solid var(--app-border)',
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.posts?.length ? (
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
      ) : (
        <div className="space-y-4">
          {data.posts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--app-surface-muted)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                >
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>
                    {post.authorName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: 'var(--app-surface)',
                    color: 'var(--app-text-muted)',
                    border: '1px solid var(--app-border)',
                  }}
                >
                  {post.shareType.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--app-text)' }}>
                {post.title}
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--app-text-muted)' }}>
                {post.content}
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> {post.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FriendsTab({ householdId }: { householdId: string }) {
  const { data: friendsData, isLoading: friendsLoading } = useFriends(householdId);
  const { data: suggestionsData, isLoading: suggestionsLoading } = useFriendSuggestions(householdId);

  const isLoading = friendsLoading || suggestionsLoading;
  const friends = friendsData?.friends ?? [];
  const pending = friendsData?.pending ?? [];
  const suggestions = suggestionsData?.suggestions ?? [];

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
            {friends.length}
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
            {pending.length}
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
            {suggestions.length}
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

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--app-text-muted)' }}>
              Friend Requests
            </h3>
            {!pending.length ? (
              <div
                className="text-center py-8 rounded-lg"
                style={{ backgroundColor: 'var(--app-surface-muted)' }}
              >
                <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                  No pending friend requests
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--app-surface-muted)',
                      border: '1px solid var(--app-border)',
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                        {req.requesterHouseholdName}
                      </p>
                      {req.message && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
                          {req.message}
                        </p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-xs rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 text-xs rounded-lg font-medium"
                        style={{
                          backgroundColor: 'var(--app-surface)',
                          color: 'var(--app-text-muted)',
                          border: '1px solid var(--app-border)',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--app-text-muted)' }}>
              Your Friends
            </h3>
            {!friends.length ? (
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
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--app-surface-muted)',
                      border: '1px solid var(--app-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                      >
                        {friend.recipientHouseholdName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                          {friend.recipientHouseholdName}
                        </p>
                        {friend.connectedAt && (
                          <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                            Connected {new Date(friend.connectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--app-text-muted)' }}>
              Suggested
            </h3>
            {!suggestions.length ? (
              <div
                className="text-center py-8 rounded-lg"
                style={{ backgroundColor: 'var(--app-surface-muted)' }}
              >
                <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                  No suggestions available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.householdId}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--app-surface-muted)',
                      border: '1px solid var(--app-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                      >
                        {suggestion.householdName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                          {suggestion.householdName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                          {suggestion.memberCount} members
                          {suggestion.mutualFriends > 0 && ` · ${suggestion.mutualFriends} mutual`}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                          {suggestion.reason}
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-3 py-1 text-xs rounded-lg font-medium"
                      style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CommunityEventsTab({ householdId }: { householdId: string }) {
  const { data, isLoading } = useCommunityEvents(householdId);

  const eventTypes = ['Cleanup', 'Fundraiser', 'Competition', 'Workshop', 'Social', 'Other'];
  const upcomingEvents = data?.events?.filter(
    (e) => e.status === 'published' || e.status === 'active'
  ) ?? [];

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
        {eventTypes.map((type) => (
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
            {upcomingEvents.length}
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
            {data?.total ?? 0}
          </div>
          <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Total Events
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.events?.length ? (
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
      ) : (
        <div className="space-y-3">
          {data.events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-lg cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: 'var(--app-surface-muted)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: event.status === 'active' ? '#22c55e20' : 'var(--app-surface)',
                        color: event.status === 'active' ? '#22c55e' : 'var(--app-text-muted)',
                        border: '1px solid',
                        borderColor: event.status === 'active' ? '#22c55e40' : 'var(--app-border)',
                      }}
                    >
                      {event.status}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: 'var(--app-surface)',
                        color: 'var(--app-text-muted)',
                        border: '1px solid var(--app-border)',
                      }}
                    >
                      {event.eventType}
                    </span>
                    {event.isVirtual && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: '#3b82f620',
                          color: '#3b82f6',
                          border: '1px solid #3b82f640',
                        }}
                      >
                        Virtual
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--app-text)' }}>
                    {event.title}
                  </h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--app-text-muted)' }}>
                    {event.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                <span>
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
                {event.location && (
                  <span>{event.location}</span>
                )}
                <span>
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  {event.currentParticipants}
                  {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} joined
                </span>
                <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  by {event.organizerName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
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
          {activeTab === 'forums' && <ForumsTab householdId={householdId!} />}
          {activeTab === 'challenges' && <SocialChallengesTab householdId={householdId!} />}
          {activeTab === 'social' && <SocialFeedTab householdId={householdId!} />}
          {activeTab === 'friends' && <FriendsTab householdId={householdId!} />}
          {activeTab === 'events' && <CommunityEventsTab householdId={householdId!} />}
        </div>
      </div>
    </div>
  );
}
