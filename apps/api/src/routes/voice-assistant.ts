import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members, chores, choreSchedules, choreCompletions, rewards } from '@chorechamp/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import type {
  VoiceCommand,
  VoiceResponse,
  VoiceSession,
  VoiceSettings,
  VOICE_COMMAND_SAMPLES,
} from '@chorechamp/types';
import { parseVoiceCommand } from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { randomUUID } from 'crypto';

// In-memory storage (in production, use database/redis)
const voiceSessions = new Map<string, VoiceSession>();
const voiceSettings = new Map<string, VoiceSettings>();

// Helper to get default settings
function getDefaultSettings(): VoiceSettings {
  return {
    enabled: true,
    language: 'en-US',
    voiceSpeed: 'normal',
    confirmationRequired: true,
    soundEffects: true,
    customCommands: [],
  };
}

// Voice command samples for help
const COMMAND_SAMPLES: typeof VOICE_COMMAND_SAMPLES = [
  {
    intent: 'get_today_chores',
    category: 'Chores',
    samples: ["What are my chores today?", "Show today's chores", "What do I need to do?"],
    description: "Get a list of chores assigned for today",
  },
  {
    intent: 'complete_chore',
    category: 'Chores',
    samples: ["Mark [chore] as done", "I finished [chore]", "[chore] is done"],
    description: "Mark a specific chore as completed",
    requiresEntity: ['choreName'],
  },
  {
    intent: 'get_points',
    category: 'Points',
    samples: ["How many points do I have?", "What's my point balance?", "Show my points"],
    description: "Get current point balance",
  },
  {
    intent: 'get_leaderboard',
    category: 'Points',
    samples: ["Who's winning?", "Show the leaderboard", "Who has the most points?"],
    description: "Get the household leaderboard",
  },
  {
    intent: 'get_streak',
    category: 'Streaks',
    samples: ["What's my streak?", "How long is my streak?", "Streak status"],
    description: "Get current streak information",
  },
  {
    intent: 'get_rewards',
    category: 'Rewards',
    samples: ["What rewards are available?", "Show me rewards", "What can I redeem?"],
    description: "Get available rewards",
  },
  {
    intent: 'help',
    category: 'Help',
    samples: ["Help", "What can I say?", "What commands are available?"],
    description: "Get help with voice commands",
  },
];

export async function voiceAssistantRoutes(fastify: FastifyInstance) {
  // POST /api/households/:householdId/voice/process - Process voice command
  fastify.post('/process', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as { text: string; sessionId?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const text = body.text?.trim();
    if (!text) {
      return reply.status(400).send({
        error: 'Invalid request',
        message: 'Voice command text is required',
      });
    }

    // Parse the command
    const command = parseVoiceCommand(text);

    // Get or create session
    let session = body.sessionId ? voiceSessions.get(body.sessionId) : null;
    if (!session) {
      session = {
        sessionId: randomUUID(),
        memberId: membership.id,
        householdId,
        startedAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        commandHistory: [],
      };
      voiceSessions.set(session.sessionId, session);
    }

    // Add command to history
    session.commandHistory.push(command);
    session.lastInteraction = new Date().toISOString();
    session.context = { lastIntent: command.intent };

    // Process intent
    const response = await processIntent(command, membership, householdId, session);

    return {
      sessionId: session.sessionId,
      command,
      response,
    };
  });

  // GET /api/households/:householdId/voice/commands - Get available commands
  fastify.get('/commands', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Group by category
    const byCategory: Record<string, typeof COMMAND_SAMPLES> = {};
    for (const sample of COMMAND_SAMPLES) {
      if (!byCategory[sample.category]) {
        byCategory[sample.category] = [];
      }
      byCategory[sample.category].push(sample);
    }

    return {
      commands: COMMAND_SAMPLES,
      byCategory,
      totalCommands: COMMAND_SAMPLES.length,
    };
  });

  // GET /api/households/:householdId/voice/settings - Get voice settings
  fastify.get('/settings', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const settings = voiceSettings.get(membership.id) || getDefaultSettings();
    return settings;
  });

  // PUT /api/households/:householdId/voice/settings - Update voice settings
  fastify.put('/settings', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as Partial<VoiceSettings>;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const existing = voiceSettings.get(membership.id) || getDefaultSettings();
    const updated: VoiceSettings = {
      ...existing,
      ...body,
    };

    voiceSettings.set(membership.id, updated);
    return updated;
  });

  // GET /api/households/:householdId/voice/session/:sessionId - Get session
  fastify.get('/session/:sessionId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, sessionId } = request.params as {
      householdId: string;
      sessionId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const session = voiceSessions.get(sessionId);
    if (!session || session.memberId !== membership.id) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return session;
  });

  // DELETE /api/households/:householdId/voice/session/:sessionId - End session
  fastify.delete('/session/:sessionId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, sessionId } = request.params as {
      householdId: string;
      sessionId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const session = voiceSessions.get(sessionId);
    if (!session || session.memberId !== membership.id) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    voiceSessions.delete(sessionId);
    return { success: true };
  });
}

// Process voice intent
async function processIntent(
  command: VoiceCommand,
  member: typeof members.$inferSelect,
  householdId: string,
  _session: VoiceSession
): Promise<VoiceResponse> {
  switch (command.intent) {
    case 'get_today_chores':
    case 'get_my_chores':
      return await handleGetChores(member, householdId);

    case 'complete_chore':
      return await handleCompleteChore(command, member, householdId);

    case 'get_points':
      return handleGetPoints(member);

    case 'get_leaderboard':
      return await handleGetLeaderboard(householdId);

    case 'get_streak':
      return handleGetStreak(member);

    case 'get_rewards':
      return await handleGetRewards(householdId);

    case 'get_household_status':
      return await handleGetHouseholdStatus(householdId);

    case 'help':
      return handleHelp();

    case 'unknown':
    default:
      return {
        success: false,
        message: "I didn't understand that command.",
        spokenResponse: "I'm sorry, I didn't understand. Try saying 'help' to see what I can do.",
        suggestions: ["What are my chores?", "How many points do I have?", "Help"],
      };
  }
}

async function handleGetChores(
  member: typeof members.$inferSelect,
  householdId: string
): Promise<VoiceResponse> {
  const today = new Date().toISOString().split('T')[0];

  const schedules = await db.query.choreSchedules.findMany({
    where: and(
      eq(choreSchedules.householdId, householdId),
      eq(choreSchedules.assignedTo, member.id),
      eq(choreSchedules.scheduledDate, today),
      eq(choreSchedules.isCompleted, false)
    ),
  });

  const choreIds = schedules.map((s) => s.choreId);
  const choresData = choreIds.length > 0
    ? await db.query.chores.findMany({
        where: eq(chores.householdId, householdId),
      })
    : [];

  const choreMap = new Map(choresData.map((c) => [c.id, c]));
  const todayChores = schedules.map((s) => ({
    id: s.choreId,
    title: choreMap.get(s.choreId)?.title || 'Unknown',
    points: choreMap.get(s.choreId)?.pointValue || 0,
  }));

  if (todayChores.length === 0) {
    return {
      success: true,
      message: "You have no chores scheduled for today!",
      spokenResponse: "Great news! You have no chores scheduled for today.",
      data: { chores: todayChores },
    };
  }

  const choreList = todayChores.map((c) => c.title).join(', ');
  return {
    success: true,
    message: `You have ${todayChores.length} chore${todayChores.length !== 1 ? 's' : ''} today: ${choreList}`,
    spokenResponse: `You have ${todayChores.length} chore${todayChores.length !== 1 ? 's' : ''} today. ${todayChores.map((c) => c.title).join('. ')}`,
    data: { chores: todayChores },
    suggestions: todayChores.map((c) => `Mark ${c.title} as done`),
  };
}

async function handleCompleteChore(
  command: VoiceCommand,
  member: typeof members.$inferSelect,
  householdId: string
): Promise<VoiceResponse> {
  const choreName = command.entities.choreName;

  if (!choreName) {
    return {
      success: false,
      message: "Which chore would you like to complete?",
      spokenResponse: "Which chore would you like to mark as done?",
      followUpRequired: true,
      followUpPrompt: "Say the name of the chore you completed.",
    };
  }

  // Find matching chore
  const householdChores = await db.query.chores.findMany({
    where: and(
      eq(chores.householdId, householdId),
      eq(chores.isActive, true)
    ),
  });

  const matchingChore = householdChores.find(
    (c) => c.title.toLowerCase().includes(choreName.toLowerCase())
  );

  if (!matchingChore) {
    return {
      success: false,
      message: `I couldn't find a chore matching "${choreName}".`,
      spokenResponse: `I couldn't find a chore called ${choreName}. Try saying the exact name.`,
      suggestions: householdChores.slice(0, 3).map((c) => `Mark ${c.title} as done`),
    };
  }

  // Check if scheduled for today
  const today = new Date().toISOString().split('T')[0];
  const [schedule] = await db.query.choreSchedules.findMany({
    where: and(
      eq(choreSchedules.choreId, matchingChore.id),
      eq(choreSchedules.assignedTo, member.id),
      eq(choreSchedules.scheduledDate, today),
      eq(choreSchedules.isCompleted, false)
    ),
    limit: 1,
  });

  if (!schedule) {
    return {
      success: false,
      message: `"${matchingChore.title}" is not scheduled for you today.`,
      spokenResponse: `${matchingChore.title} is not on your schedule for today.`,
    };
  }

  // Create completion, update schedule, and award points atomically
  await db.transaction(async (tx) => {
    const [comp] = await tx.insert(choreCompletions).values({
      choreId: matchingChore.id,
      householdId,
      memberId: member.id,
      scheduledDate: today,
      status: 'pending',
      pointsAwarded: matchingChore.pointValue,
    }).returning();

    await tx.update(choreSchedules)
      .set({ isCompleted: true, completionId: comp.id })
      .where(eq(choreSchedules.id, schedule.id));

    await tx.update(members)
      .set({
        pointsCurrent: sql`${members.pointsCurrent} + ${matchingChore.pointValue}`,
        pointsLifetime: sql`${members.pointsLifetime} + ${matchingChore.pointValue}`,
      })
      .where(eq(members.id, member.id));

  });

  return {
    success: true,
    message: `Great job! You completed "${matchingChore.title}" and earned ${matchingChore.pointValue} points!`,
    spokenResponse: `Great job! You completed ${matchingChore.title} and earned ${matchingChore.pointValue} points!`,
    data: {
      choreId: matchingChore.id,
      choreTitle: matchingChore.title,
      points: matchingChore.pointValue,
    },
  };
}

function handleGetPoints(member: typeof members.$inferSelect): VoiceResponse {
  const points = member.pointsCurrent || 0;
  return {
    success: true,
    message: `You have ${points} points.`,
    spokenResponse: `You have ${points} points.`,
    data: { points, lifetimePoints: member.pointsLifetime || 0 },
  };
}

async function handleGetLeaderboard(householdId: string): Promise<VoiceResponse> {
  const householdMembers = await db.query.members.findMany({
    where: and(
      eq(members.householdId, householdId),
      eq(members.isActive, true)
    ),
  });

  const sortedMembers = householdMembers
    .filter((m) => m.role === 'child' || m.role === 'teen')
    .sort((a, b) => (b.pointsCurrent || 0) - (a.pointsCurrent || 0));

  if (sortedMembers.length === 0) {
    return {
      success: true,
      message: "No members in the leaderboard yet.",
      spokenResponse: "There are no members in the leaderboard yet.",
      data: { leaderboard: [] },
    };
  }

  const leader = sortedMembers[0];
  const leaderboard = sortedMembers.map((m, i) => ({
    rank: i + 1,
    name: m.name,
    points: m.pointsCurrent || 0,
  }));

  return {
    success: true,
    message: `${leader.name} is in the lead with ${leader.pointsCurrent || 0} points!`,
    spokenResponse: `${leader.name} is in the lead with ${leader.pointsCurrent || 0} points!`,
    data: { leaderboard },
  };
}

function handleGetStreak(member: typeof members.$inferSelect): VoiceResponse {
  const streak = member.streakCurrent || 0;
  const longest = member.streakLongest || 0;

  let message = `Your current streak is ${streak} day${streak !== 1 ? 's' : ''}.`;
  if (longest > streak) {
    message += ` Your best is ${longest} days.`;
  }

  return {
    success: true,
    message,
    spokenResponse: message,
    data: { currentStreak: streak, longestStreak: longest },
  };
}

async function handleGetRewards(householdId: string): Promise<VoiceResponse> {
  const availableRewards = await db.query.rewards.findMany({
    where: and(
      eq(rewards.householdId, householdId),
      eq(rewards.isActive, true)
    ),
  });

  if (availableRewards.length === 0) {
    return {
      success: true,
      message: "No rewards are available right now.",
      spokenResponse: "There are no rewards available right now.",
      data: { rewards: [] },
    };
  }

  const rewardList = availableRewards.map((r) => ({
    id: r.id,
    name: r.title,
    cost: r.pointCost,
  }));

  return {
    success: true,
    message: `There are ${availableRewards.length} rewards available.`,
    spokenResponse: `There are ${availableRewards.length} rewards available. ${availableRewards.slice(0, 3).map((r) => r.title).join(', ')}.`,
    data: { rewards: rewardList },
    suggestions: availableRewards.slice(0, 3).map((r) => `Redeem ${r.title}`),
  };
}

async function handleGetHouseholdStatus(householdId: string): Promise<VoiceResponse> {
  const today = new Date().toISOString().split('T')[0];

  const householdMembers = await db.query.members.findMany({
    where: eq(members.householdId, householdId),
  });

  const todaySchedules = await db.query.choreSchedules.findMany({
    where: and(
      eq(choreSchedules.householdId, householdId),
      eq(choreSchedules.scheduledDate, today)
    ),
  });

  const completed = todaySchedules.filter((s) => s.isCompleted).length;
  const total = todaySchedules.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

  const totalPoints = householdMembers.reduce((sum, m) => sum + (m.pointsCurrent || 0), 0);

  return {
    success: true,
    message: `Today the family has completed ${completed} of ${total} chores (${rate}% done). Total family points: ${totalPoints}.`,
    spokenResponse: `The family has completed ${completed} of ${total} chores today. That's ${rate}% done. The family has a total of ${totalPoints} points.`,
    data: {
      completedToday: completed,
      totalToday: total,
      completionRate: rate,
      totalFamilyPoints: totalPoints,
    },
  };
}

function handleHelp(): VoiceResponse {
  const sampleCommands = [
    "What are my chores today?",
    "Mark [chore name] as done",
    "How many points do I have?",
    "Who's winning?",
    "What's my streak?",
    "What rewards are available?",
  ];

  return {
    success: true,
    message: `Here are some things you can say: ${sampleCommands.join(', ')}`,
    spokenResponse: `You can ask about your chores, mark chores as done, check your points, see the leaderboard, check your streak, or view rewards. For example, say "What are my chores today?"`,
    data: { sampleCommands, allCommands: COMMAND_SAMPLES },
    suggestions: sampleCommands.slice(0, 4),
  };
}
