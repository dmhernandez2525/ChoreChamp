/**
 * Demo Mode Configuration
 *
 * When VITE_DEMO_MODE is set to 'true', the application runs in demo mode
 * which allows portfolio showcasing without requiring real authentication
 * or database connections.
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export type DemoRole = 'parent' | 'child';

export const DEMO_ROLES: { id: DemoRole; label: string; description: string; icon: string }[] = [
  {
    id: 'parent',
    label: 'Parent',
    description: 'Manage chores, approve completions, and set up rewards',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'child',
    label: 'Child',
    description: 'Complete chores, earn points, and redeem rewards',
    icon: '👧',
  },
];
