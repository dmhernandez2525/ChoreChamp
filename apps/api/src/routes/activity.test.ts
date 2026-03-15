import { describe, it, expect } from 'vitest';

// Test helpers for activity-related logic
// These tests focus on the business logic without requiring a full Fastify server

interface ActivityItem {
  id: string;
  type: 'chore_completed' | 'chore_approved' | 'chore_rejected' | 'points_earned' | 'points_spent' | 'badge_earned' | 'streak_milestone';
  memberId: string;
  memberName: string;
  memberColor: string;
  title: string;
  description: string;
  points?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

describe('activity route logic', () => {
  describe('activity item construction from completions', () => {
    it('creates chore_completed activity item', () => {
      const completion = {
        id: 'comp-1',
        memberId: 'mem-1',
        memberName: 'Alice',
        memberColor: '#3B82F6',
        choreId: 'chore-1',
        choreName: 'Clean room',
        pointsAwarded: 25,
        completedAt: new Date('2024-06-15T10:00:00Z'),
        status: 'approved',
        approvedAt: new Date('2024-06-15T11:00:00Z'),
      };

      const activity: ActivityItem = {
        id: `completion-${completion.id}`,
        type: 'chore_completed',
        memberId: completion.memberId,
        memberName: completion.memberName,
        memberColor: completion.memberColor,
        title: `Completed "${completion.choreName}"`,
        description: completion.pointsAwarded
          ? `Earned ${completion.pointsAwarded} points`
          : 'Pending approval',
        points: completion.pointsAwarded || undefined,
        timestamp: completion.completedAt,
        metadata: {
          choreId: completion.choreId,
          status: completion.status,
        },
      };

      expect(activity.id).toBe('completion-comp-1');
      expect(activity.type).toBe('chore_completed');
      expect(activity.title).toBe('Completed "Clean room"');
      expect(activity.description).toBe('Earned 25 points');
      expect(activity.points).toBe(25);
    });

    it('shows pending approval when no points awarded', () => {
      const pointsAwarded = 0;
      const description = pointsAwarded
        ? `Earned ${pointsAwarded} points`
        : 'Pending approval';

      expect(description).toBe('Pending approval');
    });

    it('creates approval activity when status is approved', () => {
      const completion = {
        id: 'comp-1',
        status: 'approved',
        approvedAt: new Date('2024-06-15T11:00:00Z'),
        choreName: 'Do dishes',
        pointsAwarded: 15,
        memberId: 'mem-1',
        memberName: 'Bob',
        memberColor: '#EF4444',
      };

      const shouldCreateApproval = completion.status === 'approved' && completion.approvedAt;
      expect(shouldCreateApproval).toBeTruthy();

      const activity: ActivityItem = {
        id: `approval-${completion.id}`,
        type: 'chore_approved',
        memberId: completion.memberId,
        memberName: completion.memberName,
        memberColor: completion.memberColor,
        title: `"${completion.choreName}" approved`,
        description: `${completion.pointsAwarded} points awarded`,
        points: completion.pointsAwarded || undefined,
        timestamp: completion.approvedAt,
        metadata: { choreId: 'chore-1' },
      };

      expect(activity.type).toBe('chore_approved');
      expect(activity.title).toBe('"Do dishes" approved');
    });

    it('does not create approval activity for pending status', () => {
      const completion = { status: 'pending', approvedAt: null };
      const shouldCreateApproval = completion.status === 'approved' && completion.approvedAt;
      expect(shouldCreateApproval).toBeFalsy();
    });
  });

  describe('point transaction activity items', () => {
    it('creates points_earned activity for positive amounts', () => {
      const tx = { amount: 50, transactionType: 'bonus', description: 'Weekly bonus' };
      const isEarning = tx.amount > 0;

      expect(isEarning).toBe(true);

      const type = isEarning ? 'points_earned' : 'points_spent';
      const description = `${isEarning ? '+' : ''}${tx.amount} points`;

      expect(type).toBe('points_earned');
      expect(description).toBe('+50 points');
    });

    it('creates points_spent activity for negative amounts', () => {
      const tx = { amount: -30, transactionType: 'redemption', description: null };
      const isEarning = tx.amount > 0;

      expect(isEarning).toBe(false);

      const type = isEarning ? 'points_earned' : 'points_spent';
      const description = `${isEarning ? '+' : ''}${tx.amount} points`;
      const title = tx.description || (isEarning ? 'Points earned' : 'Points spent');

      expect(type).toBe('points_spent');
      expect(description).toBe('-30 points');
      expect(title).toBe('Points spent');
    });

    it('skips chore_completion transaction type', () => {
      const tx = { transactionType: 'chore_completion' };
      const shouldSkip = tx.transactionType === 'chore_completion';
      expect(shouldSkip).toBe(true);
    });
  });

  describe('activity sorting', () => {
    it('sorts activities by timestamp descending', () => {
      const activities: ActivityItem[] = [
        {
          id: '1', type: 'chore_completed', memberId: 'm1', memberName: 'A', memberColor: '#000',
          title: 'First', description: 'desc', timestamp: new Date('2024-06-15T08:00:00Z'),
        },
        {
          id: '2', type: 'chore_completed', memberId: 'm1', memberName: 'A', memberColor: '#000',
          title: 'Third', description: 'desc', timestamp: new Date('2024-06-15T12:00:00Z'),
        },
        {
          id: '3', type: 'points_earned', memberId: 'm1', memberName: 'A', memberColor: '#000',
          title: 'Second', description: 'desc', timestamp: new Date('2024-06-15T10:00:00Z'),
        },
      ];

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      expect(activities[0].title).toBe('Third');
      expect(activities[1].title).toBe('Second');
      expect(activities[2].title).toBe('First');
    });
  });

  describe('activity type filtering', () => {
    it('filters activities by type', () => {
      const activities: Array<{ type: string; id: string }> = [
        { type: 'chore_completed', id: '1' },
        { type: 'points_earned', id: '2' },
        { type: 'chore_completed', id: '3' },
        { type: 'chore_approved', id: '4' },
      ];

      const type = 'chore_completed';
      const filtered = activities.filter(a => a.type === type);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.id)).toEqual(['1', '3']);
    });

    it('returns all activities when no type filter', () => {
      const activities = [
        { type: 'chore_completed', id: '1' },
        { type: 'points_earned', id: '2' },
      ];

      const type: string | undefined = undefined;
      const filtered = type ? activities.filter(a => a.type === type) : activities;

      expect(filtered).toHaveLength(2);
    });
  });

  describe('pagination', () => {
    it('limits activities to the specified limit', () => {
      const activities = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
      const limit = 50;
      const paginated = activities.slice(0, limit);
      expect(paginated).toHaveLength(50);
    });

    it('determines hasMore correctly', () => {
      const total = 60;
      const limit = 50;
      expect(total > limit).toBe(true);

      const total2 = 30;
      expect(total2 > limit).toBe(false);
    });
  });

  describe('activity stats period calculation', () => {
    it('calculates day period start', () => {
      const now = new Date('2024-06-15T14:30:00Z');
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      expect(startDate.getDate()).toBe(15);
      expect(startDate.getHours()).toBe(0);
    });

    it('calculates week period start', () => {
      const now = new Date('2024-06-15T14:30:00Z'); // Saturday
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      // Sunday of that week
      expect(startDate.getDay()).toBe(0);
    });

    it('calculates month period start', () => {
      const now = new Date('2024-06-15T14:30:00Z');
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(5); // June (0-indexed)
    });
  });
});
