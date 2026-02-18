import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function financialSchedulingRoutes(fastify: FastifyInstance) {
  // ==================== F19.1 Banking Integration ====================

  // GET /banking/connections - List banking connections
  fastify.get('/banking/connections', async (_request) => {
    return { connections: [] };
  });

  // POST /banking/connections - Create banking connection
  fastify.post('/banking/connections', {
    schema: {
      body: z.object({
        provider: z.enum(['plaid', 'stripe', 'manual']),
        accessToken: z.string().min(1),
        accountId: z.string().min(1),
        accountName: z.string().min(1),
        accountMask: z.string().min(1),
        institutionName: z.string().min(1),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, isActive: true, createdAt: new Date().toISOString() };
  });

  // DELETE /banking/connections/:connectionId - Remove banking connection
  fastify.delete('/banking/connections/:connectionId', async (request) => {
    const { connectionId } = request.params as { connectionId: string };
    return { id: connectionId, deleted: true };
  });

  // POST /banking/connections/:connectionId/verify - Verify banking connection
  fastify.post('/banking/connections/:connectionId/verify', async (request) => {
    const { connectionId } = request.params as { connectionId: string };
    return { id: connectionId, verified: true, lastVerifiedAt: new Date().toISOString() };
  });

  // GET /banking/deposits - List allowance deposits
  fastify.get('/banking/deposits', async (_request) => {
    return { deposits: [], total: 0 };
  });

  // POST /banking/deposits/trigger - Trigger manual deposit
  fastify.post('/banking/deposits/trigger', {
    schema: {
      body: z.object({
        memberId: z.string().uuid(),
        bankingConnectionId: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().default('USD'),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, status: 'pending', createdAt: new Date().toISOString() };
  });

  // GET /banking/deposit-configs - List deposit configurations
  fastify.get('/banking/deposit-configs', async (_request) => {
    return { configs: [] };
  });

  // POST /banking/deposit-configs - Create deposit config
  fastify.post('/banking/deposit-configs', {
    schema: {
      body: z.object({
        memberId: z.string().uuid(),
        bankingConnectionId: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().default('USD'),
        frequency: z.enum(['weekly', 'biweekly', 'monthly', 'on_demand']),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, isActive: true, createdAt: new Date().toISOString() };
  });

  // PUT /banking/deposit-configs/:configId - Update deposit config
  fastify.put('/banking/deposit-configs/:configId', async (request) => {
    const { configId } = request.params as { configId: string };
    const data = request.body as Record<string, unknown>;
    return { id: configId, ...data, updatedAt: new Date().toISOString() };
  });

  // DELETE /banking/deposit-configs/:configId - Delete deposit config
  fastify.delete('/banking/deposit-configs/:configId', async (request) => {
    const { configId } = request.params as { configId: string };
    return { id: configId, deleted: true };
  });

  // GET /banking/summary - Deposit summary
  fastify.get('/banking/summary', async (_request) => {
    return { totalDeposited: 0, pendingDeposits: 0, activeConfigs: 0, recentDeposits: [] };
  });

  // ==================== F19.2 Rotation System ====================

  // GET /rotations - List chore rotations
  fastify.get('/rotations', async (_request) => {
    return { rotations: [] };
  });

  // POST /rotations - Create rotation
  fastify.post('/rotations', {
    schema: {
      body: z.object({
        choreId: z.string().uuid(),
        rotationType: z.enum(['round_robin', 'weighted', 'random', 'skill_based']),
        frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
        participantIds: z.array(z.string().uuid()).min(2),
        skipWeekends: z.boolean().optional(),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, fairnessScore: 100, createdAt: new Date().toISOString() };
  });

  // GET /rotations/:rotationId - Get rotation details
  fastify.get('/rotations/:rotationId', async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    return { id: rotationId, rotationType: 'round_robin', participantIds: [], history: [] };
  });

  // PUT /rotations/:rotationId - Update rotation
  fastify.put('/rotations/:rotationId', async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    const data = request.body as Record<string, unknown>;
    return { id: rotationId, ...data, updatedAt: new Date().toISOString() };
  });

  // DELETE /rotations/:rotationId - Delete rotation
  fastify.delete('/rotations/:rotationId', async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    return { id: rotationId, deleted: true };
  });

  // POST /rotations/:rotationId/advance - Manually advance rotation
  fastify.post('/rotations/:rotationId/advance', async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    return { id: rotationId, nextAssigneeId: crypto.randomUUID(), advancedAt: new Date().toISOString() };
  });

  // POST /rotations/:rotationId/skip - Skip current member
  fastify.post('/rotations/:rotationId/skip', {
    schema: {
      body: z.object({
        reason: z.string().optional(),
      }),
    },
  }, async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    return { id: rotationId, skipped: true, message: 'Rotation skipped successfully' };
  });

  // GET /rotations/:rotationId/history - Get rotation history
  fastify.get('/rotations/:rotationId/history', async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    return { rotationId, history: [], total: 0 };
  });

  // GET /rotations/:rotationId/fairness - Get fairness report
  fastify.get('/rotations/:rotationId/fairness', async (request) => {
    const { rotationId } = request.params as { rotationId: string };
    return { rotationId, participants: [], overallFairnessScore: 100, recommendation: null };
  });

  // ==================== F19.3 Chore Chains ====================

  // GET /chains - List chore chains
  fastify.get('/chains', async (_request) => {
    return { chains: [] };
  });

  // POST /chains - Create chore chain
  fastify.post('/chains', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        bonusPoints: z.number().min(0).optional(),
        deadlineAt: z.string().optional(),
        steps: z.array(z.object({
          choreId: z.string().uuid(),
          stepOrder: z.number().min(1),
          dependencyType: z.enum(['must_complete_before', 'should_complete_before', 'can_start_after']),
          dependsOnStepId: z.string().uuid().optional(),
          assigneeId: z.string().uuid().optional(),
        })).min(2),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, status: 'pending', completedSteps: 0, createdAt: new Date().toISOString() };
  });

  // GET /chains/:chainId - Get chain with progress
  fastify.get('/chains/:chainId', async (request) => {
    const { chainId } = request.params as { chainId: string };
    return { chain: { id: chainId, status: 'pending', totalSteps: 0, completedSteps: 0 }, steps: [], percentComplete: 0, nextStep: null, blockedSteps: [] };
  });

  // PUT /chains/:chainId - Update chain
  fastify.put('/chains/:chainId', async (request) => {
    const { chainId } = request.params as { chainId: string };
    const data = request.body as Record<string, unknown>;
    return { id: chainId, ...data, updatedAt: new Date().toISOString() };
  });

  // DELETE /chains/:chainId - Delete chain
  fastify.delete('/chains/:chainId', async (request) => {
    const { chainId } = request.params as { chainId: string };
    return { id: chainId, deleted: true };
  });

  // POST /chains/:chainId/steps/:stepId/complete - Complete a chain step
  fastify.post('/chains/:chainId/steps/:stepId/complete', async (request) => {
    const { chainId, stepId } = request.params as { chainId: string; stepId: string };
    return { chainId, stepId, completed: true, completedAt: new Date().toISOString() };
  });

  // ==================== F19.4 Responsibilities vs Jobs ====================

  // GET /classification/config - Get responsibility config
  fastify.get('/classification/config', async (_request) => {
    return { defaultClassification: 'responsibility', responsibilityLabel: 'Responsibility', jobLabel: 'Job', showClassificationBadge: true, allowMemberToggle: false };
  });

  // PUT /classification/config - Update responsibility config
  fastify.put('/classification/config', async (request) => {
    const data = request.body as Record<string, unknown>;
    return { ...data, updatedAt: new Date().toISOString() };
  });

  // GET /classification/chores - List classifications
  fastify.get('/classification/chores', async (_request) => {
    return { classifications: [] };
  });

  // POST /classification/chores - Classify a chore
  fastify.post('/classification/chores', {
    schema: {
      body: z.object({
        choreId: z.string().uuid(),
        classification: z.enum(['responsibility', 'job']),
        reason: z.string().optional(),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
  });

  // PUT /classification/chores/:choreId - Update classification
  fastify.put('/classification/chores/:choreId', async (request) => {
    const { choreId } = request.params as { choreId: string };
    const data = request.body as Record<string, unknown>;
    return { choreId, ...data, updatedAt: new Date().toISOString() };
  });

  // GET /classification/summary - Get classification summary
  fastify.get('/classification/summary', async (_request) => {
    return { totalChores: 0, responsibilities: 0, jobs: 0, unclassified: 0, memberBreakdown: [] };
  });

  // ==================== F19.5 Chore Marketplace ====================

  // GET /marketplace/listings - List marketplace listings
  fastify.get('/marketplace/listings', async (_request) => {
    return { listings: [], total: 0 };
  });

  // POST /marketplace/listings - Create listing
  fastify.post('/marketplace/listings', {
    schema: {
      body: z.object({
        choreId: z.string().uuid(),
        pointBounty: z.number().positive(),
        bonusCondition: z.string().optional(),
        bonusPoints: z.number().min(0).optional(),
        expiresInHours: z.number().min(1).max(168).optional(),
      }),
    },
  }, async (request) => {
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, status: 'open', createdAt: new Date().toISOString() };
  });

  // POST /marketplace/listings/:listingId/claim - Claim a listing
  fastify.post('/marketplace/listings/:listingId/claim', async (request) => {
    const { listingId } = request.params as { listingId: string };
    return { id: listingId, status: 'claimed', claimedAt: new Date().toISOString() };
  });

  // POST /marketplace/listings/:listingId/complete - Complete listing
  fastify.post('/marketplace/listings/:listingId/complete', async (request) => {
    const { listingId } = request.params as { listingId: string };
    return { id: listingId, status: 'completed', completedAt: new Date().toISOString() };
  });

  // POST /marketplace/listings/:listingId/cancel - Cancel listing
  fastify.post('/marketplace/listings/:listingId/cancel', async (request) => {
    const { listingId } = request.params as { listingId: string };
    return { id: listingId, status: 'cancelled' };
  });

  // GET /marketplace/stats - Marketplace statistics
  fastify.get('/marketplace/stats', async (_request) => {
    return { totalListings: 0, activeListings: 0, completedListings: 0, totalPointsTraded: 0, topContributors: [] };
  });

  // GET /marketplace/config - Get marketplace config
  fastify.get('/marketplace/config', async (_request) => {
    return { isEnabled: true, maxBountyPoints: 500, minBountyPoints: 5, defaultExpirationHours: 48, requireParentApproval: true, allowSelfListing: false };
  });

  // PUT /marketplace/config - Update marketplace config
  fastify.put('/marketplace/config', async (request) => {
    const data = request.body as Record<string, unknown>;
    return { ...data, updatedAt: new Date().toISOString() };
  });
}
