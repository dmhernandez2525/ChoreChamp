// Pet species definitions for the virtual pet system
// Reference: F9.2 Virtual Pet System

export const petSpeciesData = [
  {
    id: 'dog',
    name: 'Loyal Pup',
    description: 'A friendly and loyal companion who loves to help with chores. Dogs provide bonus points for teamwork-related tasks.',
    icon: '🐕',
    baseStats: {
      maxHealth: 100,
      maxHappiness: 100,
      maxEnergy: 120,
      healthDecayRate: 5,
      happinessDecayRate: 8,
      energyRegenRate: 10,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Puppy', icon: '🐶', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['loyal-friend'] },
      { tier: 'juvenile', name: 'Young Dog', icon: '🐕', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['fetch-bonus'] },
      { tier: 'adult', name: 'Good Boy', icon: '🦮', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['team-howl'] },
      { tier: 'legendary', name: 'Champion Dog', icon: '🏆🐕', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['pack-leader'] },
    ],
    specialAbility: 'Teamwork Boost - Increases family collaboration bonuses',
    sortOrder: 1,
  },
  {
    id: 'cat',
    name: 'Clever Cat',
    description: 'An independent and clever companion who appreciates quality work. Cats provide bonuses for organization tasks.',
    icon: '🐱',
    baseStats: {
      maxHealth: 90,
      maxHappiness: 80,
      maxEnergy: 100,
      healthDecayRate: 4,
      happinessDecayRate: 10,
      energyRegenRate: 15,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Kitten', icon: '🐱', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['curious-nature'] },
      { tier: 'juvenile', name: 'Young Cat', icon: '🐈', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['night-owl'] },
      { tier: 'adult', name: 'Wise Cat', icon: '🐈‍⬛', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['purr-of-luck'] },
      { tier: 'legendary', name: 'Mystic Cat', icon: '✨🐱', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['nine-lives'] },
    ],
    specialAbility: 'Organization Boost - Increases quality bonuses',
    sortOrder: 2,
  },
  {
    id: 'dragon',
    name: 'Mighty Dragon',
    description: 'A powerful dragon who rewards consistent effort. Dragons provide streak protection and consistency bonuses.',
    icon: '🐉',
    baseStats: {
      maxHealth: 150,
      maxHappiness: 70,
      maxEnergy: 80,
      healthDecayRate: 3,
      happinessDecayRate: 12,
      energyRegenRate: 8,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Hatchling', icon: '🥚', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['fire-spirit'] },
      { tier: 'juvenile', name: 'Drake', icon: '🦎', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['flame-shield'] },
      { tier: 'adult', name: 'Dragon', icon: '🐲', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['dragon-roar'] },
      { tier: 'legendary', name: 'Elder Dragon', icon: '🐉👑', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['eternal-flame'] },
    ],
    specialAbility: 'Streak Guardian - Provides extra streak protection',
    sortOrder: 3,
  },
  {
    id: 'robot',
    name: 'Helper Bot',
    description: 'An efficient robot companion who optimizes your chore completion. Robots provide speed and efficiency bonuses.',
    icon: '🤖',
    baseStats: {
      maxHealth: 120,
      maxHappiness: 60,
      maxEnergy: 150,
      healthDecayRate: 2,
      happinessDecayRate: 5,
      energyRegenRate: 20,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Mini Bot', icon: '🔧', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['quick-scan'] },
      { tier: 'juvenile', name: 'Helper Bot', icon: '🤖', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['efficiency-mode'] },
      { tier: 'adult', name: 'Mega Bot', icon: '🦾', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['turbo-boost'] },
      { tier: 'legendary', name: 'Supreme Bot', icon: '🤖✨', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['overdrive'] },
    ],
    specialAbility: 'Speed Boost - Increases XP for fast completions',
    sortOrder: 4,
  },
  {
    id: 'bunny',
    name: 'Happy Bunny',
    description: 'An energetic bunny who brings joy to chores. Bunnies provide happiness boosts and point multipliers.',
    icon: '🐰',
    baseStats: {
      maxHealth: 80,
      maxHappiness: 120,
      maxEnergy: 110,
      healthDecayRate: 6,
      happinessDecayRate: 6,
      energyRegenRate: 12,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Baby Bunny', icon: '🐰', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['hop-joy'] },
      { tier: 'juvenile', name: 'Bunny', icon: '🐇', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['lucky-foot'] },
      { tier: 'adult', name: 'Swift Hare', icon: '🐇💨', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['carrot-power'] },
      { tier: 'legendary', name: 'Moon Rabbit', icon: '🌙🐰', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['lunar-blessing'] },
    ],
    specialAbility: 'Joy Multiplier - Increases celebration rewards',
    sortOrder: 5,
  },
  {
    id: 'bird',
    name: 'Cheerful Bird',
    description: 'A cheerful bird who reminds you of your chores. Birds provide timely reminders and early completion bonuses.',
    icon: '🐦',
    baseStats: {
      maxHealth: 70,
      maxHappiness: 100,
      maxEnergy: 90,
      healthDecayRate: 7,
      happinessDecayRate: 7,
      energyRegenRate: 14,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Chick', icon: '🐤', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['morning-song'] },
      { tier: 'juvenile', name: 'Songbird', icon: '🐦', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['alert-chirp'] },
      { tier: 'adult', name: 'Wise Owl', icon: '🦉', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['night-vision'] },
      { tier: 'legendary', name: 'Phoenix', icon: '🔥🐦', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['rebirth'] },
    ],
    specialAbility: 'Early Bird - Bonus XP for morning completions',
    sortOrder: 6,
  },
  {
    id: 'unicorn',
    name: 'Magical Unicorn',
    description: 'A magical unicorn that brings wonder to everyday tasks. Unicorns provide random bonus rewards.',
    icon: '🦄',
    baseStats: {
      maxHealth: 100,
      maxHappiness: 110,
      maxEnergy: 100,
      healthDecayRate: 5,
      happinessDecayRate: 8,
      energyRegenRate: 10,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Sparkle Foal', icon: '✨🐴', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['sparkle-dust'] },
      { tier: 'juvenile', name: 'Young Unicorn', icon: '🦄', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['rainbow-trail'] },
      { tier: 'adult', name: 'Unicorn', icon: '🦄✨', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['magic-horn'] },
      { tier: 'legendary', name: 'Celestial Unicorn', icon: '🌈🦄', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['wish-granter'] },
    ],
    specialAbility: 'Lucky Star - Chance for bonus rewards',
    sortOrder: 7,
  },
  {
    id: 'slime',
    name: 'Friendly Slime',
    description: 'A bouncy slime that adapts to any situation. Slimes are easy to care for and provide steady bonuses.',
    icon: '🟢',
    baseStats: {
      maxHealth: 100,
      maxHappiness: 100,
      maxEnergy: 100,
      healthDecayRate: 3,
      happinessDecayRate: 5,
      energyRegenRate: 12,
    },
    evolutionPath: [
      { tier: 'baby', name: 'Baby Slime', icon: '💧', requiredLevel: 1, statsMultiplier: 1.0, unlockedAbilities: ['absorb'] },
      { tier: 'juvenile', name: 'Slime', icon: '🟢', requiredLevel: 10, statsMultiplier: 1.25, unlockedAbilities: ['bounce'] },
      { tier: 'adult', name: 'King Slime', icon: '👑🟢', requiredLevel: 25, statsMultiplier: 1.5, unlockedAbilities: ['split'] },
      { tier: 'legendary', name: 'Rainbow Slime', icon: '🌈🟢', requiredLevel: 50, statsMultiplier: 2.0, unlockedAbilities: ['mega-bounce'] },
    ],
    specialAbility: 'Adaptable - Reduced stat decay',
    sortOrder: 8,
  },
];

export const petAbilitiesData = [
  // Dog abilities
  { id: 'loyal-friend', speciesId: 'dog', name: 'Loyal Friend', description: 'Earn 5% more points when completing chores with family', icon: '❤️', abilityType: 'team_buff', value: 5, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'fetch-bonus', speciesId: 'dog', name: 'Fetch Bonus', description: 'Once per day, earn double points on one chore', icon: '🎾', abilityType: 'point_boost', value: 100, cooldownHours: 24, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'team-howl', speciesId: 'dog', name: 'Team Howl', description: 'Family members earn 10% bonus XP for 2 hours', icon: '🐺', abilityType: 'team_buff', value: 10, cooldownHours: 12, unlockTier: 'adult', sortOrder: 3 },
  { id: 'pack-leader', speciesId: 'dog', name: 'Pack Leader', description: 'All family bonuses doubled for 4 hours', icon: '👑', abilityType: 'team_buff', value: 100, cooldownHours: 24, unlockTier: 'legendary', sortOrder: 4 },

  // Cat abilities
  { id: 'curious-nature', speciesId: 'cat', name: 'Curious Nature', description: 'Earn 5% more XP from all chores', icon: '🔍', abilityType: 'xp_boost', value: 5, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'night-owl', speciesId: 'cat', name: 'Night Owl', description: 'Double XP for chores completed after 8pm', icon: '🌙', abilityType: 'xp_boost', value: 100, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'purr-of-luck', speciesId: 'cat', name: 'Purr of Luck', description: '15% chance for double rewards', icon: '🍀', abilityType: 'lucky_bonus', value: 15, cooldownHours: 0, unlockTier: 'adult', sortOrder: 3 },
  { id: 'nine-lives', speciesId: 'cat', name: 'Nine Lives', description: 'Protect your streak for free once per week', icon: '✨', abilityType: 'streak_protection', value: 1, cooldownHours: 168, unlockTier: 'legendary', sortOrder: 4 },

  // Dragon abilities
  { id: 'fire-spirit', speciesId: 'dragon', name: 'Fire Spirit', description: 'Streak milestones give 10% bonus', icon: '🔥', abilityType: 'point_boost', value: 10, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'flame-shield', speciesId: 'dragon', name: 'Flame Shield', description: 'Reduce streak freeze cost by 50%', icon: '🛡️', abilityType: 'streak_protection', value: 50, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'dragon-roar', speciesId: 'dragon', name: 'Dragon Roar', description: 'Double streak bonus for next completion', icon: '🗣️', abilityType: 'point_boost', value: 100, cooldownHours: 12, unlockTier: 'adult', sortOrder: 3 },
  { id: 'eternal-flame', speciesId: 'dragon', name: 'Eternal Flame', description: 'Streak cannot be broken for 24 hours', icon: '🔥👑', abilityType: 'streak_protection', value: 100, cooldownHours: 72, unlockTier: 'legendary', sortOrder: 4 },

  // Robot abilities
  { id: 'quick-scan', speciesId: 'robot', name: 'Quick Scan', description: '5% more XP for early completions', icon: '📡', abilityType: 'xp_boost', value: 5, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'efficiency-mode', speciesId: 'robot', name: 'Efficiency Mode', description: '10% bonus XP for completing chores under estimated time', icon: '⚡', abilityType: 'xp_boost', value: 10, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'turbo-boost', speciesId: 'robot', name: 'Turbo Boost', description: 'Triple XP for next 3 chores', icon: '🚀', abilityType: 'xp_boost', value: 200, cooldownHours: 24, unlockTier: 'adult', sortOrder: 3 },
  { id: 'overdrive', speciesId: 'robot', name: 'Overdrive', description: 'All speed bonuses doubled for 6 hours', icon: '💫', abilityType: 'xp_boost', value: 100, cooldownHours: 48, unlockTier: 'legendary', sortOrder: 4 },

  // Bunny abilities
  { id: 'hop-joy', speciesId: 'bunny', name: 'Hop of Joy', description: 'Celebrations give 5% bonus points', icon: '🎉', abilityType: 'point_boost', value: 5, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'lucky-foot', speciesId: 'bunny', name: 'Lucky Foot', description: '10% chance for bonus rewards', icon: '🍀', abilityType: 'lucky_bonus', value: 10, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'carrot-power', speciesId: 'bunny', name: 'Carrot Power', description: 'Next chore gives 50% bonus points', icon: '🥕', abilityType: 'point_boost', value: 50, cooldownHours: 8, unlockTier: 'adult', sortOrder: 3 },
  { id: 'lunar-blessing', speciesId: 'bunny', name: 'Lunar Blessing', description: '25% chance for double rewards all day', icon: '🌙', abilityType: 'lucky_bonus', value: 25, cooldownHours: 24, unlockTier: 'legendary', sortOrder: 4 },

  // Bird abilities
  { id: 'morning-song', speciesId: 'bird', name: 'Morning Song', description: '10% bonus XP before 9am', icon: '🌅', abilityType: 'xp_boost', value: 10, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'alert-chirp', speciesId: 'bird', name: 'Alert Chirp', description: 'Reminder notifications are more effective', icon: '🔔', abilityType: 'motivation_reminder', value: 20, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'night-vision', speciesId: 'bird', name: 'Night Vision', description: 'Early AND late completion bonuses', icon: '👁️', abilityType: 'xp_boost', value: 15, cooldownHours: 0, unlockTier: 'adult', sortOrder: 3 },
  { id: 'rebirth', speciesId: 'bird', name: 'Rebirth', description: 'Restore lost streak up to 3 days', icon: '🔥🐦', abilityType: 'streak_protection', value: 3, cooldownHours: 168, unlockTier: 'legendary', sortOrder: 4 },

  // Unicorn abilities
  { id: 'sparkle-dust', speciesId: 'unicorn', name: 'Sparkle Dust', description: '5% chance for bonus rewards', icon: '✨', abilityType: 'lucky_bonus', value: 5, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'rainbow-trail', speciesId: 'unicorn', name: 'Rainbow Trail', description: '10% chance for extra points', icon: '🌈', abilityType: 'lucky_bonus', value: 10, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'magic-horn', speciesId: 'unicorn', name: 'Magic Horn', description: 'Guaranteed bonus on next chore', icon: '🦄', abilityType: 'point_boost', value: 25, cooldownHours: 12, unlockTier: 'adult', sortOrder: 3 },
  { id: 'wish-granter', speciesId: 'unicorn', name: 'Wish Granter', description: 'Triple random reward once per day', icon: '⭐', abilityType: 'lucky_bonus', value: 200, cooldownHours: 24, unlockTier: 'legendary', sortOrder: 4 },

  // Slime abilities
  { id: 'absorb', speciesId: 'slime', name: 'Absorb', description: 'Reduced happiness decay', icon: '💧', abilityType: 'point_boost', value: 5, cooldownHours: 0, unlockTier: 'baby', sortOrder: 1 },
  { id: 'bounce', speciesId: 'slime', name: 'Bounce', description: '5% bonus XP always', icon: '🟢', abilityType: 'xp_boost', value: 5, cooldownHours: 0, unlockTier: 'juvenile', sortOrder: 2 },
  { id: 'split', speciesId: 'slime', name: 'Split', description: 'Double points from next chore', icon: '🟢🟢', abilityType: 'point_boost', value: 100, cooldownHours: 24, unlockTier: 'adult', sortOrder: 3 },
  { id: 'mega-bounce', speciesId: 'slime', name: 'Mega Bounce', description: 'All bonuses 20% more effective', icon: '🌈🟢', abilityType: 'point_boost', value: 20, cooldownHours: 0, unlockTier: 'legendary', sortOrder: 4 },
];

export const petAccessoriesData = [
  // Hats - Default
  { id: 'hat-none', name: 'No Hat', description: 'No hat equipped', icon: '❌', category: 'hat', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },
  { id: 'hat-bow', name: 'Cute Bow', description: 'A cute little bow', icon: '🎀', category: 'hat', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 1 },
  { id: 'hat-party', name: 'Party Hat', description: 'Time to celebrate!', icon: '🎉', category: 'hat', rarity: 'common', unlockType: 'level', unlockLevel: 5, isDefault: false, sortOrder: 2 },
  { id: 'hat-wizard', name: 'Wizard Hat', description: 'Magical headwear', icon: '🧙', category: 'hat', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 3 },
  { id: 'hat-crown', name: 'Royal Crown', description: 'For royalty only', icon: '👑', category: 'hat', rarity: 'legendary', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 4 },

  // Collars
  { id: 'collar-none', name: 'No Collar', description: 'No collar equipped', icon: '❌', category: 'collar', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },
  { id: 'collar-red', name: 'Red Collar', description: 'A classic red collar', icon: '🔴', category: 'collar', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 1 },
  { id: 'collar-blue', name: 'Blue Collar', description: 'A cool blue collar', icon: '🔵', category: 'collar', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 2 },
  { id: 'collar-gold', name: 'Gold Collar', description: 'A fancy gold collar', icon: '🥇', category: 'collar', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 3 },
  { id: 'collar-diamond', name: 'Diamond Collar', description: 'Sparkly and precious', icon: '💎', category: 'collar', rarity: 'legendary', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 4 },

  // Outfits
  { id: 'outfit-none', name: 'No Outfit', description: 'Natural look', icon: '❌', category: 'outfit', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },
  { id: 'outfit-sweater', name: 'Cozy Sweater', description: 'Warm and comfy', icon: '🧥', category: 'outfit', rarity: 'common', unlockType: 'level', unlockLevel: 5, isDefault: false, sortOrder: 1 },
  { id: 'outfit-cape', name: 'Super Cape', description: 'Superhero style!', icon: '🦸', category: 'outfit', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 2 },
  { id: 'outfit-armor', name: 'Knight Armor', description: 'Ready for battle', icon: '🛡️', category: 'outfit', rarity: 'rare', unlockType: 'level', unlockLevel: 30, isDefault: false, sortOrder: 3 },
  { id: 'outfit-royal', name: 'Royal Robe', description: 'Fit for a king', icon: '👘', category: 'outfit', rarity: 'epic', unlockType: 'level', unlockLevel: 40, isDefault: false, sortOrder: 4 },

  // Toys
  { id: 'toy-none', name: 'No Toy', description: 'No toy equipped', icon: '❌', category: 'toy', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },
  { id: 'toy-ball', name: 'Bouncy Ball', description: 'Fun to play with', icon: '⚽', category: 'toy', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 1 },
  { id: 'toy-bone', name: 'Chew Bone', description: 'Perfect for dogs', icon: '🦴', category: 'toy', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 2 },
  { id: 'toy-wand', name: 'Magic Wand', description: 'Sparkles included', icon: '🪄', category: 'toy', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 3 },
  { id: 'toy-sword', name: 'Toy Sword', description: 'Brave defender', icon: '⚔️', category: 'toy', rarity: 'rare', unlockType: 'level', unlockLevel: 20, isDefault: false, sortOrder: 4 },

  // Backgrounds
  { id: 'bg-pet-home', name: 'Cozy Home', description: 'A comfortable home', icon: '🏠', category: 'background', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'bg-pet-garden', name: 'Garden', description: 'Fresh and green', icon: '🌳', category: 'background', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 2 },
  { id: 'bg-pet-beach', name: 'Beach', description: 'Sandy paradise', icon: '🏖️', category: 'background', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 3 },
  { id: 'bg-pet-space', name: 'Space', description: 'Among the stars', icon: '🌌', category: 'background', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 4 },
  { id: 'bg-pet-castle', name: 'Castle', description: 'Royal residence', icon: '🏰', category: 'background', rarity: 'epic', unlockType: 'level', unlockLevel: 40, isDefault: false, sortOrder: 5 },
  { id: 'bg-pet-rainbow', name: 'Rainbow Land', description: 'Magical realm', icon: '🌈', category: 'background', rarity: 'legendary', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 6 },

  // Effects
  { id: 'effect-none', name: 'No Effect', description: 'No special effect', icon: '❌', category: 'effect', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },
  { id: 'effect-sparkle', name: 'Sparkles', description: 'Twinkle twinkle', icon: '✨', category: 'effect', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 1 },
  { id: 'effect-hearts', name: 'Hearts', description: 'Spread the love', icon: '💕', category: 'effect', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 2 },
  { id: 'effect-stars', name: 'Stars', description: 'Shining bright', icon: '⭐', category: 'effect', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 3 },
  { id: 'effect-rainbow', name: 'Rainbow Aura', description: 'Colorful magic', icon: '🌈', category: 'effect', rarity: 'epic', unlockType: 'level', unlockLevel: 35, isDefault: false, sortOrder: 4 },
  { id: 'effect-fire', name: 'Fire Aura', description: 'Burning passion', icon: '🔥', category: 'effect', rarity: 'legendary', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 5 },
];

export type PetSpeciesData = (typeof petSpeciesData)[number];
export type PetAbilityData = (typeof petAbilitiesData)[number];
export type PetAccessoryData = (typeof petAccessoriesData)[number];
