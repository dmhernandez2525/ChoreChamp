import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { householdRoutes } from './households';
import { memberRoutes } from './members';
import { choreRoutes } from './chores';
import { templateRoutes } from './templates';
import { scheduleRoutes } from './schedule';
import { bossBattleRoutes } from './boss-battles';
import { activityRoutes } from './activity';
import { reportsRoutes } from './reports';
import { notificationRoutes } from './notifications';
import { multiHouseholdRoutes } from './multi-household';
import { tradeRoutes } from './trades';
import { allowanceRoutes } from './allowance';
import { dashboardRoutes } from './dashboard';
import { ageAppropriateRoutes } from './age-appropriate';
import { aiSchedulingRoutes } from './ai-scheduling';
import { reminderRoutes } from './reminders';

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
      householdApi.register(bossBattleRoutes, { prefix: '/:householdId/boss-battles' });
      householdApi.register(activityRoutes, { prefix: '/:householdId/activity' });
      householdApi.register(reportsRoutes, { prefix: '/:householdId/reports' });
      householdApi.register(tradeRoutes, { prefix: '/:householdId/trades' });
      householdApi.register(allowanceRoutes, { prefix: '/:householdId/allowance' });
      householdApi.register(dashboardRoutes, { prefix: '/:householdId/dashboard' });
      householdApi.register(ageAppropriateRoutes, { prefix: '/:householdId/age-appropriate' });
      householdApi.register(aiSchedulingRoutes, { prefix: '/:householdId/ai-schedule' });
      householdApi.register(reminderRoutes, { prefix: '/:householdId/reminders' });
    });

    // Chore templates (public)
    api.register(templateRoutes, { prefix: '/chore-templates' });

    // Notification routes
    api.register(notificationRoutes, { prefix: '/notifications' });

    // Multi-household routes (household switching, member links, etc.)
    api.register(multiHouseholdRoutes);

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
