// Phase 19: Financial Integration & Advanced Scheduling (F19.1-F19.5)

// F19.1 Banking Integration
export type BankingProvider = 'plaid' | 'stripe' | 'manual';

export type AllowanceDepositStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type AllowanceDepositFrequency = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

export interface BankingConnection {
  id: string;
  householdId: string;
  parentMemberId: string;
  provider: BankingProvider;
  accountName: string;
  accountMask: string;
  institutionName: string;
  isActive: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankingConnectionRequest {
  provider: BankingProvider;
  accessToken: string;
  accountId: string;
  accountName: string;
  accountMask: string;
  institutionName: string;
}

export interface AllowanceDeposit {
  id: string;
  householdId: string;
  memberId: string;
  memberName: string;
  bankingConnectionId: string;
  amount: number;
  currency: string;
  status: AllowanceDepositStatus;
  scheduledAt: string;
  processedAt: string | null;
  failureReason: string | null;
  externalTransactionId: string | null;
  createdAt: string;
}

export interface AllowanceDepositConfig {
  id: string;
  householdId: string;
  memberId: string;
  bankingConnectionId: string;
  amount: number;
  currency: string;
  frequency: AllowanceDepositFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  isActive: boolean;
  nextScheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllowanceDepositConfigRequest {
  memberId: string;
  bankingConnectionId: string;
  amount: number;
  currency: string;
  frequency: AllowanceDepositFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface UpdateAllowanceDepositConfigRequest {
  amount?: number;
  frequency?: AllowanceDepositFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive?: boolean;
}

export interface AllowanceDepositSummary {
  totalDeposited: number;
  pendingDeposits: number;
  activeConfigs: number;
  recentDeposits: AllowanceDeposit[];
}

// F19.2 Rotation System
export type RotationType = 'round_robin' | 'weighted' | 'random' | 'skill_based';

export type RotationFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface ChoreRotation {
  id: string;
  householdId: string;
  choreId: string;
  choreName: string;
  rotationType: RotationType;
  frequency: RotationFrequency;
  participantIds: string[];
  currentAssigneeId: string;
  nextRotationAt: string;
  skipWeekends: boolean;
  fairnessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChoreRotationRequest {
  choreId: string;
  rotationType: RotationType;
  frequency: RotationFrequency;
  participantIds: string[];
  skipWeekends?: boolean;
}

export interface UpdateChoreRotationRequest {
  rotationType?: RotationType;
  frequency?: RotationFrequency;
  participantIds?: string[];
  skipWeekends?: boolean;
}

export interface RotationHistory {
  id: string;
  rotationId: string;
  memberId: string;
  memberName: string;
  startedAt: string;
  completedAt: string | null;
  wasSkipped: boolean;
  skipReason: string | null;
}

export interface RotationFairnessReport {
  rotationId: string;
  participants: Array<{
    memberId: string;
    memberName: string;
    assignmentCount: number;
    completionCount: number;
    skipCount: number;
    fairnessScore: number;
  }>;
  overallFairnessScore: number;
  recommendation: string | null;
}

// F19.3 Chore Chains (Task Dependencies)
export type ChainStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export type ChainDependencyType = 'must_complete_before' | 'should_complete_before' | 'can_start_after';

export interface ChoreChain {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  totalSteps: number;
  completedSteps: number;
  status: ChainStatus;
  bonusPoints: number;
  deadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChoreChainStep {
  id: string;
  chainId: string;
  choreId: string;
  choreName: string;
  stepOrder: number;
  dependencyType: ChainDependencyType;
  dependsOnStepId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface CreateChoreChainRequest {
  name: string;
  description?: string;
  bonusPoints?: number;
  deadlineAt?: string;
  steps: Array<{
    choreId: string;
    stepOrder: number;
    dependencyType: ChainDependencyType;
    dependsOnStepId?: string;
    assigneeId?: string;
  }>;
}

export interface UpdateChoreChainRequest {
  name?: string;
  description?: string;
  bonusPoints?: number;
  deadlineAt?: string;
}

export interface ChoreChainProgress {
  chain: ChoreChain;
  steps: ChoreChainStep[];
  percentComplete: number;
  nextStep: ChoreChainStep | null;
  blockedSteps: ChoreChainStep[];
}

// F19.4 Responsibilities vs Jobs
export type TaskClassification = 'responsibility' | 'job';

export interface ResponsibilityConfig {
  id: string;
  householdId: string;
  defaultClassification: TaskClassification;
  responsibilityLabel: string;
  jobLabel: string;
  showClassificationBadge: boolean;
  allowMemberToggle: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateResponsibilityConfigRequest {
  defaultClassification?: TaskClassification;
  responsibilityLabel?: string;
  jobLabel?: string;
  showClassificationBadge?: boolean;
  allowMemberToggle?: boolean;
}

export interface ChoreClassification {
  id: string;
  choreId: string;
  householdId: string;
  classification: TaskClassification;
  reason: string | null;
  createdAt: string;
}

export interface ClassifyChoreRequest {
  choreId: string;
  classification: TaskClassification;
  reason?: string;
}

export interface ClassificationSummary {
  totalChores: number;
  responsibilities: number;
  jobs: number;
  unclassified: number;
  memberBreakdown: Array<{
    memberId: string;
    memberName: string;
    responsibilities: number;
    jobs: number;
    jobEarnings: number;
  }>;
}

// F19.5 Chore Marketplace
export type ListingStatus = 'open' | 'claimed' | 'completed' | 'expired' | 'cancelled';

export interface MarketplaceListing {
  id: string;
  householdId: string;
  choreId: string;
  choreName: string;
  listedById: string;
  listedByName: string;
  claimedById: string | null;
  claimedByName: string | null;
  pointBounty: number;
  bonusCondition: string | null;
  bonusPoints: number;
  status: ListingStatus;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateMarketplaceListingRequest {
  choreId: string;
  pointBounty: number;
  bonusCondition?: string;
  bonusPoints?: number;
  expiresInHours?: number;
}

export interface ClaimListingRequest {
  listingId: string;
}

export interface MarketplaceStats {
  totalListings: number;
  activeListings: number;
  completedListings: number;
  totalPointsTraded: number;
  topContributors: Array<{
    memberId: string;
    memberName: string;
    listingsCompleted: number;
    pointsEarned: number;
  }>;
}

export interface MarketplaceConfig {
  id: string;
  householdId: string;
  isEnabled: boolean;
  maxBountyPoints: number;
  minBountyPoints: number;
  defaultExpirationHours: number;
  requireParentApproval: boolean;
  allowSelfListing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMarketplaceConfigRequest {
  isEnabled?: boolean;
  maxBountyPoints?: number;
  minBountyPoints?: number;
  defaultExpirationHours?: number;
  requireParentApproval?: boolean;
  allowSelfListing?: boolean;
}
