// Voice Assistant Integration Types

// Voice command intent types
export type VoiceIntent =
  | 'get_today_chores'
  | 'get_my_chores'
  | 'complete_chore'
  | 'get_points'
  | 'get_leaderboard'
  | 'get_streak'
  | 'skip_chore'
  | 'get_rewards'
  | 'redeem_reward'
  | 'get_household_status'
  | 'set_reminder'
  | 'help'
  | 'unknown';

// Voice command entities
export interface VoiceEntities {
  choreName?: string;
  choreId?: string;
  memberName?: string;
  memberId?: string;
  rewardName?: string;
  rewardId?: string;
  time?: string;
  date?: string;
  number?: number;
}

// Parsed voice command
export interface VoiceCommand {
  rawText: string;
  intent: VoiceIntent;
  confidence: number;
  entities: VoiceEntities;
  timestamp: string;
}

// Voice command response
export interface VoiceResponse {
  success: boolean;
  message: string;
  spokenResponse: string;
  data?: Record<string, unknown>;
  suggestions?: string[];
  followUpRequired?: boolean;
  followUpPrompt?: string;
}

// Voice session state
export interface VoiceSession {
  sessionId: string;
  memberId: string;
  householdId: string;
  startedAt: string;
  lastInteraction: string;
  commandHistory: VoiceCommand[];
  context?: {
    lastIntent?: VoiceIntent;
    pendingChoreId?: string;
    pendingRewardId?: string;
    awaitingConfirmation?: boolean;
    confirmationAction?: string;
  };
}

// Voice assistant settings
export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voiceSpeed: 'slow' | 'normal' | 'fast';
  confirmationRequired: boolean;
  soundEffects: boolean;
  wakeWord?: string;
  customCommands?: CustomVoiceCommand[];
}

// Custom voice command mapping
export interface CustomVoiceCommand {
  id: string;
  trigger: string;
  intent: VoiceIntent;
  entities?: VoiceEntities;
  description?: string;
}

// Voice command sample phrases
export interface VoiceCommandSample {
  intent: VoiceIntent;
  category: string;
  samples: string[];
  description: string;
  requiresEntity?: string[];
}

// Default voice command samples
export const VOICE_COMMAND_SAMPLES: VoiceCommandSample[] = [
  {
    intent: 'get_today_chores',
    category: 'Chores',
    samples: [
      "What are my chores today?",
      "Show today's chores",
      "What do I need to do?",
      "List my tasks",
    ],
    description: "Get a list of chores assigned for today",
  },
  {
    intent: 'get_my_chores',
    category: 'Chores',
    samples: [
      "What are my chores?",
      "Show my assigned chores",
      "What chores do I have?",
    ],
    description: "Get all assigned chores",
  },
  {
    intent: 'complete_chore',
    category: 'Chores',
    samples: [
      "Mark [chore] as done",
      "I finished [chore]",
      "Complete [chore]",
      "[chore] is done",
    ],
    description: "Mark a specific chore as completed",
    requiresEntity: ['choreName'],
  },
  {
    intent: 'get_points',
    category: 'Points',
    samples: [
      "How many points do I have?",
      "What's my point balance?",
      "Show my points",
      "Check my points",
    ],
    description: "Get current point balance",
  },
  {
    intent: 'get_leaderboard',
    category: 'Points',
    samples: [
      "Who's winning?",
      "Show the leaderboard",
      "Who has the most points?",
      "Family rankings",
    ],
    description: "Get the household leaderboard",
  },
  {
    intent: 'get_streak',
    category: 'Streaks',
    samples: [
      "What's my streak?",
      "How long is my streak?",
      "Show my streak",
      "Streak status",
    ],
    description: "Get current streak information",
  },
  {
    intent: 'skip_chore',
    category: 'Chores',
    samples: [
      "Skip [chore]",
      "I can't do [chore] today",
      "Postpone [chore]",
    ],
    description: "Request to skip a chore",
    requiresEntity: ['choreName'],
  },
  {
    intent: 'get_rewards',
    category: 'Rewards',
    samples: [
      "What rewards are available?",
      "Show me rewards",
      "What can I redeem?",
      "List rewards",
    ],
    description: "Get available rewards",
  },
  {
    intent: 'redeem_reward',
    category: 'Rewards',
    samples: [
      "Redeem [reward]",
      "I want [reward]",
      "Claim [reward]",
    ],
    description: "Request to redeem a reward",
    requiresEntity: ['rewardName'],
  },
  {
    intent: 'get_household_status',
    category: 'Family',
    samples: [
      "How is the family doing?",
      "Household status",
      "Family progress",
      "Show family stats",
    ],
    description: "Get overall household status",
  },
  {
    intent: 'set_reminder',
    category: 'Reminders',
    samples: [
      "Remind me about [chore]",
      "Set a reminder for [chore]",
      "Alert me about [chore] at [time]",
    ],
    description: "Set a reminder for a chore",
    requiresEntity: ['choreName'],
  },
  {
    intent: 'help',
    category: 'Help',
    samples: [
      "Help",
      "What can I say?",
      "What commands are available?",
      "Show me what I can do",
    ],
    description: "Get help with voice commands",
  },
];

// Intent patterns for parsing
export const INTENT_PATTERNS: { intent: VoiceIntent; patterns: RegExp[] }[] = [
  {
    intent: 'get_today_chores',
    patterns: [
      /what('s| are| is)? (my )?(today'?s? )?chores?( today)?/i,
      /show( me)? (my )?(today'?s? )?chores?/i,
      /what do i (need|have) to do/i,
      /list (my )?tasks/i,
    ],
  },
  {
    intent: 'complete_chore',
    patterns: [
      /mark (.+) (as )?(done|complete|finished)/i,
      /i (finished|completed|did|done) (.+)/i,
      /complete (.+)/i,
      /(.+) is (done|complete|finished)/i,
    ],
  },
  {
    intent: 'get_points',
    patterns: [
      /how many points do i have/i,
      /what('s| is) my point(s)? balance/i,
      /show (me )?my points/i,
      /check my points/i,
    ],
  },
  {
    intent: 'get_leaderboard',
    patterns: [
      /who('s| is) winning/i,
      /show (me )?the leaderboard/i,
      /who has the most points/i,
      /family rankings/i,
      /leaderboard/i,
    ],
  },
  {
    intent: 'get_streak',
    patterns: [
      /what('s| is) my streak/i,
      /how long is my streak/i,
      /show (me )?my streak/i,
      /streak status/i,
    ],
  },
  {
    intent: 'get_rewards',
    patterns: [
      /what rewards (are )?available/i,
      /show (me )?rewards/i,
      /what can i redeem/i,
      /list rewards/i,
    ],
  },
  {
    intent: 'get_household_status',
    patterns: [
      /how is the family doing/i,
      /household status/i,
      /family progress/i,
      /show family stats/i,
    ],
  },
  {
    intent: 'help',
    patterns: [
      /^help$/i,
      /what can i say/i,
      /what commands (are )?available/i,
      /show (me )?what i can do/i,
    ],
  },
];

// Helper to parse voice command
export function parseVoiceCommand(text: string): VoiceCommand {
  const normalizedText = text.trim().toLowerCase();
  let matchedIntent: VoiceIntent = 'unknown';
  let confidence = 0;
  const entities: VoiceEntities = {};

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        matchedIntent = intent;
        confidence = 0.9;

        // Extract entity from capture groups
        if (match[1] || match[2]) {
          const choreName = (match[2] || match[1] || '').trim();
          if (choreName && !['as', 'is', 'the', 'my'].includes(choreName)) {
            entities.choreName = choreName;
          }
        }
        break;
      }
    }
    if (matchedIntent !== 'unknown') break;
  }

  return {
    rawText: text,
    intent: matchedIntent,
    confidence: confidence || 0.3,
    entities,
    timestamp: new Date().toISOString(),
  };
}

// Helper to generate spoken response
export function generateSpokenResponse(
  intent: VoiceIntent,
  success: boolean,
  data?: Record<string, unknown>
): string {
  if (!success) {
    return "I'm sorry, I couldn't complete that request. Please try again.";
  }

  switch (intent) {
    case 'get_today_chores': {
      const choreCount = (data?.chores as unknown[])?.length || 0;
      if (choreCount === 0) {
        return "Great news! You have no chores scheduled for today.";
      }
      return `You have ${choreCount} chore${choreCount !== 1 ? 's' : ''} today.`;
    }

    case 'complete_chore': {
      const points = data?.points || 0;
      return `Done! You earned ${points} points.`;
    }

    case 'get_points':
      return `You have ${data?.points || 0} points.`;

    case 'get_streak':
      return `Your current streak is ${data?.streak || 0} days.`;

    case 'help':
      return "You can ask about your chores, check your points, view the leaderboard, or mark chores as complete.";

    default:
      return "Got it!";
  }
}
