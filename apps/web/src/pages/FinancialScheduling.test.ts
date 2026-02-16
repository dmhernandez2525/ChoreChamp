import { describe, it, expect } from 'vitest';
import type {
  BankingProvider,
  AllowanceDepositStatus,
  AllowanceDepositFrequency,
  BankingConnection,
  CreateBankingConnectionRequest,
  AllowanceDeposit,
  AllowanceDepositConfig,
  CreateAllowanceDepositConfigRequest,
  UpdateAllowanceDepositConfigRequest,
  AllowanceDepositSummary,
  RotationType,
  RotationFrequency,
  ChoreRotation,
  CreateChoreRotationRequest,
  UpdateChoreRotationRequest,
  RotationHistory,
  RotationFairnessReport,
  ChainStatus,
  DependencyType,
  ChoreChain,
  ChoreChainStep,
  CreateChoreChainRequest,
  ChoreChainProgress,
  TaskClassification,
  ResponsibilityConfig,
  UpdateResponsibilityConfigRequest,
  ChoreClassification,
  ClassifyChoreRequest,
  ClassificationSummary,
  ListingStatus,
  MarketplaceListing,
  CreateMarketplaceListingRequest,
  MarketplaceStats,
  MarketplaceConfig,
  UpdateMarketplaceConfigRequest,
} from '@chorechamp/types';

// F19.1 Banking Integration

const validBankingProviders: BankingProvider[] = ['plaid', 'stripe', 'manual'];
const validDepositStatuses: AllowanceDepositStatus[] = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
const validDepositFrequencies: AllowanceDepositFrequency[] = ['weekly', 'biweekly', 'monthly', 'on_demand'];

const mockBankingConnection: BankingConnection = {
  id: 'bc-001',
  householdId: 'hh-001',
  parentMemberId: 'mem-parent-001',
  provider: 'plaid',
  accountName: 'Checking Account',
  accountMask: '4321',
  institutionName: 'First National Bank',
  isActive: true,
  lastVerifiedAt: '2026-02-10T12:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-10T12:00:00Z',
};

const mockCreateBankingConnectionRequest: CreateBankingConnectionRequest = {
  provider: 'plaid',
  accessToken: 'access-sandbox-abc123',
  accountId: 'acct-001',
  accountName: 'Savings Account',
  accountMask: '9876',
  institutionName: 'Community Credit Union',
};

const mockAllowanceDeposit: AllowanceDeposit = {
  id: 'dep-001',
  householdId: 'hh-001',
  memberId: 'mem-child-001',
  memberName: 'Alice',
  bankingConnectionId: 'bc-001',
  amount: 10.0,
  currency: 'USD',
  status: 'completed',
  scheduledAt: '2026-02-14T00:00:00Z',
  processedAt: '2026-02-14T00:05:00Z',
  failureReason: null,
  externalTransactionId: 'txn-ext-001',
  createdAt: '2026-02-07T00:00:00Z',
};

const mockDepositConfig: AllowanceDepositConfig = {
  id: 'cfg-001',
  householdId: 'hh-001',
  memberId: 'mem-child-001',
  bankingConnectionId: 'bc-001',
  amount: 10.0,
  currency: 'USD',
  frequency: 'weekly',
  dayOfWeek: 5,
  dayOfMonth: null,
  isActive: true,
  nextScheduledAt: '2026-02-21T00:00:00Z',
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-02-14T00:00:00Z',
};

const mockCreateDepositConfigRequest: CreateAllowanceDepositConfigRequest = {
  memberId: 'mem-child-002',
  bankingConnectionId: 'bc-001',
  amount: 15.0,
  currency: 'USD',
  frequency: 'biweekly',
  dayOfWeek: 1,
};

const mockUpdateDepositConfigRequest: UpdateAllowanceDepositConfigRequest = {
  amount: 20.0,
  frequency: 'monthly',
  dayOfMonth: 15,
  isActive: true,
};

const mockDepositSummary: AllowanceDepositSummary = {
  totalDeposited: 240.0,
  pendingDeposits: 2,
  activeConfigs: 3,
  recentDeposits: [mockAllowanceDeposit],
};

// F19.2 Rotation System

const validRotationTypes: RotationType[] = ['round_robin', 'weighted', 'random', 'skill_based'];
const validRotationFrequencies: RotationFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];

const mockChoreRotation: ChoreRotation = {
  id: 'rot-001',
  householdId: 'hh-001',
  choreId: 'chore-dishes',
  choreName: 'Wash Dishes',
  rotationType: 'round_robin',
  frequency: 'daily',
  participantIds: ['mem-child-001', 'mem-child-002', 'mem-child-003'],
  currentAssigneeId: 'mem-child-001',
  nextRotationAt: '2026-02-16T00:00:00Z',
  skipWeekends: false,
  fairnessScore: 0.95,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-15T00:00:00Z',
};

const mockCreateRotationRequest: CreateChoreRotationRequest = {
  choreId: 'chore-vacuum',
  rotationType: 'weighted',
  frequency: 'weekly',
  participantIds: ['mem-child-001', 'mem-child-002'],
  skipWeekends: true,
};

const mockUpdateRotationRequest: UpdateChoreRotationRequest = {
  rotationType: 'random',
  frequency: 'biweekly',
  participantIds: ['mem-child-001', 'mem-child-002', 'mem-child-003'],
};

const mockRotationHistory: RotationHistory = {
  id: 'rh-001',
  rotationId: 'rot-001',
  memberId: 'mem-child-001',
  memberName: 'Alice',
  startedAt: '2026-02-14T00:00:00Z',
  completedAt: '2026-02-14T18:30:00Z',
  wasSkipped: false,
  skipReason: null,
};

const mockFairnessReport: RotationFairnessReport = {
  rotationId: 'rot-001',
  participants: [
    { memberId: 'mem-child-001', memberName: 'Alice', assignmentCount: 10, completionCount: 9, skipCount: 1, fairnessScore: 0.93 },
    { memberId: 'mem-child-002', memberName: 'Bob', assignmentCount: 10, completionCount: 10, skipCount: 0, fairnessScore: 1.0 },
  ],
  overallFairnessScore: 0.96,
  recommendation: null,
};

// F19.3 Chore Chains

const validChainStatuses: ChainStatus[] = ['pending', 'in_progress', 'completed', 'blocked'];
const validDependencyTypes: DependencyType[] = ['must_complete_before', 'should_complete_before', 'can_start_after'];

const mockChoreChain: ChoreChain = {
  id: 'chain-001',
  householdId: 'hh-001',
  name: 'Saturday Deep Clean',
  description: 'Complete deep clean of the house every Saturday',
  totalSteps: 4,
  completedSteps: 2,
  status: 'in_progress',
  bonusPoints: 50,
  deadlineAt: '2026-02-15T18:00:00Z',
  createdAt: '2026-02-15T08:00:00Z',
  updatedAt: '2026-02-15T12:00:00Z',
};

const mockChoreChainStep: ChoreChainStep = {
  id: 'step-001',
  chainId: 'chain-001',
  choreId: 'chore-vacuum',
  choreName: 'Vacuum Living Room',
  stepOrder: 1,
  dependencyType: 'must_complete_before',
  dependsOnStepId: null,
  assigneeId: 'mem-child-001',
  assigneeName: 'Alice',
  isCompleted: true,
  completedAt: '2026-02-15T10:00:00Z',
};

const mockCreateChainRequest: CreateChoreChainRequest = {
  name: 'Kitchen Cleanup',
  description: 'Full kitchen cleanup routine',
  bonusPoints: 25,
  deadlineAt: '2026-02-15T20:00:00Z',
  steps: [
    { choreId: 'chore-clear-table', stepOrder: 1, dependencyType: 'must_complete_before' },
    { choreId: 'chore-dishes', stepOrder: 2, dependencyType: 'must_complete_before', dependsOnStepId: 'step-temp-1', assigneeId: 'mem-child-002' },
    { choreId: 'chore-wipe-counters', stepOrder: 3, dependencyType: 'can_start_after', dependsOnStepId: 'step-temp-2' },
  ],
};

const mockChainProgress: ChoreChainProgress = {
  chain: mockChoreChain,
  steps: [mockChoreChainStep],
  percentComplete: 50,
  nextStep: { ...mockChoreChainStep, id: 'step-002', stepOrder: 2, isCompleted: false, completedAt: null, choreName: 'Mop Floors' },
  blockedSteps: [],
};

// F19.4 Responsibilities vs Jobs

const validTaskClassifications: TaskClassification[] = ['responsibility', 'job'];

const mockResponsibilityConfig: ResponsibilityConfig = {
  id: 'rc-001',
  householdId: 'hh-001',
  defaultClassification: 'responsibility',
  responsibilityLabel: 'Responsibility',
  jobLabel: 'Job',
  showClassificationBadge: true,
  allowMemberToggle: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-10T00:00:00Z',
};

const mockUpdateResponsibilityConfigRequest: UpdateResponsibilityConfigRequest = {
  defaultClassification: 'job',
  showClassificationBadge: false,
  allowMemberToggle: true,
};

const mockChoreClassification: ChoreClassification = {
  id: 'cc-001',
  choreId: 'chore-make-bed',
  householdId: 'hh-001',
  classification: 'responsibility',
  reason: 'Daily personal upkeep',
  createdAt: '2026-02-01T00:00:00Z',
};

const mockClassifyChoreRequest: ClassifyChoreRequest = {
  choreId: 'chore-wash-car',
  classification: 'job',
  reason: 'Extra task with monetary reward',
};

const mockClassificationSummary: ClassificationSummary = {
  totalChores: 20,
  responsibilities: 12,
  jobs: 6,
  unclassified: 2,
  memberBreakdown: [
    { memberId: 'mem-child-001', memberName: 'Alice', responsibilities: 5, jobs: 3, jobEarnings: 15.0 },
    { memberId: 'mem-child-002', memberName: 'Bob', responsibilities: 7, jobs: 3, jobEarnings: 12.0 },
  ],
};

// F19.5 Chore Marketplace

const validListingStatuses: ListingStatus[] = ['open', 'claimed', 'completed', 'expired', 'cancelled'];

const mockMarketplaceListing: MarketplaceListing = {
  id: 'listing-001',
  householdId: 'hh-001',
  choreId: 'chore-yard',
  choreName: 'Mow the Lawn',
  listedById: 'mem-child-001',
  listedByName: 'Alice',
  claimedById: 'mem-child-002',
  claimedByName: 'Bob',
  pointBounty: 30,
  bonusCondition: 'Edge the sidewalk too',
  bonusPoints: 10,
  status: 'claimed',
  expiresAt: '2026-02-16T00:00:00Z',
  completedAt: null,
  createdAt: '2026-02-15T08:00:00Z',
};

const mockCreateListingRequest: CreateMarketplaceListingRequest = {
  choreId: 'chore-garage',
  pointBounty: 50,
  bonusCondition: 'Organize all shelves',
  bonusPoints: 20,
  expiresInHours: 48,
};

const mockMarketplaceStats: MarketplaceStats = {
  totalListings: 45,
  activeListings: 8,
  completedListings: 32,
  totalPointsTraded: 1500,
  topContributors: [
    { memberId: 'mem-child-002', memberName: 'Bob', listingsCompleted: 15, pointsEarned: 750 },
    { memberId: 'mem-child-001', memberName: 'Alice', listingsCompleted: 10, pointsEarned: 500 },
  ],
};

const mockMarketplaceConfig: MarketplaceConfig = {
  id: 'mc-001',
  householdId: 'hh-001',
  isEnabled: true,
  maxBountyPoints: 100,
  minBountyPoints: 5,
  defaultExpirationHours: 24,
  requireParentApproval: true,
  allowSelfListing: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-10T00:00:00Z',
};

const mockUpdateMarketplaceConfigRequest: UpdateMarketplaceConfigRequest = {
  maxBountyPoints: 200,
  requireParentApproval: false,
  allowSelfListing: true,
};

// Validation helpers

const validateBankingConnectionRequest = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const allowedProviders = ['plaid', 'stripe', 'manual'];
  if (!req.provider || !allowedProviders.includes(req.provider as string)) {
    errors.push('provider must be plaid, stripe, or manual');
  }
  if (!req.accessToken || typeof req.accessToken !== 'string') {
    errors.push('accessToken is required');
  }
  if (!req.accountId || typeof req.accountId !== 'string') {
    errors.push('accountId is required');
  }
  if (!req.accountName || typeof req.accountName !== 'string') {
    errors.push('accountName is required');
  }
  if (!req.accountMask || typeof req.accountMask !== 'string') {
    errors.push('accountMask is required');
  }
  if (!req.institutionName || typeof req.institutionName !== 'string') {
    errors.push('institutionName is required');
  }
  return { valid: errors.length === 0, errors };
};

const validateDepositConfigRequest = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!req.memberId || typeof req.memberId !== 'string') {
    errors.push('memberId is required');
  }
  if (!req.bankingConnectionId || typeof req.bankingConnectionId !== 'string') {
    errors.push('bankingConnectionId is required');
  }
  if (typeof req.amount !== 'number' || req.amount <= 0) {
    errors.push('amount must be a positive number');
  }
  if (!req.currency || typeof req.currency !== 'string') {
    errors.push('currency is required');
  }
  const allowedFrequencies = ['weekly', 'biweekly', 'monthly', 'on_demand'];
  if (!req.frequency || !allowedFrequencies.includes(req.frequency as string)) {
    errors.push('frequency must be weekly, biweekly, monthly, or on_demand');
  }
  return { valid: errors.length === 0, errors };
};

const validateCreateRotationRequest = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!req.choreId || typeof req.choreId !== 'string') {
    errors.push('choreId is required');
  }
  const allowedTypes = ['round_robin', 'weighted', 'random', 'skill_based'];
  if (!req.rotationType || !allowedTypes.includes(req.rotationType as string)) {
    errors.push('rotationType must be round_robin, weighted, random, or skill_based');
  }
  const allowedFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
  if (!req.frequency || !allowedFrequencies.includes(req.frequency as string)) {
    errors.push('frequency must be daily, weekly, biweekly, or monthly');
  }
  if (!Array.isArray(req.participantIds) || req.participantIds.length < 2) {
    errors.push('participantIds must contain at least 2 members');
  }
  return { valid: errors.length === 0, errors };
};

const validateCreateChainRequest = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!req.name || typeof req.name !== 'string' || (req.name as string).trim().length === 0) {
    errors.push('name is required');
  }
  if (!Array.isArray(req.steps) || req.steps.length === 0) {
    errors.push('steps must contain at least one step');
  }
  if (Array.isArray(req.steps)) {
    const validDeps = ['must_complete_before', 'should_complete_before', 'can_start_after'];
    for (const step of req.steps as Array<Record<string, unknown>>) {
      if (!step.choreId) errors.push('each step must have a choreId');
      if (typeof step.stepOrder !== 'number') errors.push('each step must have a stepOrder');
      if (!step.dependencyType || !validDeps.includes(step.dependencyType as string)) {
        errors.push('each step must have a valid dependencyType');
      }
    }
  }
  if (req.bonusPoints !== undefined && (typeof req.bonusPoints !== 'number' || (req.bonusPoints as number) < 0)) {
    errors.push('bonusPoints must be a non-negative number');
  }
  return { valid: errors.length === 0, errors };
};

const validateClassifyChoreRequest = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!req.choreId || typeof req.choreId !== 'string') {
    errors.push('choreId is required');
  }
  const validClassifications = ['responsibility', 'job'];
  if (!req.classification || !validClassifications.includes(req.classification as string)) {
    errors.push('classification must be responsibility or job');
  }
  return { valid: errors.length === 0, errors };
};

const validateCreateListingRequest = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!req.choreId || typeof req.choreId !== 'string') {
    errors.push('choreId is required');
  }
  if (typeof req.pointBounty !== 'number' || req.pointBounty <= 0) {
    errors.push('pointBounty must be a positive number');
  }
  if (req.expiresInHours !== undefined && (typeof req.expiresInHours !== 'number' || (req.expiresInHours as number) <= 0)) {
    errors.push('expiresInHours must be a positive number');
  }
  if (req.bonusPoints !== undefined && (typeof req.bonusPoints !== 'number' || (req.bonusPoints as number) < 0)) {
    errors.push('bonusPoints must be a non-negative number');
  }
  return { valid: errors.length === 0, errors };
};

const validateMarketplaceConfigUpdate = (
  req: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (req.maxBountyPoints !== undefined && req.minBountyPoints !== undefined) {
    if ((req.maxBountyPoints as number) < (req.minBountyPoints as number)) {
      errors.push('maxBountyPoints must be greater than or equal to minBountyPoints');
    }
  }
  if (req.defaultExpirationHours !== undefined && (typeof req.defaultExpirationHours !== 'number' || (req.defaultExpirationHours as number) <= 0)) {
    errors.push('defaultExpirationHours must be a positive number');
  }
  return { valid: errors.length === 0, errors };
};

const calculateChainPercentComplete = (completedSteps: number, totalSteps: number): number => {
  if (totalSteps === 0) return 0;
  return Math.round((completedSteps / totalSteps) * 100);
};

const calculateFairnessScore = (
  participants: Array<{ assignmentCount: number; completionCount: number }>
): number => {
  if (participants.length === 0) return 0;
  const completionRates = participants.map((p) =>
    p.assignmentCount === 0 ? 0 : p.completionCount / p.assignmentCount
  );
  const avgRate = completionRates.reduce((sum, r) => sum + r, 0) / completionRates.length;
  return parseFloat(avgRate.toFixed(2));
};

const isListingClaimable = (listing: MarketplaceListing, memberId: string): boolean => {
  if (listing.status !== 'open') return false;
  if (listing.listedById === memberId) return false;
  if (new Date(listing.expiresAt) < new Date()) return false;
  return true;
};

const validateBountyWithinLimits = (
  bounty: number,
  config: MarketplaceConfig
): { valid: boolean; error?: string } => {
  if (bounty < config.minBountyPoints) {
    return { valid: false, error: `Bounty must be at least ${config.minBountyPoints} points` };
  }
  if (bounty > config.maxBountyPoints) {
    return { valid: false, error: `Bounty cannot exceed ${config.maxBountyPoints} points` };
  }
  return { valid: true };
};

// Tests

describe('Phase 19: Financial Integration & Advanced Scheduling', () => {
  // F19.1 Banking Integration
  describe('F19.1 Banking Integration', () => {
    it('defines valid BankingProvider types', () => {
      expect(validBankingProviders).toHaveLength(3);
      expect(validBankingProviders).toContain('plaid');
      expect(validBankingProviders).toContain('stripe');
      expect(validBankingProviders).toContain('manual');
    });

    it('defines valid AllowanceDepositStatus types', () => {
      expect(validDepositStatuses).toHaveLength(5);
      expect(validDepositStatuses).toContain('pending');
      expect(validDepositStatuses).toContain('processing');
      expect(validDepositStatuses).toContain('completed');
      expect(validDepositStatuses).toContain('failed');
      expect(validDepositStatuses).toContain('cancelled');
    });

    it('defines valid AllowanceDepositFrequency types', () => {
      expect(validDepositFrequencies).toHaveLength(4);
      expect(validDepositFrequencies).toContain('weekly');
      expect(validDepositFrequencies).toContain('biweekly');
      expect(validDepositFrequencies).toContain('monthly');
      expect(validDepositFrequencies).toContain('on_demand');
    });

    it('validates BankingConnection has all required fields', () => {
      expect(mockBankingConnection.id).toBeDefined();
      expect(mockBankingConnection.householdId).toBeDefined();
      expect(mockBankingConnection.parentMemberId).toBeDefined();
      expect(validBankingProviders).toContain(mockBankingConnection.provider);
      expect(mockBankingConnection.accountName).toBe('Checking Account');
      expect(mockBankingConnection.accountMask).toBe('4321');
      expect(mockBankingConnection.institutionName).toBe('First National Bank');
      expect(mockBankingConnection.isActive).toBe(true);
      expect(mockBankingConnection.lastVerifiedAt).toBeDefined();
      expect(mockBankingConnection.createdAt).toBeDefined();
      expect(mockBankingConnection.updatedAt).toBeDefined();
    });

    it('validates CreateBankingConnectionRequest with valid data', () => {
      const result = validateBankingConnectionRequest(mockCreateBankingConnectionRequest);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects CreateBankingConnectionRequest with missing fields', () => {
      const result = validateBankingConnectionRequest({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('provider must be plaid, stripe, or manual');
      expect(result.errors).toContain('accessToken is required');
      expect(result.errors).toContain('accountId is required');
      expect(result.errors).toContain('accountName is required');
      expect(result.errors).toContain('accountMask is required');
      expect(result.errors).toContain('institutionName is required');
    });

    it('rejects invalid banking provider', () => {
      const result = validateBankingConnectionRequest({ ...mockCreateBankingConnectionRequest, provider: 'paypal' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('provider must be plaid, stripe, or manual');
    });

    it('validates AllowanceDeposit fields structure', () => {
      expect(mockAllowanceDeposit.id).toBe('dep-001');
      expect(mockAllowanceDeposit.amount).toBe(10.0);
      expect(mockAllowanceDeposit.currency).toBe('USD');
      expect(validDepositStatuses).toContain(mockAllowanceDeposit.status);
      expect(mockAllowanceDeposit.failureReason).toBeNull();
      expect(mockAllowanceDeposit.externalTransactionId).toBe('txn-ext-001');
    });

    it('validates CreateAllowanceDepositConfigRequest with valid data', () => {
      const result = validateDepositConfigRequest(mockCreateDepositConfigRequest);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects deposit config with zero amount', () => {
      const result = validateDepositConfigRequest({ ...mockCreateDepositConfigRequest, amount: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('amount must be a positive number');
    });

    it('rejects deposit config with invalid frequency', () => {
      const result = validateDepositConfigRequest({ ...mockCreateDepositConfigRequest, frequency: 'yearly' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('frequency must be weekly, biweekly, monthly, or on_demand');
    });

    it('validates AllowanceDepositConfig structure', () => {
      expect(mockDepositConfig.frequency).toBe('weekly');
      expect(mockDepositConfig.dayOfWeek).toBe(5);
      expect(mockDepositConfig.dayOfMonth).toBeNull();
      expect(mockDepositConfig.isActive).toBe(true);
      expect(mockDepositConfig.nextScheduledAt).toBeDefined();
    });

    it('validates UpdateAllowanceDepositConfigRequest allows partial updates', () => {
      const partialUpdate: UpdateAllowanceDepositConfigRequest = { isActive: false };
      expect(partialUpdate.amount).toBeUndefined();
      expect(partialUpdate.frequency).toBeUndefined();
      expect(partialUpdate.isActive).toBe(false);
    });

    it('validates AllowanceDepositSummary aggregates correctly', () => {
      expect(mockDepositSummary.totalDeposited).toBe(240.0);
      expect(mockDepositSummary.pendingDeposits).toBe(2);
      expect(mockDepositSummary.activeConfigs).toBe(3);
      expect(mockDepositSummary.recentDeposits).toHaveLength(1);
      expect(mockDepositSummary.recentDeposits[0].status).toBe('completed');
    });
  });

  // F19.2 Rotation System
  describe('F19.2 Rotation System', () => {
    it('defines valid RotationType values', () => {
      expect(validRotationTypes).toHaveLength(4);
      expect(validRotationTypes).toContain('round_robin');
      expect(validRotationTypes).toContain('weighted');
      expect(validRotationTypes).toContain('random');
      expect(validRotationTypes).toContain('skill_based');
    });

    it('defines valid RotationFrequency values', () => {
      expect(validRotationFrequencies).toHaveLength(4);
      expect(validRotationFrequencies).toContain('daily');
      expect(validRotationFrequencies).toContain('weekly');
      expect(validRotationFrequencies).toContain('biweekly');
      expect(validRotationFrequencies).toContain('monthly');
    });

    it('validates ChoreRotation has all required fields', () => {
      expect(mockChoreRotation.id).toBeDefined();
      expect(mockChoreRotation.choreId).toBe('chore-dishes');
      expect(mockChoreRotation.choreName).toBe('Wash Dishes');
      expect(validRotationTypes).toContain(mockChoreRotation.rotationType);
      expect(validRotationFrequencies).toContain(mockChoreRotation.frequency);
      expect(mockChoreRotation.participantIds).toHaveLength(3);
      expect(mockChoreRotation.skipWeekends).toBe(false);
      expect(mockChoreRotation.fairnessScore).toBe(0.95);
    });

    it('validates CreateChoreRotationRequest with valid data', () => {
      const result = validateCreateRotationRequest(mockCreateRotationRequest);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects rotation with fewer than 2 participants', () => {
      const result = validateCreateRotationRequest({
        ...mockCreateRotationRequest,
        participantIds: ['mem-child-001'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('participantIds must contain at least 2 members');
    });

    it('rejects rotation with invalid rotation type', () => {
      const result = validateCreateRotationRequest({
        ...mockCreateRotationRequest,
        rotationType: 'alphabetical',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rotationType must be round_robin, weighted, random, or skill_based');
    });

    it('validates UpdateChoreRotationRequest allows partial updates', () => {
      const partialUpdate: UpdateChoreRotationRequest = { skipWeekends: true };
      expect(partialUpdate.rotationType).toBeUndefined();
      expect(partialUpdate.frequency).toBeUndefined();
      expect(partialUpdate.skipWeekends).toBe(true);
    });

    it('validates RotationHistory fields structure', () => {
      expect(mockRotationHistory.id).toBe('rh-001');
      expect(mockRotationHistory.rotationId).toBe('rot-001');
      expect(mockRotationHistory.memberName).toBe('Alice');
      expect(mockRotationHistory.wasSkipped).toBe(false);
      expect(mockRotationHistory.skipReason).toBeNull();
      expect(mockRotationHistory.completedAt).toBeDefined();
    });

    it('validates RotationFairnessReport structure', () => {
      expect(mockFairnessReport.rotationId).toBe('rot-001');
      expect(mockFairnessReport.participants).toHaveLength(2);
      expect(mockFairnessReport.overallFairnessScore).toBe(0.96);
      expect(mockFairnessReport.recommendation).toBeNull();
      expect(mockFairnessReport.participants[0].fairnessScore).toBe(0.93);
      expect(mockFairnessReport.participants[1].fairnessScore).toBe(1.0);
    });

    it('calculates fairness score correctly', () => {
      const score = calculateFairnessScore([
        { assignmentCount: 10, completionCount: 10 },
        { assignmentCount: 10, completionCount: 8 },
      ]);
      expect(score).toBe(0.9);
    });

    it('handles empty participants in fairness calculation', () => {
      const score = calculateFairnessScore([]);
      expect(score).toBe(0);
    });
  });

  // F19.3 Chore Chains
  describe('F19.3 Chore Chains', () => {
    it('defines valid ChainStatus values', () => {
      expect(validChainStatuses).toHaveLength(4);
      expect(validChainStatuses).toContain('pending');
      expect(validChainStatuses).toContain('in_progress');
      expect(validChainStatuses).toContain('completed');
      expect(validChainStatuses).toContain('blocked');
    });

    it('defines valid DependencyType values', () => {
      expect(validDependencyTypes).toHaveLength(3);
      expect(validDependencyTypes).toContain('must_complete_before');
      expect(validDependencyTypes).toContain('should_complete_before');
      expect(validDependencyTypes).toContain('can_start_after');
    });

    it('validates ChoreChain has all required fields', () => {
      expect(mockChoreChain.id).toBe('chain-001');
      expect(mockChoreChain.name).toBe('Saturday Deep Clean');
      expect(mockChoreChain.totalSteps).toBe(4);
      expect(mockChoreChain.completedSteps).toBe(2);
      expect(validChainStatuses).toContain(mockChoreChain.status);
      expect(mockChoreChain.bonusPoints).toBe(50);
      expect(mockChoreChain.deadlineAt).toBeDefined();
    });

    it('validates ChoreChainStep fields structure', () => {
      expect(mockChoreChainStep.id).toBe('step-001');
      expect(mockChoreChainStep.chainId).toBe('chain-001');
      expect(mockChoreChainStep.stepOrder).toBe(1);
      expect(validDependencyTypes).toContain(mockChoreChainStep.dependencyType);
      expect(mockChoreChainStep.dependsOnStepId).toBeNull();
      expect(mockChoreChainStep.isCompleted).toBe(true);
      expect(mockChoreChainStep.assigneeName).toBe('Alice');
    });

    it('validates CreateChoreChainRequest with valid data', () => {
      const result = validateCreateChainRequest(mockCreateChainRequest);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects chain request with empty name', () => {
      const result = validateCreateChainRequest({ ...mockCreateChainRequest, name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name is required');
    });

    it('rejects chain request with no steps', () => {
      const result = validateCreateChainRequest({ name: 'Empty Chain', steps: [] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('steps must contain at least one step');
    });

    it('rejects chain with negative bonus points', () => {
      const result = validateCreateChainRequest({ ...mockCreateChainRequest, bonusPoints: -10 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('bonusPoints must be a non-negative number');
    });

    it('validates ChoreChainProgress structure', () => {
      expect(mockChainProgress.chain.id).toBe('chain-001');
      expect(mockChainProgress.percentComplete).toBe(50);
      expect(mockChainProgress.nextStep).toBeDefined();
      expect(mockChainProgress.nextStep?.stepOrder).toBe(2);
      expect(mockChainProgress.blockedSteps).toHaveLength(0);
    });

    it('calculates chain completion percentage', () => {
      expect(calculateChainPercentComplete(2, 4)).toBe(50);
      expect(calculateChainPercentComplete(0, 4)).toBe(0);
      expect(calculateChainPercentComplete(4, 4)).toBe(100);
      expect(calculateChainPercentComplete(1, 3)).toBe(33);
    });

    it('handles zero total steps in percentage calculation', () => {
      expect(calculateChainPercentComplete(0, 0)).toBe(0);
    });
  });

  // F19.4 Responsibilities vs Jobs
  describe('F19.4 Responsibilities vs Jobs', () => {
    it('defines valid TaskClassification types', () => {
      expect(validTaskClassifications).toHaveLength(2);
      expect(validTaskClassifications).toContain('responsibility');
      expect(validTaskClassifications).toContain('job');
    });

    it('validates ResponsibilityConfig has all required fields', () => {
      expect(mockResponsibilityConfig.id).toBeDefined();
      expect(mockResponsibilityConfig.householdId).toBeDefined();
      expect(validTaskClassifications).toContain(mockResponsibilityConfig.defaultClassification);
      expect(mockResponsibilityConfig.responsibilityLabel).toBe('Responsibility');
      expect(mockResponsibilityConfig.jobLabel).toBe('Job');
      expect(mockResponsibilityConfig.showClassificationBadge).toBe(true);
      expect(mockResponsibilityConfig.allowMemberToggle).toBe(false);
    });

    it('validates UpdateResponsibilityConfigRequest allows partial updates', () => {
      expect(mockUpdateResponsibilityConfigRequest.defaultClassification).toBe('job');
      expect(mockUpdateResponsibilityConfigRequest.responsibilityLabel).toBeUndefined();
      expect(mockUpdateResponsibilityConfigRequest.jobLabel).toBeUndefined();
      expect(mockUpdateResponsibilityConfigRequest.showClassificationBadge).toBe(false);
      expect(mockUpdateResponsibilityConfigRequest.allowMemberToggle).toBe(true);
    });

    it('validates ChoreClassification fields structure', () => {
      expect(mockChoreClassification.id).toBe('cc-001');
      expect(mockChoreClassification.choreId).toBe('chore-make-bed');
      expect(validTaskClassifications).toContain(mockChoreClassification.classification);
      expect(mockChoreClassification.reason).toBe('Daily personal upkeep');
    });

    it('validates ClassifyChoreRequest with valid data', () => {
      const result = validateClassifyChoreRequest(mockClassifyChoreRequest);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects classify request with missing choreId', () => {
      const result = validateClassifyChoreRequest({ classification: 'job' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('choreId is required');
    });

    it('rejects classify request with invalid classification', () => {
      const result = validateClassifyChoreRequest({ choreId: 'chore-001', classification: 'chore' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('classification must be responsibility or job');
    });

    it('validates ClassificationSummary breakdown totals', () => {
      expect(mockClassificationSummary.totalChores).toBe(20);
      expect(mockClassificationSummary.responsibilities).toBe(12);
      expect(mockClassificationSummary.jobs).toBe(6);
      expect(mockClassificationSummary.unclassified).toBe(2);
      const sum = mockClassificationSummary.responsibilities
        + mockClassificationSummary.jobs
        + mockClassificationSummary.unclassified;
      expect(sum).toBe(mockClassificationSummary.totalChores);
    });

    it('validates ClassificationSummary member breakdown', () => {
      expect(mockClassificationSummary.memberBreakdown).toHaveLength(2);
      const alice = mockClassificationSummary.memberBreakdown[0];
      expect(alice.memberName).toBe('Alice');
      expect(alice.responsibilities).toBe(5);
      expect(alice.jobs).toBe(3);
      expect(alice.jobEarnings).toBe(15.0);
    });
  });

  // F19.5 Chore Marketplace
  describe('F19.5 Chore Marketplace', () => {
    it('defines valid ListingStatus types', () => {
      expect(validListingStatuses).toHaveLength(5);
      expect(validListingStatuses).toContain('open');
      expect(validListingStatuses).toContain('claimed');
      expect(validListingStatuses).toContain('completed');
      expect(validListingStatuses).toContain('expired');
      expect(validListingStatuses).toContain('cancelled');
    });

    it('validates MarketplaceListing has all required fields', () => {
      expect(mockMarketplaceListing.id).toBeDefined();
      expect(mockMarketplaceListing.choreId).toBe('chore-yard');
      expect(mockMarketplaceListing.choreName).toBe('Mow the Lawn');
      expect(mockMarketplaceListing.listedByName).toBe('Alice');
      expect(mockMarketplaceListing.claimedByName).toBe('Bob');
      expect(mockMarketplaceListing.pointBounty).toBe(30);
      expect(mockMarketplaceListing.bonusCondition).toBe('Edge the sidewalk too');
      expect(mockMarketplaceListing.bonusPoints).toBe(10);
      expect(validListingStatuses).toContain(mockMarketplaceListing.status);
      expect(mockMarketplaceListing.completedAt).toBeNull();
    });

    it('validates CreateMarketplaceListingRequest with valid data', () => {
      const result = validateCreateListingRequest(mockCreateListingRequest);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects listing with missing choreId', () => {
      const result = validateCreateListingRequest({ pointBounty: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('choreId is required');
    });

    it('rejects listing with zero bounty', () => {
      const result = validateCreateListingRequest({ choreId: 'chore-001', pointBounty: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('pointBounty must be a positive number');
    });

    it('rejects listing with negative expiration hours', () => {
      const result = validateCreateListingRequest({
        choreId: 'chore-001',
        pointBounty: 10,
        expiresInHours: -5,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('expiresInHours must be a positive number');
    });

    it('validates MarketplaceStats aggregation', () => {
      expect(mockMarketplaceStats.totalListings).toBe(45);
      expect(mockMarketplaceStats.activeListings).toBe(8);
      expect(mockMarketplaceStats.completedListings).toBe(32);
      expect(mockMarketplaceStats.totalPointsTraded).toBe(1500);
      expect(mockMarketplaceStats.topContributors).toHaveLength(2);
      expect(mockMarketplaceStats.topContributors[0].memberName).toBe('Bob');
      expect(mockMarketplaceStats.topContributors[0].pointsEarned).toBe(750);
    });

    it('validates MarketplaceConfig has all required fields', () => {
      expect(mockMarketplaceConfig.id).toBeDefined();
      expect(mockMarketplaceConfig.isEnabled).toBe(true);
      expect(mockMarketplaceConfig.maxBountyPoints).toBe(100);
      expect(mockMarketplaceConfig.minBountyPoints).toBe(5);
      expect(mockMarketplaceConfig.defaultExpirationHours).toBe(24);
      expect(mockMarketplaceConfig.requireParentApproval).toBe(true);
      expect(mockMarketplaceConfig.allowSelfListing).toBe(false);
    });

    it('validates UpdateMarketplaceConfigRequest allows partial updates', () => {
      expect(mockUpdateMarketplaceConfigRequest.maxBountyPoints).toBe(200);
      expect(mockUpdateMarketplaceConfigRequest.isEnabled).toBeUndefined();
      expect(mockUpdateMarketplaceConfigRequest.defaultExpirationHours).toBeUndefined();
      expect(mockUpdateMarketplaceConfigRequest.requireParentApproval).toBe(false);
      expect(mockUpdateMarketplaceConfigRequest.allowSelfListing).toBe(true);
    });

    it('validates marketplace config update rejects invalid max/min', () => {
      const result = validateMarketplaceConfigUpdate({
        maxBountyPoints: 5,
        minBountyPoints: 50,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxBountyPoints must be greater than or equal to minBountyPoints');
    });

    it('validates marketplace config update accepts valid range', () => {
      const result = validateMarketplaceConfigUpdate({
        maxBountyPoints: 200,
        minBountyPoints: 10,
      });
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('determines if a listing is claimable', () => {
      const openListing: MarketplaceListing = {
        ...mockMarketplaceListing,
        status: 'open',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      expect(isListingClaimable(openListing, 'mem-child-002')).toBe(true);
      expect(isListingClaimable(openListing, 'mem-child-001')).toBe(false); // lister cannot claim own
    });

    it('rejects claiming a non-open listing', () => {
      const claimedListing: MarketplaceListing = {
        ...mockMarketplaceListing,
        status: 'claimed',
      };
      expect(isListingClaimable(claimedListing, 'mem-child-003')).toBe(false);
    });

    it('validates bounty within marketplace config limits', () => {
      expect(validateBountyWithinLimits(50, mockMarketplaceConfig)).toEqual({ valid: true });
      expect(validateBountyWithinLimits(3, mockMarketplaceConfig)).toEqual({
        valid: false,
        error: 'Bounty must be at least 5 points',
      });
      expect(validateBountyWithinLimits(150, mockMarketplaceConfig)).toEqual({
        valid: false,
        error: 'Bounty cannot exceed 100 points',
      });
    });
  });
});
