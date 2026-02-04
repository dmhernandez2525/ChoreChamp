import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../lib/db';
import { apiKeys, households } from '@chorechamp/database/schema';
import { createLogger } from '../lib/logger';

const logger = createLogger('api-key-auth');

export interface ApiKeyAuthenticatedRequest extends FastifyRequest {
  apiKey: {
    id: string;
    householdId: string;
    name: string;
  };
  household: {
    id: string;
    name: string;
    subscriptionTier: string | null;
  };
}

/**
 * Hash an API key for comparison with stored hashes
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Extract API key from request headers
 * Supports both 'Authorization: Bearer <key>' and 'X-API-Key: <key>' formats
 */
function extractApiKey(request: FastifyRequest): string | null {
  // Check Authorization header (Bearer token format)
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Only accept ChoreChamp API keys (cc_live_ prefix)
    if (token.startsWith('cc_live_')) {
      return token;
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.startsWith('cc_live_')) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Middleware to authenticate requests using API keys.
 * API keys are hashed and compared against stored hashes.
 * Only non-revoked keys for Premium tier households are accepted.
 */
export async function requireApiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKeyValue = extractApiKey(request);

  if (!apiKeyValue) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key required. Provide via Authorization: Bearer <key> or X-API-Key header.',
    });
  }

  // Extract prefix for quick lookup (first 12 chars)
  const keyPrefix = apiKeyValue.slice(0, 12);

  // Hash the provided key
  const keyHash = hashApiKey(apiKeyValue);

  // Look up the API key by prefix and hash
  const [apiKeyRecord] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyPrefix, keyPrefix),
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt) // Only non-revoked keys
      )
    );

  if (!apiKeyRecord) {
    logger.warn({
      keyPrefix,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }, 'Invalid or revoked API key attempt');

    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or revoked API key',
    });
  }

  // Fetch the household to verify Premium status
  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, apiKeyRecord.householdId));

  if (!household) {
    logger.error({
      apiKeyId: apiKeyRecord.id,
      householdId: apiKeyRecord.householdId,
    }, 'API key references non-existent household');

    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // Verify household has Premium subscription (API access is Premium-only)
  if (household.subscriptionTier !== 'premium') {
    logger.warn({
      apiKeyId: apiKeyRecord.id,
      householdId: household.id,
      subscriptionTier: household.subscriptionTier,
    }, 'API key used by non-Premium household');

    return reply.status(403).send({
      error: 'Forbidden',
      message: 'API access requires a Premium subscription',
    });
  }

  // Update lastUsedAt timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKeyRecord.id))
    .execute()
    .catch((error) => {
      logger.error({ error, apiKeyId: apiKeyRecord.id }, 'Failed to update lastUsedAt');
    });

  // Attach API key info and household to request
  (request as ApiKeyAuthenticatedRequest).apiKey = {
    id: apiKeyRecord.id,
    householdId: apiKeyRecord.householdId,
    name: apiKeyRecord.name,
  };

  (request as ApiKeyAuthenticatedRequest).household = {
    id: household.id,
    name: household.name,
    subscriptionTier: household.subscriptionTier,
  };

  logger.info({
    apiKeyId: apiKeyRecord.id,
    apiKeyName: apiKeyRecord.name,
    householdId: household.id,
  }, 'API key authenticated successfully');
}

/**
 * Optional API key auth - does not fail if no key provided.
 * Useful for endpoints that support both session auth and API key auth.
 */
export async function optionalApiKeyAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const apiKeyValue = extractApiKey(request);

  if (!apiKeyValue) {
    // No API key provided - continue without auth
    return;
  }

  const keyPrefix = apiKeyValue.slice(0, 12);
  const keyHash = hashApiKey(apiKeyValue);

  const [apiKeyRecord] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyPrefix, keyPrefix),
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt)
      )
    );

  if (!apiKeyRecord) {
    // Invalid key - silently ignore for optional auth
    return;
  }

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, apiKeyRecord.householdId));

  if (!household || household.subscriptionTier !== 'premium') {
    return;
  }

  // Update lastUsedAt
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKeyRecord.id))
    .execute()
    .catch(() => {});

  (request as ApiKeyAuthenticatedRequest).apiKey = {
    id: apiKeyRecord.id,
    householdId: apiKeyRecord.householdId,
    name: apiKeyRecord.name,
  };

  (request as ApiKeyAuthenticatedRequest).household = {
    id: household.id,
    name: household.name,
    subscriptionTier: household.subscriptionTier,
  };
}
