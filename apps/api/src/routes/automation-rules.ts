import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { choreAutomationRules } from '@chorechamp/database/schema';
import { db } from '../lib/db';
import { requireAuth } from '../middleware/auth';

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
  }, async (request, reply) => {
    const { householdId } = request.params as { householdId: string };

    const result = await db
      .select()
      .from(choreAutomationRules)
      .where(eq(choreAutomationRules.householdId, householdId))
      .orderBy(choreAutomationRules.name);

    return reply.send(result);
  });

  // POST /:householdId/automation/rules - Create a new rule
  app.post('/:householdId/automation/rules', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const body = createRuleSchema.parse(request.body);

    const [rule] = await db
      .insert(choreAutomationRules)
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
  }, async (request, reply) => {
    const { householdId, ruleId } = request.params as { householdId: string; ruleId: string };
    const body = updateRuleSchema.parse(request.body);

    const [updated] = await db
      .update(choreAutomationRules)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(choreAutomationRules.id, ruleId), eq(choreAutomationRules.householdId, householdId)))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Rule not found' });
    }

    return reply.send(updated);
  });

  // DELETE /:householdId/automation/rules/:ruleId - Delete a rule
  app.delete('/:householdId/automation/rules/:ruleId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { householdId, ruleId } = request.params as { householdId: string; ruleId: string };

    await db
      .delete(choreAutomationRules)
      .where(and(eq(choreAutomationRules.id, ruleId), eq(choreAutomationRules.householdId, householdId)));

    return reply.status(204).send();
  });

  // POST /:householdId/automation/rules/:ruleId/toggle - Toggle enabled
  app.post('/:householdId/automation/rules/:ruleId/toggle', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { householdId, ruleId } = request.params as { householdId: string; ruleId: string };

    // Fetch current state
    const [existing] = await db
      .select({ enabled: choreAutomationRules.enabled })
      .from(choreAutomationRules)
      .where(and(eq(choreAutomationRules.id, ruleId), eq(choreAutomationRules.householdId, householdId)));

    if (!existing) {
      return reply.status(404).send({ error: 'Rule not found' });
    }

    const [updated] = await db
      .update(choreAutomationRules)
      .set({
        enabled: !existing.enabled,
        updatedAt: new Date(),
      })
      .where(and(eq(choreAutomationRules.id, ruleId), eq(choreAutomationRules.householdId, householdId)))
      .returning();

    return reply.send(updated);
  });
}
