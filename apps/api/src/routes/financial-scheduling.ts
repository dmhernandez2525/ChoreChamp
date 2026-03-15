import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

export async function financialSchedulingRoutes(fastify: FastifyInstance) {
  // ==================== F19.1 Banking Integration ====================

  // GET /banking/connections - List banking connections
  fastify.get('/banking/connections', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { connections: [] };
  });

  // POST /banking/connections - Create banking connection
  fastify.post('/banking/connections', {
    preHandler: [requireAuth],
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
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, isActive: true, createdAt: new Date().toISOString() };
  });

  // DELETE /banking/connections/:connectionId - Remove banking connection
  fastify.delete('/banking/connections/:connectionId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, connectionId } = request.params as { householdId: string; connectionId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: connectionId, deleted: true };
  });

  // POST /banking/connections/:connectionId/verify - Verify banking connection
  fastify.post('/banking/connections/:connectionId/verify', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, connectionId } = request.params as { householdId: string; connectionId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: connectionId, verified: true, lastVerifiedAt: new Date().toISOString() };
  });

  // GET /banking/deposits - List allowance deposits
  fastify.get('/banking/deposits', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { deposits: [], total: 0 };
  });

  // POST /banking/deposits/trigger - Trigger manual deposit
  fastify.post('/banking/deposits/trigger', {
    preHandler: [requireAuth],
    schema: {
      body: z.object({
        memberId: z.string().uuid(),
        bankingConnectionId: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().default('USD'),
      }),
    },
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, status: 'pending', createdAt: new Date().toISOString() };
  });

  // GET /banking/deposit-configs - List deposit configurations
  fastify.get('/banking/deposit-configs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { configs: [] };
  });

  // POST /banking/deposit-configs - Create deposit config
  fastify.post('/banking/deposit-configs', {
    preHandler: [requireAuth],
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
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, isActive: true, createdAt: new Date().toISOString() };
  });

  // PUT /banking/deposit-configs/:configId - Update deposit config
  fastify.put('/banking/deposit-configs/:configId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, configId } = request.params as { householdId: string; configId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: configId, ...data, updatedAt: new Date().toISOString() };
  });

  // DELETE /banking/deposit-configs/:configId - Delete deposit config
  fastify.delete('/banking/deposit-configs/:configId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, configId } = request.params as { householdId: string; configId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: configId, deleted: true };
  });

  // GET /banking/summary - Deposit summary
  fastify.get('/banking/summary', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { totalDeposited: 0, pendingDeposits: 0, activeConfigs: 0, recentDeposits: [] };
  });

  // ==================== F19.2 Rotation System ====================

  // GET /rotations - List chore rotations
  fastify.get('/rotations', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { rotations: [] };
  });

  // POST /rotations - Create rotation
  fastify.post('/rotations', {
    preHandler: [requireAuth],
    schema: {
      body: z.object({
        choreId: z.string().uuid(),
        rotationType: z.enum(['round_robin', 'weighted', 'random', 'skill_based']),
        frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
        participantIds: z.array(z.string().uuid()).min(2),
        skipWeekends: z.boolean().optional(),
      }),
    },
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, fairnessScore: 100, createdAt: new Date().toISOString() };
  });

  // GET /rotations/:rotationId - Get rotation details
  fastify.get('/rotations/:rotationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: rotationId, rotationType: 'round_robin', participantIds: [], history: [] };
  });

  // PUT /rotations/:rotationId - Update rotation
  fastify.put('/rotations/:rotationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: rotationId, ...data, updatedAt: new Date().toISOString() };
  });

  // DELETE /rotations/:rotationId - Delete rotation
  fastify.delete('/rotations/:rotationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: rotationId, deleted: true };
  });

  // POST /rotations/:rotationId/advance - Manually advance rotation
  fastify.post('/rotations/:rotationId/advance', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: rotationId, nextAssigneeId: crypto.randomUUID(), advancedAt: new Date().toISOString() };
  });

  // POST /rotations/:rotationId/skip - Skip current member
  fastify.post('/rotations/:rotationId/skip', {
    preHandler: [requireAuth],
    schema: {
      body: z.object({
        reason: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: rotationId, skipped: true, message: 'Rotation skipped successfully' };
  });

  // GET /rotations/:rotationId/history - Get rotation history
  fastify.get('/rotations/:rotationId/history', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { rotationId, history: [], total: 0 };
  });

  // GET /rotations/:rotationId/fairness - Get fairness report
  fastify.get('/rotations/:rotationId/fairness', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rotationId } = request.params as { householdId: string; rotationId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { rotationId, participants: [], overallFairnessScore: 100, recommendation: null };
  });

  // ==================== F19.3 Chore Chains ====================

  // GET /chains - List chore chains
  fastify.get('/chains', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { chains: [] };
  });

  // POST /chains - Create chore chain
  fastify.post('/chains', {
    preHandler: [requireAuth],
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
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, status: 'pending', completedSteps: 0, createdAt: new Date().toISOString() };
  });

  // GET /chains/:chainId - Get chain with progress
  fastify.get('/chains/:chainId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, chainId } = request.params as { householdId: string; chainId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { chain: { id: chainId, status: 'pending', totalSteps: 0, completedSteps: 0 }, steps: [], percentComplete: 0, nextStep: null, blockedSteps: [] };
  });

  // PUT /chains/:chainId - Update chain
  fastify.put('/chains/:chainId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, chainId } = request.params as { householdId: string; chainId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: chainId, ...data, updatedAt: new Date().toISOString() };
  });

  // DELETE /chains/:chainId - Delete chain
  fastify.delete('/chains/:chainId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, chainId } = request.params as { householdId: string; chainId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: chainId, deleted: true };
  });

  // POST /chains/:chainId/steps/:stepId/complete - Complete a chain step
  fastify.post('/chains/:chainId/steps/:stepId/complete', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, chainId, stepId } = request.params as { householdId: string; chainId: string; stepId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { chainId, stepId, completed: true, completedAt: new Date().toISOString() };
  });

  // ==================== F19.4 Responsibilities vs Jobs ====================

  // GET /classification/config - Get responsibility config
  fastify.get('/classification/config', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { defaultClassification: 'responsibility', responsibilityLabel: 'Responsibility', jobLabel: 'Job', showClassificationBadge: true, allowMemberToggle: false };
  });

  // PUT /classification/config - Update responsibility config
  fastify.put('/classification/config', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { ...data, updatedAt: new Date().toISOString() };
  });

  // GET /classification/chores - List classifications
  fastify.get('/classification/chores', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { classifications: [] };
  });

  // POST /classification/chores - Classify a chore
  fastify.post('/classification/chores', {
    preHandler: [requireAuth],
    schema: {
      body: z.object({
        choreId: z.string().uuid(),
        classification: z.enum(['responsibility', 'job']),
        reason: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
  });

  // PUT /classification/chores/:choreId - Update classification
  fastify.put('/classification/chores/:choreId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { choreId, ...data, updatedAt: new Date().toISOString() };
  });

  // GET /classification/summary - Get classification summary
  fastify.get('/classification/summary', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { totalChores: 0, responsibilities: 0, jobs: 0, unclassified: 0, memberBreakdown: [] };
  });

  // ==================== F19.5 Chore Marketplace ====================

  // GET /marketplace/listings - List marketplace listings
  fastify.get('/marketplace/listings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { listings: [], total: 0 };
  });

  // POST /marketplace/listings - Create listing
  fastify.post('/marketplace/listings', {
    preHandler: [requireAuth],
    schema: {
      body: z.object({
        choreId: z.string().uuid(),
        pointBounty: z.number().positive(),
        bonusCondition: z.string().optional(),
        bonusPoints: z.number().min(0).optional(),
        expiresInHours: z.number().min(1).max(168).optional(),
      }),
    },
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { id: crypto.randomUUID(), ...data, status: 'open', createdAt: new Date().toISOString() };
  });

  // POST /marketplace/listings/:listingId/claim - Claim a listing
  fastify.post('/marketplace/listings/:listingId/claim', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, listingId } = request.params as { householdId: string; listingId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: listingId, status: 'claimed', claimedAt: new Date().toISOString() };
  });

  // POST /marketplace/listings/:listingId/complete - Complete listing
  fastify.post('/marketplace/listings/:listingId/complete', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, listingId } = request.params as { householdId: string; listingId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: listingId, status: 'completed', completedAt: new Date().toISOString() };
  });

  // POST /marketplace/listings/:listingId/cancel - Cancel listing
  fastify.post('/marketplace/listings/:listingId/cancel', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, listingId } = request.params as { householdId: string; listingId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { id: listingId, status: 'cancelled' };
  });

  // GET /marketplace/stats - Marketplace statistics
  fastify.get('/marketplace/stats', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { totalListings: 0, activeListings: 0, completedListings: 0, totalPointsTraded: 0, topContributors: [] };
  });

  // GET /marketplace/config - Get marketplace config
  fastify.get('/marketplace/config', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { isEnabled: true, maxBountyPoints: 500, minBountyPoints: 5, defaultExpirationHours: 48, requireParentApproval: true, allowSelfListing: false };
  });

  // PUT /marketplace/config - Update marketplace config
  fastify.put('/marketplace/config', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = request.body as Record<string, unknown>;
    return { ...data, updatedAt: new Date().toISOString() };
  });
}
