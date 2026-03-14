import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { automationRules } from '@chorechamp/database/schema';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const triggerValues = [
  'chore_completed',
  'chore_created',
  'due_date_passed',
  'status_changed',
  'assigned',
] as const;

const actionValues = [
  'assign',
  'change_status',
  'add_tag',
  'send_notification',
  'set_priority',
  'create_chore',
] as const;

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  trigger: z.enum(triggerValues),
  triggerConfig: z.record(z.unknown()).default({}),
  action: z.enum(actionValues),
  actionConfig: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

export async function automationRuleRoutes(app: FastifyInstance) {
  // GET /:householdId/automation/rules - List all rules for household
  app.get('/:householdId/automation/rules', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest) => {
    const { householdId } = request.params as { householdId: string };
    const db = request.server.db;

    const result = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.householdId, householdId))
      .orderBy(automationRules.name);

    return result;
  });

  // POST /:householdId/automation/rules - Create a new rule
  app.post('/:householdId/automation/rules', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest, reply) => {
    const { householdId } = request.params as { householdId: string };
    const body = createRuleSchema.parse(request.body);
    const db = request.server.db;

    const [rule] = await db
      .insert(automationRules)
      .values({
        householdId,
        name: body.name,
        description: body.description ?? null,
        trigger: body.trigger,
        triggerConfig: body.triggerConfig,
        action: body.action,
        actionConfig: body.actionConfig,
        enabled: body.enabled,
      })
      .returning();

    return reply.status(201).send(rule);
  });

  // PUT /:householdId/automation/rules/:ruleId - Update a rule
  app.put('/:householdId/automation/rules/:ruleId', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest, reply) => {
    const { householdId, ruleId } = request.params as { householdId: string; ruleId: string };
    const body = updateRuleSchema.parse(request.body);
    const db = request.server.db;

    const [updated] = await db
      .update(automationRules)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(automationRules.id, ruleId), eq(automationRules.householdId, householdId)))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Rule not found' });
    }

    return updated;
  });

  // DELETE /:householdId/automation/rules/:ruleId - Delete a rule
  app.delete('/:householdId/automation/rules/:ruleId', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest, reply) => {
    const { householdId, ruleId } = request.params as { householdId: string; ruleId: string };
    const db = request.server.db;

    await db
      .delete(automationRules)
      .where(and(eq(automationRules.id, ruleId), eq(automationRules.householdId, householdId)));

    return reply.status(204).send();
  });

  // POST /:householdId/automation/rules/:ruleId/toggle - Toggle enabled
  app.post('/:householdId/automation/rules/:ruleId/toggle', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest, reply) => {
    const { householdId, ruleId } = request.params as { householdId: string; ruleId: string };
    const db = request.server.db;

    // Fetch current state
    const [existing] = await db
      .select({ enabled: automationRules.enabled })
      .from(automationRules)
      .where(and(eq(automationRules.id, ruleId), eq(automationRules.householdId, householdId)));

    if (!existing) {
      return reply.status(404).send({ error: 'Rule not found' });
    }

    const [updated] = await db
      .update(automationRules)
      .set({
        enabled: !existing.enabled,
        updatedAt: new Date(),
      })
      .where(and(eq(automationRules.id, ruleId), eq(automationRules.householdId, householdId)))
      .returning();

    return updated;
  });
}
