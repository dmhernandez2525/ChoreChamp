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
import { voiceAssistantRoutes } from './voice-assistant';
import { difficultyCalibrationRoutes } from './difficulty-calibration';
import { streakProtectionRoutes } from './streak-protection';
import { familyChallengeRoutes } from './family-challenges';
import { communityTemplateRoutes } from './community-templates';
import { achievementShowcaseRoutes } from './achievement-showcase';
import { seasonalEventRoutes } from './seasonal-events';
import { familyAnalyticsRoutes } from './family-analytics';
import { rpgCharacterRoutes } from './rpg-character';
import { virtualPetRoutes } from './virtual-pet';
import { miniGamesRoutes } from './mini-games';
import { collectibleCardsRoutes } from './collectible-cards';
import { storyModeRoutes } from './story-mode';
import { smartHomeRoutes } from './smart-home';
import { choreDetectionRoutes } from './chore-detection';
import { qrVerificationRoutes } from './qr-verification';
import { geofencingRoutes } from './geofencing';
import { screenTimeRoutes } from './screen-time';
import { homeworkRoutes } from './homework';
import { educationalChoreRoutes } from './educational-chores';
import { reportCardRoutes } from './report-cards';
import { skillBuildingRoutes } from './skill-building';
import { schoolExtracurricularRoutes } from './school-extracurricular';
import { subscriptionRoutes } from './subscription';
import { rewardRoutes } from './rewards';
import { supportRoutes } from './support';
import { apiKeyRoutes } from './api-keys';
import { inAppStoreRoutes } from './in-app-store';
import { enterpriseSchoolRoutes } from './enterprise-school';
import { developerApiPlatformRoutes, oauthPlatformRoutes, publicApiPlatformRoutes } from './api-platform';
import { healthWellnessRoutes } from './health-wellness';
import { advancedAnalyticsRoutes } from './advanced-analytics';
import { communitySocialRoutes } from './community-social';
import { smartAutomationRoutes } from './smart-automation';
import { communicationCalendarRoutes } from './communication-calendar';
import { financialSchedulingRoutes } from './financial-scheduling';

export async function registerRoutes(fastify: FastifyInstance) {
  // Auth routes (handled by better-auth)
  fastify.register(authRoutes, { prefix: '/api/auth' });

  // API routes with version prefix
  fastify.register(
    async (api) => {
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
        householdApi.register(voiceAssistantRoutes, { prefix: '/:householdId/voice' });
        householdApi.register(difficultyCalibrationRoutes, { prefix: '/:householdId/calibration' });
        householdApi.register(streakProtectionRoutes, {
          prefix: '/:householdId/streak-protection',
        });
        householdApi.register(familyChallengeRoutes, { prefix: '/:householdId/challenges' });
        householdApi.register(achievementShowcaseRoutes, { prefix: '/:householdId/achievements' });
        householdApi.register(seasonalEventRoutes, { prefix: '/:householdId/events' });
        householdApi.register(familyAnalyticsRoutes, { prefix: '/:householdId/analytics' });
        householdApi.register(rpgCharacterRoutes, { prefix: '/:householdId/characters' });
        householdApi.register(virtualPetRoutes, { prefix: '/:householdId/pets' });
        householdApi.register(miniGamesRoutes, { prefix: '/:householdId/games' });
        householdApi.register(collectibleCardsRoutes, { prefix: '/:householdId/cards' });
        householdApi.register(storyModeRoutes, { prefix: '/:householdId/story' });
        householdApi.register(smartHomeRoutes, { prefix: '/:householdId/smart-home' });
        householdApi.register(choreDetectionRoutes, { prefix: '/:householdId/detection' });
        householdApi.register(qrVerificationRoutes, { prefix: '/:householdId' });
        householdApi.register(geofencingRoutes, { prefix: '/:householdId' });
        householdApi.register(screenTimeRoutes, { prefix: '/:householdId/screen-time' });
        householdApi.register(homeworkRoutes, { prefix: '/:householdId/homework' });
        householdApi.register(educationalChoreRoutes, { prefix: '/:householdId/educational' });
        householdApi.register(reportCardRoutes, { prefix: '/:householdId/report-cards' });
        householdApi.register(skillBuildingRoutes, { prefix: '/:householdId/skills' });
        householdApi.register(schoolExtracurricularRoutes, { prefix: '/:householdId/school' });
        householdApi.register(rewardRoutes, { prefix: '/:householdId' });
        householdApi.register(supportRoutes, { prefix: '/:householdId' });
        householdApi.register(apiKeyRoutes, { prefix: '/:householdId' });
        householdApi.register(inAppStoreRoutes, { prefix: '/:householdId/store' });
        householdApi.register(enterpriseSchoolRoutes, { prefix: '/:householdId' });
        householdApi.register(developerApiPlatformRoutes, { prefix: '/:householdId' });
        householdApi.register(healthWellnessRoutes, { prefix: '/:householdId/wellness' });
        householdApi.register(advancedAnalyticsRoutes, { prefix: '/:householdId/admin-analytics' });
        householdApi.register(communitySocialRoutes, { prefix: '/:householdId/community' });
        householdApi.register(smartAutomationRoutes, { prefix: '/:householdId/automation' });
        householdApi.register(communicationCalendarRoutes, { prefix: '/:householdId/family-hub' });
        householdApi.register(financialSchedulingRoutes, { prefix: '/:householdId/financial' });
      });

      // Chore templates (public)
      api.register(templateRoutes, { prefix: '/chore-templates' });

      // Community templates
      api.register(communityTemplateRoutes, { prefix: '/community-templates' });

      // Notification routes
      api.register(notificationRoutes, { prefix: '/notifications' });

      // Subscription & billing routes
      api.register(subscriptionRoutes, { prefix: '/subscription' });

      // OAuth and public developer platform routes
      api.register(oauthPlatformRoutes, { prefix: '/oauth' });
      api.register(publicApiPlatformRoutes, { prefix: '/public/v1' });

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
    },
    { prefix: '/api' }
  );
}
