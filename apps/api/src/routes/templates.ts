import { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';
import { db } from '../lib/db';
import { choreTemplates } from '@chorechamp/database';
import { optionalAuth } from '../middleware/auth';

export async function templateRoutes(fastify: FastifyInstance) {
  // Get all templates (public endpoint)
  fastify.get('/', {
    preHandler: [optionalAuth],
  }, async (request, reply) => {
    const { category, minAge, maxAge } = request.query as {
      category?: string;
      minAge?: string;
      maxAge?: string;
    };

    // Build conditions array
    const conditions = [eq(choreTemplates.isActive, true)];

    if (category) {
      conditions.push(eq(choreTemplates.category, category));
    }

    // Filter by age range if provided
    if (minAge || maxAge) {
      const age = parseInt(minAge || maxAge || '0', 10);
      conditions.push(
        or(
          isNull(choreTemplates.minAge),
          lte(choreTemplates.minAge, age)
        )!
      );
      conditions.push(
        or(
          isNull(choreTemplates.maxAge),
          gte(choreTemplates.maxAge, age)
        )!
      );
    }

    const templates = await db
      .select()
      .from(choreTemplates)
      .where(and(...conditions));

    return reply.send(templates);
  });

  // Get template categories
  fastify.get('/categories', {
    preHandler: [optionalAuth],
  }, async (_request, reply) => {
    const categories = [
      { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
      { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
      { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
      { id: 'living-room', name: 'Living Room', icon: '🛋️' },
      { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
      { id: 'pets', name: 'Pets', icon: '🐕' },
      { id: 'laundry', name: 'Laundry', icon: '👕' },
      { id: 'school', name: 'School', icon: '📚' },
      { id: 'self-care', name: 'Self Care', icon: '🧼' },
      { id: 'helping', name: 'Helping Others', icon: '🤝' },
    ];

    return reply.send(categories);
  });

  // Get a specific template
  fastify.get('/:templateId', {
    preHandler: [optionalAuth],
  }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };

    const [template] = await db
      .select()
      .from(choreTemplates)
      .where(and(
        eq(choreTemplates.id, templateId),
        eq(choreTemplates.isActive, true)
      ));

    if (!template) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Template not found',
      });
    }

    return reply.send(template);
  });
}
