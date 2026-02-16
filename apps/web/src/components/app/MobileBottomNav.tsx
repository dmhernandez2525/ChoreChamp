import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Gift,
  Trophy,
  Settings,
  Menu,
  X,
  ClipboardList,
  Users,
  BarChart3,
  Gamepad2,
  BookOpen,
  Bell,
  Star,
  Swords,
  ShoppingBag,
  Building2,
  Code2,
  Heart,
  BarChart,
  MessageSquare,
  Sparkles,
  Landmark,
} from 'lucide-react';

interface MobileBottomNavProps {
  householdId: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function MobileBottomNav({ householdId }: MobileBottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const base = `/households/${householdId}`;

  const isActive = (path: string) => {
    if (path === base) return location.pathname === base;
    return location.pathname.startsWith(path);
  };

  const primaryTabs: NavItem[] = [
    { to: base, label: 'Home', icon: <Home className="h-5 w-5" /> },
    { to: `${base}/rewards`, label: 'Rewards', icon: <Gift className="h-5 w-5" /> },
  ];

  const secondaryTabs: NavItem[] = [
    { to: `${base}/leaderboard`, label: 'Ranks', icon: <Trophy className="h-5 w-5" /> },
    { to: `${base}/settings`, label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const menuItems: NavItem[] = [
    { to: base, label: 'Home', icon: <Home className="h-5 w-5" /> },
    { to: `${base}/chores/new`, label: 'Add Chore', icon: <ClipboardList className="h-5 w-5" /> },
    { to: `${base}/members`, label: 'Family', icon: <Users className="h-5 w-5" /> },
    { to: `${base}/rewards`, label: 'Rewards', icon: <Gift className="h-5 w-5" /> },
    { to: `${base}/leaderboard`, label: 'Leaderboard', icon: <Trophy className="h-5 w-5" /> },
    { to: `${base}/boss-battle`, label: 'Boss Battle', icon: <Swords className="h-5 w-5" /> },
    { to: `${base}/analytics`, label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { to: `${base}/arcade`, label: 'Arcade', icon: <Gamepad2 className="h-5 w-5" /> },
    { to: `${base}/templates`, label: 'Templates', icon: <BookOpen className="h-5 w-5" /> },
    { to: `${base}/activity`, label: 'Activity', icon: <Bell className="h-5 w-5" /> },
    { to: `${base}/collection`, label: 'Collection', icon: <Star className="h-5 w-5" /> },
    { to: `${base}/store`, label: 'Store', icon: <ShoppingBag className="h-5 w-5" /> },
    { to: `${base}/enterprise`, label: 'Enterprise', icon: <Building2 className="h-5 w-5" /> },
    { to: `${base}/developer`, label: 'Developer', icon: <Code2 className="h-5 w-5" /> },
    { to: `${base}/wellness`, label: 'Wellness', icon: <Heart className="h-5 w-5" /> },
    { to: `${base}/admin-analytics`, label: 'Admin', icon: <BarChart className="h-5 w-5" /> },
    { to: `${base}/community`, label: 'Community', icon: <MessageSquare className="h-5 w-5" /> },
    { to: `${base}/automation`, label: 'Automation', icon: <Sparkles className="h-5 w-5" /> },
    { to: `${base}/family-hub`, label: 'Family Hub', icon: <Users className="h-5 w-5" /> },
    { to: `${base}/financial`, label: 'Financial', icon: <Landmark className="h-5 w-5" /> },
    { to: `${base}/settings`, label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Bottom Sheet Overlay + Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-20 left-0 right-0 bg-[var(--app-surface)] border-t border-[var(--app-border)] rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <nav className="grid grid-cols-3 gap-3">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  aria-label={item.label}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors ${
                    isActive(item.to)
                      ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                      : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--app-surface)]/95 backdrop-blur-md border-t border-[var(--app-border)] safe-area-pb">
        <nav className="flex items-center justify-around h-16 px-2" aria-label="Bottom navigation">
          {/* Left tabs */}
          {primaryTabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors ${
                isActive(tab.to) ? 'text-[var(--app-accent)]' : 'text-[var(--app-text-muted)]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </Link>
          ))}

          {/* Center FAB */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={`flex items-center justify-center w-14 h-14 -mt-6 rounded-full border-4 border-[var(--app-surface)] shadow-lg transition-colors ${
              menuOpen
                ? 'bg-[var(--app-accent)] text-white'
                : 'bg-gradient-to-br from-[var(--app-accent)] to-[var(--primary-dark,var(--app-accent))] text-white'
            }`}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Right tabs */}
          {secondaryTabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors ${
                isActive(tab.to) ? 'text-[var(--app-accent)]' : 'text-[var(--app-text-muted)]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
