import { useState, useRef, useEffect } from 'react';
import { Button, cn } from '@chorechamp/ui';
import { NotificationBadge } from './NotificationBadge';
import { NotificationList } from './NotificationList';
import type { Notification } from './NotificationCard';

interface NotificationDropdownProps {
  notifications: Notification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClick?: (notification: Notification) => void;
  isLoading?: boolean;
}

export function NotificationDropdown({
  notifications,
  onRead,
  onReadAll,
  onClick,
  isLoading,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    onClick?.(notification);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <NotificationBadge count={unreadCount} />
      </Button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-96 max-h-[32rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
            'z-50'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            <NotificationList
              notifications={notifications.slice(0, 10)}
              onRead={onRead}
              onReadAll={onReadAll}
              onClick={handleNotificationClick}
              isLoading={isLoading}
            />
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="border-t border-gray-200 p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600"
              >
                View all {notifications.length} notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
