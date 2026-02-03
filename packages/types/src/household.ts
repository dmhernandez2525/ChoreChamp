import type {
  SubscriptionTier,
  SubscriptionProvider,
  SubscriptionStatus,
  SubscriptionStore,
  BillingInterval,
} from './subscription';

// Household and member types

export type MemberRole = 'parent' | 'child' | 'teen' | 'viewer' | 'caregiver';

// Caregiver permission levels
export interface CaregiverPermissions {
  canViewChores: boolean;
  canCompleteChores: boolean;
  canApproveChores: boolean;
  canCreateChores: boolean;
  canEditChores: boolean;
  canViewPoints: boolean;
  canViewRewards: boolean;
  canRedeemRewards: boolean;
  canViewActivity: boolean;
}

// Default caregiver permissions (view + complete only)
export const DEFAULT_CAREGIVER_PERMISSIONS: CaregiverPermissions = {
  canViewChores: true,
  canCompleteChores: true,
  canApproveChores: false,
  canCreateChores: false,
  canEditChores: false,
  canViewPoints: true,
  canViewRewards: false,
  canRedeemRewards: false,
  canViewActivity: true,
};

// Cross-household visibility settings
export interface CrossHouseholdSettings {
  sharePointsAcrossHouseholds: boolean;
  shareStreaksAcrossHouseholds: boolean;
  shareBadgesAcrossHouseholds: boolean;
  allowCrossHouseholdChoreView: boolean;
}

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
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: Date | null;
  subscriptionProvider: SubscriptionProvider | null;
  subscriptionStore: SubscriptionStore | null;
  subscriptionBillingInterval: BillingInterval | null;
  subscriptionCurrentPeriodStart: Date | null;
  subscriptionCurrentPeriodEnd: Date | null;
  subscriptionTrialEndsAt: Date | null;
  subscriptionGracePeriodEndsAt: Date | null;
  subscriptionCancelAtPeriodEnd: boolean;
  subscriptionCanceledAt: Date | null;
  subscriptionIsGrandfathered: boolean;
  subscriptionMemberLimit: number | null;

  // Customization
  themeId: string | null;
  whiteLabelEnabled: boolean;
  brandingName: string | null;
  brandingLogoUrl: string | null;

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
  themeId?: string | null;
  brandingName?: string | null;
  brandingLogoUrl?: string | null;
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

  // Caregiver-specific
  caregiverPermissions: CaregiverPermissions | null;

  // Cross-household linking
  linkedMemberId: string | null; // Links to member in another household (same person)
  crossHouseholdSettings: CrossHouseholdSettings | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Member with cross-household data
export interface MemberWithCrossHousehold extends Member {
  linkedHouseholds: LinkedHouseholdInfo[];
  aggregatedPoints?: number; // Combined points across linked households
  aggregatedStreak?: number; // Best streak across linked households
}

// Linked household info for cross-household view
export interface LinkedHouseholdInfo {
  householdId: string;
  householdName: string;
  memberId: string;
  memberRole: MemberRole;
  pointsCurrent: number;
  streakCurrent: number;
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

export interface UpdateMemberRequest {
  name?: string;
  role?: MemberRole;
  color?: string;
  avatarUrl?: string | null;
  birthYear?: number | null;
  canRedeemRewards?: boolean;
  requiresApproval?: boolean;
  isActive?: boolean;
}

export interface CreateInviteCodeRequest {
  role?: MemberRole;
  maxUses?: number;
  expiresInDays?: number;
}

export interface HouseholdWithMembers extends Household {
  members: Member[];
}

// Multi-household API types

// Request to create a caregiver invite
export interface CreateCaregiverInviteRequest {
  permissions?: Partial<CaregiverPermissions>;
  maxUses?: number;
  expiresInDays?: number;
}

// Request to link a member across households
export interface LinkMemberRequest {
  sourceMemberId: string; // Member in current household
  targetHouseholdId: string; // Household to link to
  shareSettings?: Partial<CrossHouseholdSettings>;
}

// Response for linking a member
export interface LinkMemberResponse {
  linkedMemberId: string;
  targetHouseholdMember: Member;
  shareSettings: CrossHouseholdSettings;
}

// Request to update cross-household settings
export interface UpdateCrossHouseholdSettingsRequest {
  memberId: string;
  settings: Partial<CrossHouseholdSettings>;
}

// Request to update caregiver permissions
export interface UpdateCaregiverPermissionsRequest {
  memberId: string;
  permissions: Partial<CaregiverPermissions>;
}

// Response for user's households with context
export interface UserHouseholdsResponse {
  households: HouseholdContext[];
  activeHouseholdId: string | null;
}

// Household with user's context
export interface HouseholdContext {
  household: Household;
  member: Member;
  role: MemberRole;
  isDefault: boolean;
  linkedMembers: LinkedHouseholdInfo[];
}

// Request to switch active household
export interface SwitchHouseholdRequest {
  householdId: string;
  setAsDefault?: boolean;
}

// Cross-household points summary
export interface CrossHouseholdPointsSummary {
  memberId: string;
  memberName: string;
  totalPoints: number;
  totalLifetimePoints: number;
  householdBreakdown: {
    householdId: string;
    householdName: string;
    pointsCurrent: number;
    pointsLifetime: number;
  }[];
}

// Cross-household streak summary
export interface CrossHouseholdStreakSummary {
  memberId: string;
  memberName: string;
  bestCurrentStreak: number;
  bestHouseholdId: string;
  bestHouseholdName: string;
  householdBreakdown: {
    householdId: string;
    householdName: string;
    streakCurrent: number;
    streakLongest: number;
  }[];
}
