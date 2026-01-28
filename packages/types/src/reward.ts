// Reward types

export type RewardType = 'screen_time' | 'money' | 'privilege' | 'activity' | 'custom';
export type RedemptionStatus = 'pending' | 'approved' | 'fulfilled' | 'rejected';

export interface Reward {
  id: string;
  householdId: string;

  title: string;
  description: string | null;
  icon: string;
  type: RewardType;

  pointCost: number;
  createdBy: string;

  // Quantity limits
  quantity: number | null; // null = unlimited
  quantityRemaining: number | null;

  // Availability
  isActive: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  householdId: string;
  memberId: string;

  pointsSpent: number;
  status: RedemptionStatus;

  requestedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  fulfilledBy: string | null;
  fulfilledAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;

  notes: string | null;

  createdAt: Date;
}

// API Request/Response types
export interface CreateRewardRequest {
  title: string;
  description?: string;
  icon?: string;
  type?: RewardType;
  pointCost: number;
  quantity?: number;
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface RedeemRewardRequest {
  rewardId: string;
  notes?: string;
}

export interface RewardWithRedemptions extends Reward {
  redemptions: RewardRedemption[];
  totalRedemptions: number;
}
