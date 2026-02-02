// Story Mode Seed Data (F9.5)

import { db } from '../index';
import {
  storyCharacters,
  storyChapters,
  chapterCharacters,
  storyQuests,
  storyDialogues
} from '../schema/story-mode';

// Story Characters
const characters = [
  {
    id: 'captain-clean',
    name: 'Captain Clean',
    title: 'The Spotless Hero',
    description: 'A legendary hero who has dedicated their life to fighting dust and grime across the land.',
    avatar: '/assets/characters/captain-clean.png',
    personality: 'Brave, encouraging, and always ready with a cleaning tip.',
    unlockCondition: null,
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'dusty-the-dragon',
    name: 'Dusty',
    title: 'The Reformed Dragon',
    description: 'Once a dust-spreading menace, now a helpful companion who uses their fire breath to sanitize surfaces.',
    avatar: '/assets/characters/dusty-dragon.png',
    personality: 'Mischievous but well-meaning, prone to sneezing.',
    unlockCondition: 'Complete Chapter 1',
    isDefault: false,
    sortOrder: 2,
  },
  {
    id: 'professor-tidy',
    name: 'Professor Tidy',
    title: 'The Organizational Genius',
    description: 'A brilliant scientist who invented the "Everything In Its Place" theorem.',
    avatar: '/assets/characters/professor-tidy.png',
    personality: 'Intelligent, precise, loves explaining the science of cleaning.',
    unlockCondition: 'Complete Chapter 2',
    isDefault: false,
    sortOrder: 3,
  },
  {
    id: 'sparkle-sprite',
    name: 'Sparkle',
    title: 'The Cleaning Sprite',
    description: 'A magical sprite who leaves a trail of sparkles wherever they clean.',
    avatar: '/assets/characters/sparkle-sprite.png',
    personality: 'Cheerful, energetic, speaks in rhymes.',
    unlockCondition: null,
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'grumble-grime',
    name: 'Grumble Grime',
    title: 'The Messy Monster',
    description: 'The main antagonist who spreads mess wherever he goes. Can he be reformed?',
    avatar: '/assets/characters/grumble-grime.png',
    personality: 'Grumpy, loves chaos, secretly lonely.',
    unlockCondition: 'Complete Chapter 5',
    isDefault: false,
    sortOrder: 5,
  },
  {
    id: 'chef-spotless',
    name: 'Chef Spotless',
    title: 'The Kitchen Guardian',
    description: 'A master chef who believes a clean kitchen is the key to great cooking.',
    avatar: '/assets/characters/chef-spotless.png',
    personality: 'Passionate about food and cleanliness equally.',
    unlockCondition: 'Complete Kitchen Quest',
    isDefault: false,
    sortOrder: 6,
  },
  {
    id: 'garden-keeper',
    name: 'Keeper Bloom',
    title: 'The Garden Protector',
    description: 'Guardian of outdoor spaces who nurtures both plants and clean yards.',
    avatar: '/assets/characters/garden-keeper.png',
    personality: 'Patient, wise, speaks slowly and thoughtfully.',
    unlockCondition: 'Complete Outdoor Chapter',
    isDefault: false,
    sortOrder: 7,
  },
];

// Story Chapters
const chapters = [
  {
    id: 'chapter-1-awakening',
    number: 1,
    title: 'The Awakening',
    description: 'Begin your journey as a Chore Champion! Learn the basics of keeping your space clean and meet Captain Clean.',
    artwork: '/assets/chapters/chapter-1.png',
    theme: 'bedroom',
    difficulty: 'easy',
    requiredLevel: 1,
    prerequisiteChapterId: null,
    rewards: {
      xp: 100,
      points: 50,
      cardPackId: 'basic-pack',
      exclusiveCardId: null,
      characterUnlock: 'dusty-the-dragon',
      badgeId: 'story-chapter-1',
      title: 'Apprentice Champion',
    },
    estimatedDuration: 20,
    isActive: true,
  },
  {
    id: 'chapter-2-kitchen-quest',
    number: 2,
    title: 'The Kitchen Quest',
    description: 'Venture into the kitchen realm where dishes pile high and crumbs lurk in every corner.',
    artwork: '/assets/chapters/chapter-2.png',
    theme: 'kitchen',
    difficulty: 'easy',
    requiredLevel: 2,
    prerequisiteChapterId: 'chapter-1-awakening',
    rewards: {
      xp: 150,
      points: 75,
      cardPackId: 'basic-pack',
      exclusiveCardId: 'chef-hero-card',
      characterUnlock: 'chef-spotless',
      badgeId: 'story-chapter-2',
      title: 'Kitchen Knight',
    },
    estimatedDuration: 25,
    isActive: true,
  },
  {
    id: 'chapter-3-bathroom-battles',
    number: 3,
    title: 'Bathroom Battles',
    description: 'Face the challenges of the bathroom where soap scum and toothpaste splatters reign.',
    artwork: '/assets/chapters/chapter-3.png',
    theme: 'bathroom',
    difficulty: 'medium',
    requiredLevel: 3,
    prerequisiteChapterId: 'chapter-2-kitchen-quest',
    rewards: {
      xp: 200,
      points: 100,
      cardPackId: 'premium-pack',
      exclusiveCardId: null,
      characterUnlock: 'professor-tidy',
      badgeId: 'story-chapter-3',
      title: 'Bathroom Guardian',
    },
    estimatedDuration: 30,
    isActive: true,
  },
  {
    id: 'chapter-4-living-room-legends',
    number: 4,
    title: 'Living Room Legends',
    description: 'The heart of the home needs a hero! Tackle clutter and restore order to the living room.',
    artwork: '/assets/chapters/chapter-4.png',
    theme: 'living_room',
    difficulty: 'medium',
    requiredLevel: 4,
    prerequisiteChapterId: 'chapter-3-bathroom-battles',
    rewards: {
      xp: 250,
      points: 125,
      cardPackId: 'premium-pack',
      exclusiveCardId: 'cozy-hero-card',
      characterUnlock: null,
      badgeId: 'story-chapter-4',
      title: 'Living Legend',
    },
    estimatedDuration: 35,
    isActive: true,
  },
  {
    id: 'chapter-5-outdoor-odyssey',
    number: 5,
    title: 'Outdoor Odyssey',
    description: 'Step outside and face the challenges of yard work, garage cleaning, and more!',
    artwork: '/assets/chapters/chapter-5.png',
    theme: 'outdoor',
    difficulty: 'hard',
    requiredLevel: 5,
    prerequisiteChapterId: 'chapter-4-living-room-legends',
    rewards: {
      xp: 300,
      points: 150,
      cardPackId: 'legendary-pack',
      exclusiveCardId: 'nature-hero-card',
      characterUnlock: 'garden-keeper',
      badgeId: 'story-chapter-5',
      title: 'Outdoor Champion',
    },
    estimatedDuration: 40,
    isActive: true,
  },
  {
    id: 'chapter-6-final-showdown',
    number: 6,
    title: 'The Final Showdown',
    description: 'Confront Grumble Grime in an epic battle to save the entire household from eternal mess!',
    artwork: '/assets/chapters/chapter-6.png',
    theme: 'whole_house',
    difficulty: 'hard',
    requiredLevel: 7,
    prerequisiteChapterId: 'chapter-5-outdoor-odyssey',
    rewards: {
      xp: 500,
      points: 250,
      cardPackId: 'legendary-pack',
      exclusiveCardId: 'grumble-reformed-card',
      characterUnlock: 'grumble-grime',
      badgeId: 'story-master',
      title: 'Master Champion',
    },
    estimatedDuration: 45,
    isActive: true,
  },
];

// Chapter character appearances
const chapterCharacterLinks = [
  // Chapter 1
  { chapterId: 'chapter-1-awakening', characterId: 'captain-clean', role: 'main', sortOrder: 1 },
  { chapterId: 'chapter-1-awakening', characterId: 'sparkle-sprite', role: 'supporting', sortOrder: 2 },
  // Chapter 2
  { chapterId: 'chapter-2-kitchen-quest', characterId: 'captain-clean', role: 'supporting', sortOrder: 1 },
  { chapterId: 'chapter-2-kitchen-quest', characterId: 'chef-spotless', role: 'main', sortOrder: 2 },
  { chapterId: 'chapter-2-kitchen-quest', characterId: 'dusty-the-dragon', role: 'cameo', sortOrder: 3 },
  // Chapter 3
  { chapterId: 'chapter-3-bathroom-battles', characterId: 'captain-clean', role: 'supporting', sortOrder: 1 },
  { chapterId: 'chapter-3-bathroom-battles', characterId: 'professor-tidy', role: 'main', sortOrder: 2 },
  { chapterId: 'chapter-3-bathroom-battles', characterId: 'sparkle-sprite', role: 'supporting', sortOrder: 3 },
  // Chapter 4
  { chapterId: 'chapter-4-living-room-legends', characterId: 'captain-clean', role: 'main', sortOrder: 1 },
  { chapterId: 'chapter-4-living-room-legends', characterId: 'dusty-the-dragon', role: 'supporting', sortOrder: 2 },
  { chapterId: 'chapter-4-living-room-legends', characterId: 'professor-tidy', role: 'cameo', sortOrder: 3 },
  // Chapter 5
  { chapterId: 'chapter-5-outdoor-odyssey', characterId: 'garden-keeper', role: 'main', sortOrder: 1 },
  { chapterId: 'chapter-5-outdoor-odyssey', characterId: 'captain-clean', role: 'supporting', sortOrder: 2 },
  { chapterId: 'chapter-5-outdoor-odyssey', characterId: 'sparkle-sprite', role: 'cameo', sortOrder: 3 },
  // Chapter 6
  { chapterId: 'chapter-6-final-showdown', characterId: 'grumble-grime', role: 'main', sortOrder: 1 },
  { chapterId: 'chapter-6-final-showdown', characterId: 'captain-clean', role: 'main', sortOrder: 2 },
  { chapterId: 'chapter-6-final-showdown', characterId: 'dusty-the-dragon', role: 'supporting', sortOrder: 3 },
  { chapterId: 'chapter-6-final-showdown', characterId: 'professor-tidy', role: 'supporting', sortOrder: 4 },
  { chapterId: 'chapter-6-final-showdown', characterId: 'sparkle-sprite', role: 'supporting', sortOrder: 5 },
  { chapterId: 'chapter-6-final-showdown', characterId: 'chef-spotless', role: 'supporting', sortOrder: 6 },
  { chapterId: 'chapter-6-final-showdown', characterId: 'garden-keeper', role: 'supporting', sortOrder: 7 },
];

// Chapter 1 Quests
const chapter1Quests = [
  {
    id: 'quest-1-1-first-steps',
    chapterId: 'chapter-1-awakening',
    orderInChapter: 1,
    title: 'First Steps',
    description: 'Learn the basics of being a Chore Champion.',
    briefing: 'Welcome, young champion! Today marks the beginning of your journey. Captain Clean is here to guide you through your first mission.',
    debriefing: 'Excellent work! You have taken your first steps on the path of the Chore Champion. The journey continues...',
    objectives: [
      { id: 'obj-1-1-1', type: 'complete_chore', description: 'Make your bed', target: 'make-bed', current: 0, required: 1, isCompleted: false },
    ],
    rewards: { xp: 20, points: 10, cardPackId: null, specificCardId: null, badgeId: null, petItem: null, customReward: null },
    timeLimit: null,
    isOptional: false,
    isBonusQuest: false,
    isActive: true,
  },
  {
    id: 'quest-1-2-room-rescue',
    chapterId: 'chapter-1-awakening',
    orderInChapter: 2,
    title: 'Room Rescue',
    description: 'Help rescue your room from the clutches of chaos!',
    briefing: 'Your room is calling for help! Items are scattered everywhere. Can you restore order?',
    debriefing: 'Amazing! Your room is looking fantastic. Sparkle is impressed by your dedication!',
    objectives: [
      { id: 'obj-1-2-1', type: 'complete_chore', description: 'Pick up toys/items', target: 'pick-up-toys', current: 0, required: 1, isCompleted: false },
      { id: 'obj-1-2-2', type: 'complete_chore', description: 'Organize your desk', target: 'organize-desk', current: 0, required: 1, isCompleted: false },
    ],
    rewards: { xp: 30, points: 15, cardPackId: null, specificCardId: null, badgeId: null, petItem: 'toy-ball', customReward: null },
    timeLimit: null,
    isOptional: false,
    isBonusQuest: false,
    isActive: true,
  },
  {
    id: 'quest-1-3-dust-defense',
    chapterId: 'chapter-1-awakening',
    orderInChapter: 3,
    title: 'Dust Defense',
    description: 'Battle the dust bunnies that have invaded your space!',
    briefing: 'Captain Clean has spotted dust bunnies gathering in your room. It is time to defend your territory!',
    debriefing: 'Victory! The dust bunnies have been vanquished. You have earned your first title: Apprentice Champion!',
    objectives: [
      { id: 'obj-1-3-1', type: 'complete_chore', description: 'Dust surfaces', target: 'dust-surfaces', current: 0, required: 1, isCompleted: false },
      { id: 'obj-1-3-2', type: 'complete_chore', description: 'Vacuum or sweep floor', target: 'vacuum-floor', current: 0, required: 1, isCompleted: false },
    ],
    rewards: { xp: 50, points: 25, cardPackId: 'basic-pack', specificCardId: null, badgeId: 'dust-defender', petItem: null, customReward: null },
    timeLimit: null,
    isOptional: false,
    isBonusQuest: false,
    isActive: true,
  },
];

// Chapter 2 Quests
const chapter2Quests = [
  {
    id: 'quest-2-1-dish-duty',
    chapterId: 'chapter-2-kitchen-quest',
    orderInChapter: 1,
    title: 'Dish Duty',
    description: 'Face the mountain of dishes that threatens the kitchen peace.',
    briefing: 'Chef Spotless needs your help! The dishes have piled up and are blocking access to the stove. Time to restore order!',
    debriefing: 'The kitchen shines once more! Chef Spotless is grateful for your assistance.',
    objectives: [
      { id: 'obj-2-1-1', type: 'complete_chore', description: 'Wash the dishes', target: 'wash-dishes', current: 0, required: 1, isCompleted: false },
      { id: 'obj-2-1-2', type: 'complete_chore', description: 'Dry and put away dishes', target: 'dry-dishes', current: 0, required: 1, isCompleted: false },
    ],
    rewards: { xp: 35, points: 20, cardPackId: null, specificCardId: null, badgeId: null, petItem: null, customReward: null },
    timeLimit: null,
    isOptional: false,
    isBonusQuest: false,
    isActive: true,
  },
  {
    id: 'quest-2-2-counter-strike',
    chapterId: 'chapter-2-kitchen-quest',
    orderInChapter: 2,
    title: 'Counter Strike',
    description: 'Wipe out the crumb invasion on the kitchen counters.',
    briefing: 'Crumbs have formed an alliance on the countertops! Only a true champion can wipe them out.',
    debriefing: 'The counters sparkle like never before! Your cleaning skills are improving rapidly.',
    objectives: [
      { id: 'obj-2-2-1', type: 'complete_chore', description: 'Wipe down counters', target: 'wipe-counters', current: 0, required: 1, isCompleted: false },
      { id: 'obj-2-2-2', type: 'complete_chore', description: 'Clean the sink', target: 'clean-sink', current: 0, required: 1, isCompleted: false },
    ],
    rewards: { xp: 40, points: 20, cardPackId: null, specificCardId: null, badgeId: null, petItem: 'chef-hat', customReward: null },
    timeLimit: null,
    isOptional: false,
    isBonusQuest: false,
    isActive: true,
  },
  {
    id: 'quest-2-3-floor-finale',
    chapterId: 'chapter-2-kitchen-quest',
    orderInChapter: 3,
    title: 'Floor Finale',
    description: 'Complete the kitchen transformation with a spotless floor.',
    briefing: 'The final challenge awaits! The kitchen floor holds the last remnants of mess. Show no mercy!',
    debriefing: 'INCREDIBLE! You have mastered the kitchen! Chef Spotless awards you the title of Kitchen Knight!',
    objectives: [
      { id: 'obj-2-3-1', type: 'complete_chore', description: 'Sweep the floor', target: 'sweep-kitchen', current: 0, required: 1, isCompleted: false },
      { id: 'obj-2-3-2', type: 'complete_chore', description: 'Mop the floor', target: 'mop-kitchen', current: 0, required: 1, isCompleted: false },
      { id: 'obj-2-3-3', type: 'complete_chore', description: 'Take out the trash', target: 'take-out-trash', current: 0, required: 1, isCompleted: false },
    ],
    rewards: { xp: 75, points: 40, cardPackId: 'basic-pack', specificCardId: 'chef-hero-card', badgeId: 'kitchen-knight', petItem: null, customReward: null },
    timeLimit: null,
    isOptional: false,
    isBonusQuest: false,
    isActive: true,
  },
];

// Sample dialogues for Chapter 1 Quest 1
const chapter1Quest1Dialogues = [
  {
    id: 'dialogue-1-1-intro',
    questId: 'quest-1-1-first-steps',
    orderInQuest: 1,
    triggerType: 'quest_start',
    triggerId: null,
    lines: [
      {
        id: 'line-1-1-1',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'Greetings, young one! I am Captain Clean, protector of homes everywhere.',
        emotion: 'happy',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-1-2',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'I sense great potential in you. Are you ready to begin your training as a Chore Champion?',
        emotion: 'excited',
        animation: 'none',
        choices: [
          { id: 'choice-1-1-1', text: 'Yes! I am ready!', nextDialogueId: null, effect: { type: 'add_points', target: 'points', value: 5 }, isCorrect: true },
          { id: 'choice-1-1-2', text: 'I will try my best.', nextDialogueId: null, effect: null, isCorrect: null },
        ],
        delay: 0,
      },
      {
        id: 'line-1-1-3',
        characterId: 'sparkle-sprite',
        characterName: 'Sparkle',
        characterAvatar: '/assets/characters/sparkle-sprite.png',
        text: 'Oh how exciting, a new friend to meet! Together we will make your room complete!',
        emotion: 'excited',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-1-4',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'Your first mission: Make your bed! A tidy bed is the foundation of a tidy room.',
        emotion: 'neutral',
        animation: 'none',
        choices: null,
        delay: 0,
      },
    ],
  },
  {
    id: 'dialogue-1-1-complete',
    questId: 'quest-1-1-first-steps',
    orderInQuest: 2,
    triggerType: 'quest_end',
    triggerId: null,
    lines: [
      {
        id: 'line-1-1-5',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'Outstanding work! You have completed your first mission!',
        emotion: 'happy',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-1-6',
        characterId: 'sparkle-sprite',
        characterName: 'Sparkle',
        characterAvatar: '/assets/characters/sparkle-sprite.png',
        text: 'Your bed looks so neat, what a wonderful treat!',
        emotion: 'excited',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-1-7',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'There is more work to be done. When you are ready, proceed to your next mission!',
        emotion: 'neutral',
        animation: 'none',
        choices: null,
        delay: 0,
      },
    ],
  },
];

// Sample dialogues for Chapter 1 Quest 3 (final)
const chapter1Quest3Dialogues = [
  {
    id: 'dialogue-1-3-intro',
    questId: 'quest-1-3-dust-defense',
    orderInQuest: 1,
    triggerType: 'quest_start',
    triggerId: null,
    lines: [
      {
        id: 'line-1-3-1',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'Champion! I have troubling news. Dust bunnies have been spotted gathering in your room!',
        emotion: 'worried',
        animation: 'shake',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-2',
        characterId: 'sparkle-sprite',
        characterName: 'Sparkle',
        characterAvatar: '/assets/characters/sparkle-sprite.png',
        text: 'Oh no, oh my, dust bunnies are shy, but leave them alone and they will multiply!',
        emotion: 'worried',
        animation: 'shake',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-3',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'We must act quickly! Grab your duster and vacuum. It is time for... DUST DEFENSE!',
        emotion: 'excited',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
    ],
  },
  {
    id: 'dialogue-1-3-complete',
    questId: 'quest-1-3-dust-defense',
    orderInQuest: 2,
    triggerType: 'quest_end',
    triggerId: null,
    lines: [
      {
        id: 'line-1-3-4',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'VICTORY! The dust bunnies have been vanquished! Your room is sparkling clean!',
        emotion: 'happy',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-5',
        characterId: 'sparkle-sprite',
        characterName: 'Sparkle',
        characterAvatar: '/assets/characters/sparkle-sprite.png',
        text: 'Hip hip hooray, the dust ran away! You saved the day in every way!',
        emotion: 'excited',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-6',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'You have proven yourself worthy. I hereby bestow upon you the title of Apprentice Champion!',
        emotion: 'happy',
        animation: 'none',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-7',
        characterId: 'dusty-the-dragon',
        characterName: '???',
        characterAvatar: '/assets/characters/dusty-dragon.png',
        text: '*ACHOO!* Oh... excuse me. I heard you defeated the dust bunnies? I... I need help too...',
        emotion: 'sad',
        animation: 'fade',
        choices: [
          { id: 'choice-1-3-1', text: 'Who are you?', nextDialogueId: 'dialogue-1-3-reveal', effect: null, isCorrect: null },
          { id: 'choice-1-3-2', text: 'Of course I will help!', nextDialogueId: 'dialogue-1-3-reveal', effect: { type: 'add_points', target: 'points', value: 10 }, isCorrect: true },
        ],
        delay: 0,
      },
    ],
  },
  {
    id: 'dialogue-1-3-reveal',
    questId: 'quest-1-3-dust-defense',
    orderInQuest: 3,
    triggerType: 'manual',
    triggerId: null,
    lines: [
      {
        id: 'line-1-3-8',
        characterId: 'dusty-the-dragon',
        characterName: 'Dusty',
        characterAvatar: '/assets/characters/dusty-dragon.png',
        text: 'My name is Dusty. I am a dragon, but... *sniff* I am allergic to dust. It is quite ironic.',
        emotion: 'sad',
        animation: 'none',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-9',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'Dusty! You have finally come forward. Champion, Dusty used to spread dust everywhere, but now seeks redemption.',
        emotion: 'neutral',
        animation: 'none',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-10',
        characterId: 'dusty-the-dragon',
        characterName: 'Dusty',
        characterAvatar: '/assets/characters/dusty-dragon.png',
        text: 'I want to help keep things clean now! My fire breath is great for sanitizing. Can I join your team?',
        emotion: 'excited',
        animation: 'bounce',
        choices: null,
        delay: 0,
      },
      {
        id: 'line-1-3-11',
        characterId: 'captain-clean',
        characterName: 'Captain Clean',
        characterAvatar: '/assets/characters/captain-clean.png',
        text: 'Dusty has joined your team! This concludes Chapter 1. Rest well, for the Kitchen Quest awaits...',
        emotion: 'happy',
        animation: 'none',
        choices: null,
        delay: 0,
      },
    ],
  },
];

// Combine all quests
const allQuests = [
  ...chapter1Quests,
  ...chapter2Quests,
];

// Combine all dialogues
const allDialogues = [
  ...chapter1Quest1Dialogues,
  ...chapter1Quest3Dialogues,
];

export async function seedStoryMode() {
  console.log('Seeding story mode data...');

  // Insert characters
  await db.insert(storyCharacters).values(characters).onConflictDoNothing();
  console.log(`Inserted ${characters.length} characters`);

  // Insert chapters
  await db.insert(storyChapters).values(chapters).onConflictDoNothing();
  console.log(`Inserted ${chapters.length} chapters`);

  // Insert chapter-character relationships
  await db.insert(chapterCharacters).values(chapterCharacterLinks).onConflictDoNothing();
  console.log(`Inserted ${chapterCharacterLinks.length} chapter-character links`);

  // Insert quests
  await db.insert(storyQuests).values(allQuests).onConflictDoNothing();
  console.log(`Inserted ${allQuests.length} quests`);

  // Insert dialogues
  await db.insert(storyDialogues).values(allDialogues).onConflictDoNothing();
  console.log(`Inserted ${allDialogues.length} dialogues`);

  console.log('Story mode seed complete!');
}
