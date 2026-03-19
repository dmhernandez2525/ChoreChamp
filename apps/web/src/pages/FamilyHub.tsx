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
  Loader2,
} from 'lucide-react';
import {
  useCalendarConnections,
  useCalendarEvents,
  useChatChannels,
  useChatMessages,
  useSendChatMessage,
  useChatUnreadCounts,
  usePhotoAlbums,
  useShareableAchievements,
  useProgressiveUnlocks,
} from '@chorechamp/api-client';

type FamilyHubTab = 'calendar' | 'chat' | 'photos' | 'sharing' | 'unlocks';

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2
        className="w-8 h-8 animate-spin mb-3"
        style={{ color: 'var(--app-accent)' }}
      />
      <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
        Loading {label}...
      </p>
    </div>
  );
}

function CalendarSyncTab({ householdId }: { householdId: string }) {
  const { data: connections, isLoading: loadingConnections, isError: connectionsError } = useCalendarConnections(householdId);
  const { data: events, isLoading: loadingEvents, isError: eventsError } = useCalendarEvents(householdId);

  const isLoading = loadingConnections || loadingEvents;
  const isError = connectionsError || eventsError;

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
        {['Google', 'Apple', 'Outlook', 'iCal'].map((provider) => {
          const isConnected = connections?.connections?.some(
            (c: { provider: string }) => c.provider.toLowerCase() === provider.toLowerCase()
          );
          return (
            <button
              key={provider}
              className="p-4 rounded-lg text-center transition-colors"
              style={{
                backgroundColor: isConnected ? 'var(--app-accent-soft)' : 'var(--app-surface)',
                border: isConnected
                  ? '2px solid var(--app-accent)'
                  : '1px solid var(--app-border)',
                color: 'var(--app-text)',
              }}
            >
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--app-accent)' }} />
              <div className="font-medium text-sm">{provider}</div>
              {isConnected && (
                <div className="text-xs mt-1" style={{ color: 'var(--app-accent)' }}>
                  Connected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSpinner label="calendar" />
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
        </div>
      ) : events?.events && events.events.length > 0 ? (
        <div className="space-y-3">
          {events.events.map((event: { id: string; title: string; startTime?: string; start?: string; assigneeName?: string }) => (
            <div
              key={event.id}
              className="p-4 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div>
                <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                  {event.title}
                </div>
                <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                  {event.startTime || event.start
                    ? new Date(event.startTime || event.start || '').toLocaleString()
                    : 'No date set'}
                </div>
              </div>
              {event.assigneeName && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                >
                  {event.assigneeName}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}

function FamilyChatTab({ householdId }: { householdId: string }) {
  const [message, setMessage] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const { data: channels, isLoading: loadingChannels, isError: channelsError } = useChatChannels(householdId);
  const { data: unreadCounts } = useChatUnreadCounts(householdId);
  const { data: messages, isLoading: loadingMessages, isError: messagesError } = useChatMessages(
    householdId,
    selectedChannelId || ''
  );
  const sendMessage = useSendChatMessage(householdId, selectedChannelId || '');

  const handleSend = () => {
    if (!message.trim() || !selectedChannelId) return;
    sendMessage.mutate(
      { content: message, type: 'text' as const },
      { onSuccess: () => setMessage('') }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

      {loadingChannels ? (
        <LoadingSpinner label="channels" />
      ) : channelsError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
        </div>
      ) : channels?.channels && channels.channels.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {channels.channels.map((channel: { id: string; name: string; type?: string }) => {
              const unread = unreadCounts?.unread?.find(
                (u: { channelId: string }) => u.channelId === channel.id
              );
              const isSelected = selectedChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors relative"
                  style={{
                    backgroundColor: isSelected ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
                    color: isSelected ? 'var(--app-accent)' : 'var(--app-text)',
                    border: isSelected ? '2px solid var(--app-accent)' : '1px solid var(--app-border)',
                  }}
                >
                  {channel.name}
                  {unread && unread.count > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                      style={{ backgroundColor: 'var(--app-accent)', color: 'white' }}
                    >
                      {unread.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="rounded-lg mb-4"
            style={{ backgroundColor: 'var(--app-surface-muted)', minHeight: '200px' }}
          >
            {!selectedChannelId ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <MessageCircle
                    className="w-10 h-10 mx-auto mb-2"
                    style={{ color: 'var(--app-text-muted)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                    Select a channel to view messages
                  </p>
                </div>
              </div>
            ) : loadingMessages ? (
              <LoadingSpinner label="messages" />
            ) : messagesError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 font-medium">Something went wrong</p>
                <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
              </div>
            ) : messages?.messages && messages.messages.length > 0 ? (
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {messages.messages.map((msg: { id: string; senderName?: string; content: string; createdAt?: string }) => (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>
                        {msg.senderName || 'Unknown'}
                      </span>
                      {msg.createdAt && (
                        <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--app-text)' }}>
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <MessageCircle
                    className="w-10 h-10 mx-auto mb-2"
                    style={{ color: 'var(--app-text-muted)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                    No messages yet in this channel
                  </p>
                </div>
              </div>
            )}
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
                onKeyDown={handleKeyDown}
                placeholder={selectedChannelId ? 'Type a message...' : 'Select a channel first...'}
                disabled={!selectedChannelId}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--app-surface-muted)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text)',
                  opacity: selectedChannelId ? 1 : 0.5,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || !selectedChannelId || sendMessage.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--app-accent)',
                  color: 'white',
                  opacity: !message.trim() || !selectedChannelId ? 0.5 : 1,
                }}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
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
                  No chat channels yet. Create one to start chatting with your family.
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
                disabled
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--app-surface-muted)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text)',
                  opacity: 0.5,
                }}
              />
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--app-accent)', color: 'white', opacity: 0.5 }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PhotoAlbumTab({ householdId }: { householdId: string }) {
  const { data: albums, isLoading, isError } = usePhotoAlbums(householdId);
  const [activeFilter, setActiveFilter] = useState('All');

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
            onClick={() => setActiveFilter(filter)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeFilter === filter ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
              color: activeFilter === filter ? 'var(--app-accent)' : 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner label="photo albums" />
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
        </div>
      ) : albums?.albums && albums.albums.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.albums
            .filter((album) =>
              activeFilter === 'All' ? true : (album as unknown as Record<string, unknown>).category === activeFilter
            )
            .map((album) => (
              <div
                key={album.id}
                className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
              >
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--app-surface-muted)' }}
                >
                  {album.coverPhotoUrl ? (
                    <img
                      src={album.coverPhotoUrl}
                      alt={album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-10 h-10" style={{ color: 'var(--app-text-muted)' }} />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                    {album.name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--app-text-muted)' }}>
                    {album.photoCount ?? 0} photos
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}

function ShareableAchievementsTab({ householdId }: { householdId: string }) {
  const { data: achievements, isLoading, isError } = useShareableAchievements(householdId);

  const achievementList = achievements?.achievements;
  const sharedCount = achievementList?.filter((a) => a.shareCount > 0)?.length ?? 0;
  const totalViews = achievementList?.reduce((sum: number, a) => sum + (a.viewCount ?? 0), 0) ?? 0;
  const cardCount = achievementList?.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Shareable Achievements
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Shared', value: String(sharedCount) },
          { label: 'Views', value: String(totalViews) },
          { label: 'Cards', value: String(cardCount) },
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
        {['Minimal', 'Colorful', 'Animated', 'Classic'].map((cardStyle) => (
          <button
            key={cardStyle}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {cardStyle}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner label="achievements" />
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
        </div>
      ) : achievementList && achievementList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievementList.map((achievement: { id: string; title: string; description?: string; badgeUrl?: string; earnedAt?: string; memberName?: string }) => (
            <div
              key={achievement.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div className="flex items-start gap-3">
                {achievement.badgeUrl ? (
                  <img src={achievement.badgeUrl} alt="" className="w-10 h-10 rounded" />
                ) : (
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: 'var(--app-accent-soft)' }}
                  >
                    <Share2 className="w-5 h-5" style={{ color: 'var(--app-accent)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                    {achievement.title}
                  </div>
                  {achievement.description && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--app-text-muted)' }}>
                      {achievement.description}
                    </p>
                  )}
                  {achievement.memberName && (
                    <p className="text-xs mt-1" style={{ color: 'var(--app-accent)' }}>
                      {achievement.memberName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}

function ProgressiveUnlocksTab({ householdId }: { householdId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  const { data: unlocks, isLoading, isError } = useProgressiveUnlocks(householdId, {
    category: activeCategory,
  });

  const unlockList = unlocks?.unlocks;
  const filteredUnlocks = unlockList?.filter((u: { name?: string; title?: string }) => {
    if (!searchTerm) return true;
    const label = u.name || u.title || '';
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCount = unlockList?.length ?? 0;
  const unlockedCount = unlockList?.filter((u) => (u as unknown as Record<string, unknown>).unlocked)?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const categories = ['Feature', 'Cosmetic', 'Gamification', 'Social', 'Advanced'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Progressive Unlocks
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: String(totalCount) },
          { label: 'Unlocked', value: String(unlockedCount) },
          { label: 'Progress', value: `${progressPct}%` },
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setActiveCategory(activeCategory === category ? undefined : category)
            }
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === category ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
              color: activeCategory === category ? 'var(--app-accent)' : 'var(--app-text)',
              border: activeCategory === category
                ? '2px solid var(--app-accent)'
                : '1px solid var(--app-border)',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner label="unlocks" />
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
        </div>
      ) : filteredUnlocks && filteredUnlocks.length > 0 ? (
        <div className="space-y-3">
          {filteredUnlocks.map(
            (unlock: {
              id: string;
              name?: string;
              title?: string;
              description?: string;
              unlocked?: boolean;
              progress?: number;
              requirement?: number;
              category?: string;
            }) => (
              <div
                key={unlock.id}
                className="p-4 rounded-lg flex items-center gap-4"
                style={{
                  backgroundColor: 'var(--app-surface-muted)',
                  border: '1px solid var(--app-border)',
                  opacity: unlock.unlocked ? 1 : 0.7,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: unlock.unlocked ? 'var(--app-accent-soft)' : 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                  }}
                >
                  <Unlock
                    className="w-5 h-5"
                    style={{ color: unlock.unlocked ? 'var(--app-accent)' : 'var(--app-text-muted)' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                    {unlock.name || unlock.title}
                  </div>
                  {unlock.description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--app-text-muted)' }}>
                      {unlock.description}
                    </p>
                  )}
                  {unlock.requirement != null && unlock.progress != null && !unlock.unlocked && (
                    <div className="mt-2">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--app-border)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: 'var(--app-accent)',
                            width: `${Math.min(100, Math.round((unlock.progress / unlock.requirement) * 100))}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--app-text-muted)' }}>
                        {unlock.progress} / {unlock.requirement}
                      </p>
                    </div>
                  )}
                </div>
                {unlock.unlocked && (
                  <span
                    className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                  >
                    Unlocked
                  </span>
                )}
                {unlock.category && (
                  <span
                    className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--app-surface)', color: 'var(--app-text-muted)' }}
                  >
                    {unlock.category}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      ) : (
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
      )}
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
          {activeTab === 'calendar' && <CalendarSyncTab householdId={householdId!} />}
          {activeTab === 'chat' && <FamilyChatTab householdId={householdId!} />}
          {activeTab === 'photos' && <PhotoAlbumTab householdId={householdId!} />}
          {activeTab === 'sharing' && <ShareableAchievementsTab householdId={householdId!} />}
          {activeTab === 'unlocks' && <ProgressiveUnlocksTab householdId={householdId!} />}
        </div>
      </div>
    </div>
  );
}
