import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, cn } from '@chorechamp/ui';
import { NotificationList, NotificationPreferences } from '../components/notifications';
import type { Notification } from '../components/notifications';

// Demo notifications for development
const demoNotifications: Notification[] = [
  {
    id: '1',
    type: 'chore_reminder',
    title: 'Chore Due Soon',
    message: 'Don\'t forget to take out the trash! It\'s due in 30 minutes.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    actionUrl: '/households/1/chores/1',
  },
  {
    id: '2',
    type: 'badge_earned',
    title: 'New Badge Earned!',
    message: 'Congratulations! You earned the "Early Bird" badge for completing chores before 9am.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    actionUrl: '/households/1/members/1/badges',
  },
  {
    id: '3',
    type: 'streak_at_risk',
    title: 'Streak at Risk!',
    message: 'Your 7-day streak will end if you don\'t complete a chore today!',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    actionUrl: '/households/1/members/1/streaks',
  },
  {
    id: '4',
    type: 'approval_needed',
    title: 'Approval Needed',
    message: 'Emma has submitted "Clean bedroom" for approval.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actionUrl: '/households/1',
  },
  {
    id: '5',
    type: 'reward_redeemed',
    title: 'Reward Redeemed',
    message: 'You redeemed "Extra Screen Time" for 100 points.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    actionUrl: '/households/1/rewards',
  },
  {
    id: '6',
    type: 'chore_completed',
    title: 'Chore Completed',
    message: 'Jake completed "Wash dishes" and earned 15 points!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: '7',
    type: 'boss_battle',
    title: 'Boss Battle Progress',
    message: 'Your family dealt 50 damage to "The Dust Dragon"! Keep going!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    actionUrl: '/households/1/boss-battle',
  },
  {
    id: '8',
    type: 'family_goal',
    title: 'Family Goal Achieved!',
    message: 'Your family completed "100 chores this month"! Time to celebrate!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

type TabType = 'all' | 'unread' | 'settings';

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleReadAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeTab === 'settings' ? (
            <div className="p-6">
              <NotificationPreferences
                onSave={(prefs) => {
                  console.log('Saving preferences:', prefs);
                }}
              />
            </div>
          ) : (
            <NotificationList
              notifications={filteredNotifications}
              onRead={handleRead}
              onReadAll={handleReadAll}
            />
          )}
        </div>
      </main>
    </div>
  );
}
