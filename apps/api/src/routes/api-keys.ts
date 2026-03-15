import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';
import { db } from '../lib/db';
import { apiKeys, households } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getEffectiveTierForHousehold, isTierAtLeast } from '../lib/subscription';
import { verifyMembership } from '../lib/membership';

const createKeySchema = z.object({
  name: z.string().min(1).max(120),
});


async function ensurePremium(householdId: string) {
  const [household] = await db.select().from(households).where(eq(households.id, householdId));
  if (!household) return false;
  const effectiveTier = getEffectiveTierForHousehold(household);
  return isTierAtLeast(effectiveTier, 'premium');
}

function generateApiKey(): { secret: string; keyPrefix: string; keyHash: string } {
  const secret = `cc_live_${randomBytes(24).toString('hex')}`;
  const keyPrefix = secret.slice(0, 12);
  const keyHash = createHash('sha256').update(secret).digest('hex');
  return { secret, keyPrefix, keyHash };
}

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // List API keys
  fastify.get('/api-keys', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can manage API keys' });
    }

    const hasPremium = await ensurePremium(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'API access is available on Premium.' });
    }

    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.householdId, householdId))
      .orderBy(desc(apiKeys.createdAt));

    return keys.map((key) => ({
      id: key.id,
      householdId: key.householdId,
      name: key.name,
      keyPrefix: key.keyPrefix,
      createdByMemberId: key.createdByMemberId,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
      createdAt: key.createdAt,
    }));
  });

  // Create API key
  fastify.post('/api-keys', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createKeySchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can create API keys' });
    }

    const hasPremium = await ensurePremium(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'API access is available on Premium.' });
    }

    const { secret, keyPrefix, keyHash } = generateApiKey();

    const [created] = await db
      .insert(apiKeys)
      .values({
        householdId,
        name: body.name,
        keyHash,
        keyPrefix,
        createdByMemberId: membership.id,
      })
      .returning();

    return reply.status(201).send({
      apiKey: {
        id: created.id,
        householdId: created.householdId,
        name: created.name,
        keyPrefix: created.keyPrefix,
        createdByMemberId: created.createdByMemberId,
        lastUsedAt: created.lastUsedAt,
        revokedAt: created.revokedAt,
        createdAt: created.createdAt,
      },
      secret,
    });
  });

  // Revoke API key
  fastify.post('/api-keys/:keyId/revoke', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, keyId } = request.params as { householdId: string; keyId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can revoke API keys' });
    }

    const hasPremium = await ensurePremium(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'API access is available on Premium.' });
    }

    const [updated] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.householdId, householdId), eq(apiKeys.id, keyId)))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Not found', message: 'API key not found' });
    }

    return {
      id: updated.id,
      householdId: updated.householdId,
      name: updated.name,
      keyPrefix: updated.keyPrefix,
      createdByMemberId: updated.createdByMemberId,
      lastUsedAt: updated.lastUsedAt,
      revokedAt: updated.revokedAt,
      createdAt: updated.createdAt,
    };
  });
}
