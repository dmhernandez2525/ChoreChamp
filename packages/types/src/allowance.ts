// Allowance Management types

export type PayoutFrequency = 'weekly' | 'biweekly' | 'monthly';
export type PayoutStatus = 'pending' | 'paid' | 'cancelled';

export interface AllowanceSettings {
  id: string;
  householdId: string;
  memberId: string;

  // Conversion rate
  pointsPerDollar: number; // How many points = $1
  currency: string; // USD, EUR, etc.

  // Payout settings
  payoutFrequency: PayoutFrequency;
  payoutDayOfWeek: number | null; // 0-6 for weekly/biweekly
  payoutDayOfMonth: number | null; // 1-31 for monthly
  minimumPayout: number; // Minimum amount to trigger payout
  maximumPayout: number | null; // Optional cap per payout period

  // Point thresholds
  reservePoints: number; // Points to keep in reserve (not available for payout)

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface AllowancePayout {
  id: string;
  householdId: string;
  memberId: string;
  settingsId: string;

  // Payout period
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;

  // Points and money
  pointsConverted: number;
  amountDue: number;
  currency: string;

  // Status
  status: PayoutStatus;
  paidAt: Date | null;
  paidBy: string | null;

  // Notes
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface AllowancePayoutWithMember extends AllowancePayout {
  member: {
    id: string;
    name: string;
    color: string;
  };
  paidByMember: {
    id: string;
    name: string;
  } | null;
}

// Allowance summary for a member
export interface AllowanceSummary {
  settings: AllowanceSettings | null;
  currentBalance: {
    totalPoints: number;
    reservePoints: number;
    availablePoints: number;
    estimatedValue: number;
    currency: string;
  };
  pendingPayout: AllowancePayout | null;
  nextPayoutDate: string | null;
  recentPayouts: AllowancePayout[];
  lifetimeEarnings: {
    totalPointsConverted: number;
    totalAmountPaid: number;
  };
}

// API Request types
export interface CreateAllowanceSettingsRequest {
  memberId: string;
  pointsPerDollar: number;
  currency?: string;
  payoutFrequency: PayoutFrequency;
  payoutDayOfWeek?: number;
  payoutDayOfMonth?: number;
  minimumPayout?: number;
  maximumPayout?: number;
  reservePoints?: number;
}

export interface UpdateAllowanceSettingsRequest {
  pointsPerDollar?: number;
  currency?: string;
  payoutFrequency?: PayoutFrequency;
  payoutDayOfWeek?: number;
  payoutDayOfMonth?: number;
  minimumPayout?: number;
  maximumPayout?: number;
  reservePoints?: number;
  isActive?: boolean;
}

export interface MarkPayoutPaidRequest {
  notes?: string;
}

// Response types
export interface HouseholdAllowanceSummary {
  totalPendingPayouts: number;
  pendingPayoutAmount: number;
  currency: string;
  memberSummaries: Array<{
    memberId: string;
    memberName: string;
    memberColor: string;
    hasAllowance: boolean;
    pendingAmount: number;
    lastPayout: AllowancePayout | null;
  }>;
}
