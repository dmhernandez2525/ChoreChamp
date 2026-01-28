import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { householdRoutes } from './households';
import { memberRoutes } from './members';
import { choreRoutes } from './chores';
import { templateRoutes } from './templates';
import { scheduleRoutes } from './schedule';

export async function registerRoutes(fastify: FastifyInstance) {
  // Auth routes (handled by better-auth)
  fastify.register(authRoutes, { prefix: '/api/auth' });

  // API routes with version prefix
  fastify.register(async (api) => {
    // Household routes
    api.register(householdRoutes, { prefix: '/households' });

    // Nested member routes under households
    api.register(async (householdApi) => {
      householdApi.register(memberRoutes, { prefix: '/:householdId/members' });
      householdApi.register(choreRoutes, { prefix: '/:householdId/chores' });
      householdApi.register(scheduleRoutes, { prefix: '/:householdId/schedule' });
    });

    // Chore templates (public)
    api.register(templateRoutes, { prefix: '/chore-templates' });

    // Health/status check at API level
    api.get('/status', async () => {
      return {
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      };
    });
  }, { prefix: '/api' });
}
