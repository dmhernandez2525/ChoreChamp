// Household and member types

export type MemberRole = 'parent' | 'child' | 'teen' | 'viewer';
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionProvider = 'apple' | 'google' | 'stripe';

export interface Household {
  id: string;
  name: string;
  createdBy: string;
  timezone: string;
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  pointsName: string;
  currency: string;

  // Subscription
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
  subscriptionProvider: SubscriptionProvider | null;

  // Stats
  totalChoresCompleted: number;
  currentFamilyStreak: number;
  longestFamilyStreak: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdSettings {
  timezone: string;
  weekStartsOn: number;
  pointsName: string;
  currency: string;
}

export interface Member {
  id: string;
  householdId: string;
  userId: string | null; // null for parent-managed child profiles

  name: string;
  role: MemberRole;
  color: string;
  avatarUrl: string | null;
  birthYear: number | null;

  // Points
  pointsCurrent: number;
  pointsLifetime: number;

  // Streaks
  streakCurrent: number;
  streakLongest: number;
  streakLastCompletedDate: string | null; // YYYY-MM-DD
  streakFreezesAvailable: number;
  streakFreezesUsed: number;

  // Badges
  badges: string[];

  // Settings
  canRedeemRewards: boolean;
  requiresApproval: boolean;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InviteCode {
  id: string;
  householdId: string;
  code: string;
  role: MemberRole;
  createdBy: string;
  expiresAt: Date | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: Date;
}

// API Request/Response types
export interface CreateHouseholdRequest {
  name: string;
  timezone?: string;
  weekStartsOn?: number;
  pointsName?: string;
}

export interface CreateHouseholdResponse {
  household: Household;
  member: Member;
  inviteCode: string;
}

export interface AddMemberRequest {
  name: string;
  role?: MemberRole;
  birthYear?: number;
  color?: string;
  avatarUrl?: string;
  requiresApproval?: boolean;
}

export interface JoinHouseholdRequest {
  code: string;
}

export interface JoinHouseholdResponse {
  household: Household;
  member: Member;
}

export interface HouseholdWithMembers extends Household {
  members: Member[];
}
