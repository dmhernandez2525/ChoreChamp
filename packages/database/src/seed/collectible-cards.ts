// Collectible Card System Seed Data (F9.4)

import { db } from '../index';
import { cardSets, cards, cardPacks, cardRewards } from '../schema/collectible-cards';

// Card Sets
const cardSetsData = [
  {
    id: 'chore-champions',
    name: 'Chore Champions',
    description: 'Meet the heroes who make chores fun!',
    theme: 'heroes',
    totalCards: 15,
    releaseDate: new Date('2024-01-01'),
    endDate: null,
    bonusEffect: {
      type: 'xp_multiplier',
      value: 1.1,
      description: '10% XP boost when set is complete',
    },
    isActive: true,
  },
  {
    id: 'cleaning-tools',
    name: 'Cleaning Arsenal',
    description: 'Powerful tools for every cleaning mission',
    theme: 'tools',
    totalCards: 12,
    releaseDate: new Date('2024-01-01'),
    endDate: null,
    bonusEffect: {
      type: 'point_multiplier',
      value: 1.05,
      description: '5% point boost when set is complete',
    },
    isActive: true,
  },
  {
    id: 'home-locations',
    name: 'Home Sweet Home',
    description: 'Every room has its own personality',
    theme: 'locations',
    totalCards: 10,
    releaseDate: new Date('2024-01-01'),
    endDate: null,
    bonusEffect: null,
    isActive: true,
  },
  {
    id: 'power-boosts',
    name: 'Power-Up Pack',
    description: 'Special abilities to boost your progress',
    theme: 'abilities',
    totalCards: 8,
    releaseDate: new Date('2024-01-01'),
    endDate: null,
    bonusEffect: {
      type: 'special_badge',
      value: 1,
      description: 'Unlock the "Power Master" badge',
    },
    isActive: true,
  },
  {
    id: 'seasonal-spring',
    name: 'Spring Cleaning',
    description: 'Limited edition spring-themed cards',
    theme: 'seasonal',
    totalCards: 6,
    releaseDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-31'),
    bonusEffect: {
      type: 'unlock_reward',
      value: 100,
      description: 'Earn 100 bonus points when set is complete',
    },
    isActive: true,
  },
];

// Cards data
const cardsData = [
  // Chore Champions Set (15 cards)
  { id: 'cc-001', name: 'Captain Clean', description: 'The fearless leader of the Chore Champions', flavorText: 'No mess is too tough!', category: 'chore_heroes', rarity: 'legendary', artwork: '/cards/captain-clean.png', borderColor: '#FFD700', effect: { type: 'xp_boost', value: 20, duration: 24, description: '+20 XP for 24 hours' }, setId: 'chore-champions', setNumber: 1, totalInSet: 15, pointsValue: 100 },
  { id: 'cc-002', name: 'Sweep Ninja', description: 'Silent, swift, and spotless', flavorText: 'Dust never sees them coming', category: 'chore_heroes', rarity: 'epic', artwork: '/cards/sweep-ninja.png', borderColor: '#9B59B6', effect: null, setId: 'chore-champions', setNumber: 2, totalInSet: 15, pointsValue: 50 },
  { id: 'cc-003', name: 'Dish Dragon', description: 'Breathes fire on dirty dishes', flavorText: 'No plate left behind', category: 'chore_heroes', rarity: 'rare', artwork: '/cards/dish-dragon.png', borderColor: '#3498DB', effect: null, setId: 'chore-champions', setNumber: 3, totalInSet: 15, pointsValue: 25 },
  { id: 'cc-004', name: 'Laundry Wizard', description: 'Turns dirty clothes into fresh ones', flavorText: 'Abracadabra, clean!', category: 'chore_heroes', rarity: 'epic', artwork: '/cards/laundry-wizard.png', borderColor: '#9B59B6', effect: { type: 'point_boost', value: 15, duration: 12, description: '+15 points for 12 hours' }, setId: 'chore-champions', setNumber: 4, totalInSet: 15, pointsValue: 50 },
  { id: 'cc-005', name: 'Vacuum Victor', description: 'Sucks up dirt with super strength', flavorText: 'Dust bunnies beware!', category: 'chore_heroes', rarity: 'rare', artwork: '/cards/vacuum-victor.png', borderColor: '#3498DB', effect: null, setId: 'chore-champions', setNumber: 5, totalInSet: 15, pointsValue: 25 },
  { id: 'cc-006', name: 'Tidy Tot', description: 'Young but mighty organizer', flavorText: 'Everything has its place', category: 'chore_heroes', rarity: 'uncommon', artwork: '/cards/tidy-tot.png', borderColor: '#2ECC71', effect: null, setId: 'chore-champions', setNumber: 6, totalInSet: 15, pointsValue: 15 },
  { id: 'cc-007', name: 'Mop Monster', description: 'Makes floors shine like mirrors', flavorText: 'Splish splash, dirt dash!', category: 'chore_heroes', rarity: 'uncommon', artwork: '/cards/mop-monster.png', borderColor: '#2ECC71', effect: null, setId: 'chore-champions', setNumber: 7, totalInSet: 15, pointsValue: 15 },
  { id: 'cc-008', name: 'Bed Making Buddy', description: 'Hospital corners are their specialty', flavorText: 'Tucked in tight!', category: 'chore_heroes', rarity: 'common', artwork: '/cards/bed-buddy.png', borderColor: '#95A5A6', effect: null, setId: 'chore-champions', setNumber: 8, totalInSet: 15, pointsValue: 10 },
  { id: 'cc-009', name: 'Trash Titan', description: 'Takes out the trash like a hero', flavorText: 'Garbage has met its match', category: 'chore_heroes', rarity: 'common', artwork: '/cards/trash-titan.png', borderColor: '#95A5A6', effect: null, setId: 'chore-champions', setNumber: 9, totalInSet: 15, pointsValue: 10 },
  { id: 'cc-010', name: 'Window Warrior', description: 'Leaves no streak behind', flavorText: 'Crystal clear views ahead', category: 'chore_heroes', rarity: 'rare', artwork: '/cards/window-warrior.png', borderColor: '#3498DB', effect: null, setId: 'chore-champions', setNumber: 10, totalInSet: 15, pointsValue: 25 },
  { id: 'cc-011', name: 'Pet Patrol', description: 'Keeps pet areas pristine', flavorText: 'Fur-iendly and clean', category: 'chore_heroes', rarity: 'uncommon', artwork: '/cards/pet-patrol.png', borderColor: '#2ECC71', effect: null, setId: 'chore-champions', setNumber: 11, totalInSet: 15, pointsValue: 15 },
  { id: 'cc-012', name: 'Sock Sorter', description: 'Never loses a match', flavorText: 'Pairs perfectly every time', category: 'chore_heroes', rarity: 'common', artwork: '/cards/sock-sorter.png', borderColor: '#95A5A6', effect: null, setId: 'chore-champions', setNumber: 12, totalInSet: 15, pointsValue: 10 },
  { id: 'cc-013', name: 'Plant Parent', description: 'Keeps all plants thriving', flavorText: 'Green thumb power!', category: 'chore_heroes', rarity: 'uncommon', artwork: '/cards/plant-parent.png', borderColor: '#2ECC71', effect: null, setId: 'chore-champions', setNumber: 13, totalInSet: 15, pointsValue: 15 },
  { id: 'cc-014', name: 'Shelf Sage', description: 'Books always in perfect order', flavorText: 'Alphabetical mastery', category: 'chore_heroes', rarity: 'common', artwork: '/cards/shelf-sage.png', borderColor: '#95A5A6', effect: null, setId: 'chore-champions', setNumber: 14, totalInSet: 15, pointsValue: 10 },
  { id: 'cc-015', name: 'Team Captain', description: 'Leads the family to victory', flavorText: 'Together we clean!', category: 'chore_heroes', rarity: 'epic', artwork: '/cards/team-captain.png', borderColor: '#9B59B6', effect: { type: 'xp_boost', value: 10, description: '+10 XP per chore for the whole family' }, setId: 'chore-champions', setNumber: 15, totalInSet: 15, pointsValue: 50 },

  // Cleaning Tools Set (12 cards)
  { id: 'ct-001', name: 'Golden Broom', description: 'The ultimate sweeping tool', flavorText: 'Sweeps away all troubles', category: 'tools', rarity: 'legendary', artwork: '/cards/golden-broom.png', borderColor: '#FFD700', effect: { type: 'point_boost', value: 25, duration: 24, description: '+25 points for 24 hours' }, setId: 'cleaning-tools', setNumber: 1, totalInSet: 12, pointsValue: 100 },
  { id: 'ct-002', name: 'Magic Sponge', description: 'Erases any stain instantly', flavorText: 'Stains disappear like magic', category: 'tools', rarity: 'epic', artwork: '/cards/magic-sponge.png', borderColor: '#9B59B6', effect: null, setId: 'cleaning-tools', setNumber: 2, totalInSet: 12, pointsValue: 50 },
  { id: 'ct-003', name: 'Super Spray', description: 'All-purpose cleaning power', flavorText: 'Spritz and sparkle!', category: 'tools', rarity: 'rare', artwork: '/cards/super-spray.png', borderColor: '#3498DB', effect: null, setId: 'cleaning-tools', setNumber: 3, totalInSet: 12, pointsValue: 25 },
  { id: 'ct-004', name: 'Trusty Duster', description: 'Captures every speck of dust', flavorText: 'No dust bunny escapes', category: 'tools', rarity: 'uncommon', artwork: '/cards/trusty-duster.png', borderColor: '#2ECC71', effect: null, setId: 'cleaning-tools', setNumber: 4, totalInSet: 12, pointsValue: 15 },
  { id: 'ct-005', name: 'Power Vacuum', description: 'Industrial strength suction', flavorText: 'VROOOOM!', category: 'tools', rarity: 'rare', artwork: '/cards/power-vacuum.png', borderColor: '#3498DB', effect: null, setId: 'cleaning-tools', setNumber: 5, totalInSet: 12, pointsValue: 25 },
  { id: 'ct-006', name: 'Bucket Brigade', description: 'Ready for any spill', flavorText: 'Splash into action!', category: 'tools', rarity: 'common', artwork: '/cards/bucket-brigade.png', borderColor: '#95A5A6', effect: null, setId: 'cleaning-tools', setNumber: 6, totalInSet: 12, pointsValue: 10 },
  { id: 'ct-007', name: 'Scrub Brush', description: 'Tough on grime, gentle on surfaces', flavorText: 'Scrub-a-dub-dub!', category: 'tools', rarity: 'common', artwork: '/cards/scrub-brush.png', borderColor: '#95A5A6', effect: null, setId: 'cleaning-tools', setNumber: 7, totalInSet: 12, pointsValue: 10 },
  { id: 'ct-008', name: 'Microfiber Marvel', description: 'Picks up everything', flavorText: 'Tiny fibers, big results', category: 'tools', rarity: 'uncommon', artwork: '/cards/microfiber-marvel.png', borderColor: '#2ECC71', effect: null, setId: 'cleaning-tools', setNumber: 8, totalInSet: 12, pointsValue: 15 },
  { id: 'ct-009', name: 'Glove Guardians', description: 'Protect hands, battle dirt', flavorText: 'Snap, crackle, clean!', category: 'tools', rarity: 'common', artwork: '/cards/glove-guardians.png', borderColor: '#95A5A6', effect: null, setId: 'cleaning-tools', setNumber: 9, totalInSet: 12, pointsValue: 10 },
  { id: 'ct-010', name: 'Laundry Basket', description: 'Carries the load with ease', flavorText: 'One basket to hold them all', category: 'tools', rarity: 'common', artwork: '/cards/laundry-basket.png', borderColor: '#95A5A6', effect: null, setId: 'cleaning-tools', setNumber: 10, totalInSet: 12, pointsValue: 10 },
  { id: 'ct-011', name: 'Squeegee Star', description: 'Streak-free shine every time', flavorText: 'Squeak squeak shine!', category: 'tools', rarity: 'uncommon', artwork: '/cards/squeegee-star.png', borderColor: '#2ECC71', effect: null, setId: 'cleaning-tools', setNumber: 11, totalInSet: 12, pointsValue: 15 },
  { id: 'ct-012', name: 'Trash Can Titan', description: 'Swallows garbage whole', flavorText: 'Feed me your trash!', category: 'tools', rarity: 'rare', artwork: '/cards/trash-can-titan.png', borderColor: '#3498DB', effect: null, setId: 'cleaning-tools', setNumber: 12, totalInSet: 12, pointsValue: 25 },

  // Home Locations Set (10 cards)
  { id: 'hl-001', name: 'Kitchen Kingdom', description: 'Where culinary magic happens', flavorText: 'The heart of the home', category: 'locations', rarity: 'rare', artwork: '/cards/kitchen-kingdom.png', borderColor: '#3498DB', effect: null, setId: 'home-locations', setNumber: 1, totalInSet: 10, pointsValue: 25 },
  { id: 'hl-002', name: 'Bathroom Bastion', description: 'Cleanliness central', flavorText: 'Sparkle and shine zone', category: 'locations', rarity: 'rare', artwork: '/cards/bathroom-bastion.png', borderColor: '#3498DB', effect: null, setId: 'home-locations', setNumber: 2, totalInSet: 10, pointsValue: 25 },
  { id: 'hl-003', name: 'Living Room Lounge', description: 'The family gathering spot', flavorText: 'Relax and refresh', category: 'locations', rarity: 'uncommon', artwork: '/cards/living-room-lounge.png', borderColor: '#2ECC71', effect: null, setId: 'home-locations', setNumber: 3, totalInSet: 10, pointsValue: 15 },
  { id: 'hl-004', name: 'Bedroom Bliss', description: 'Rest and relaxation awaits', flavorText: 'Sweet dreams start here', category: 'locations', rarity: 'uncommon', artwork: '/cards/bedroom-bliss.png', borderColor: '#2ECC71', effect: null, setId: 'home-locations', setNumber: 4, totalInSet: 10, pointsValue: 15 },
  { id: 'hl-005', name: 'Garage Grounds', description: 'Tools and treasures within', flavorText: 'Where DIY dreams come true', category: 'locations', rarity: 'common', artwork: '/cards/garage-grounds.png', borderColor: '#95A5A6', effect: null, setId: 'home-locations', setNumber: 5, totalInSet: 10, pointsValue: 10 },
  { id: 'hl-006', name: 'Backyard Oasis', description: 'Nature meets home', flavorText: 'Fresh air and fun', category: 'locations', rarity: 'uncommon', artwork: '/cards/backyard-oasis.png', borderColor: '#2ECC71', effect: null, setId: 'home-locations', setNumber: 6, totalInSet: 10, pointsValue: 15 },
  { id: 'hl-007', name: 'Hallway Highway', description: 'Connects it all together', flavorText: 'The path to everywhere', category: 'locations', rarity: 'common', artwork: '/cards/hallway-highway.png', borderColor: '#95A5A6', effect: null, setId: 'home-locations', setNumber: 7, totalInSet: 10, pointsValue: 10 },
  { id: 'hl-008', name: 'Closet Castle', description: 'Organization headquarters', flavorText: 'A place for everything', category: 'locations', rarity: 'common', artwork: '/cards/closet-castle.png', borderColor: '#95A5A6', effect: null, setId: 'home-locations', setNumber: 8, totalInSet: 10, pointsValue: 10 },
  { id: 'hl-009', name: 'Dining Domain', description: 'Where families feast together', flavorText: 'Pass the potatoes!', category: 'locations', rarity: 'uncommon', artwork: '/cards/dining-domain.png', borderColor: '#2ECC71', effect: null, setId: 'home-locations', setNumber: 9, totalInSet: 10, pointsValue: 15 },
  { id: 'hl-010', name: 'Laundry Lair', description: 'Where clothes get reborn', flavorText: 'Spin cycle sanctuary', category: 'locations', rarity: 'rare', artwork: '/cards/laundry-lair.png', borderColor: '#3498DB', effect: null, setId: 'home-locations', setNumber: 10, totalInSet: 10, pointsValue: 25 },

  // Power-Up Set (8 cards)
  { id: 'pu-001', name: 'XP Explosion', description: 'Massive experience boost', flavorText: 'Level up faster!', category: 'power_ups', rarity: 'legendary', artwork: '/cards/xp-explosion.png', borderColor: '#FFD700', effect: { type: 'xp_boost', value: 50, duration: 6, description: '+50 XP for 6 hours' }, setId: 'power-boosts', setNumber: 1, totalInSet: 8, pointsValue: 100 },
  { id: 'pu-002', name: 'Point Potion', description: 'Brew up bonus points', flavorText: 'Bubble, bubble, points double!', category: 'power_ups', rarity: 'epic', artwork: '/cards/point-potion.png', borderColor: '#9B59B6', effect: { type: 'point_boost', value: 30, duration: 12, description: '+30 points for 12 hours' }, setId: 'power-boosts', setNumber: 2, totalInSet: 8, pointsValue: 50 },
  { id: 'pu-003', name: 'Streak Shield', description: 'Protect your precious streak', flavorText: 'One free pass!', category: 'power_ups', rarity: 'epic', artwork: '/cards/streak-shield.png', borderColor: '#9B59B6', effect: { type: 'streak_shield', value: 1, description: 'Protects streak for 1 missed day' }, setId: 'power-boosts', setNumber: 3, totalInSet: 8, pointsValue: 50 },
  { id: 'pu-004', name: 'Lucky Spin', description: 'Extra spin on the reward wheel', flavorText: 'Round and round!', category: 'power_ups', rarity: 'rare', artwork: '/cards/lucky-spin.png', borderColor: '#3498DB', effect: { type: 'bonus_spin', value: 1, description: '+1 bonus spin on reward wheel' }, setId: 'power-boosts', setNumber: 4, totalInSet: 8, pointsValue: 25 },
  { id: 'pu-005', name: 'Instant Reward', description: 'Claim points immediately', flavorText: 'No waiting required!', category: 'power_ups', rarity: 'rare', artwork: '/cards/instant-reward.png', borderColor: '#3498DB', effect: { type: 'instant_reward', value: 50, description: 'Instantly earn 50 points' }, setId: 'power-boosts', setNumber: 5, totalInSet: 8, pointsValue: 25 },
  { id: 'pu-006', name: 'Time Warp', description: 'Complete chores faster', flavorText: 'Tick tock, time to rock!', category: 'power_ups', rarity: 'uncommon', artwork: '/cards/time-warp.png', borderColor: '#2ECC71', effect: null, setId: 'power-boosts', setNumber: 6, totalInSet: 8, pointsValue: 15 },
  { id: 'pu-007', name: 'Team Boost', description: 'Helps the whole family', flavorText: 'Stronger together!', category: 'power_ups', rarity: 'uncommon', artwork: '/cards/team-boost.png', borderColor: '#2ECC71', effect: null, setId: 'power-boosts', setNumber: 7, totalInSet: 8, pointsValue: 15 },
  { id: 'pu-008', name: 'Mini Boost', description: 'A small but helpful bonus', flavorText: 'Every bit counts!', category: 'power_ups', rarity: 'common', artwork: '/cards/mini-boost.png', borderColor: '#95A5A6', effect: { type: 'xp_boost', value: 5, duration: 2, description: '+5 XP for 2 hours' }, setId: 'power-boosts', setNumber: 8, totalInSet: 8, pointsValue: 10 },

  // Spring Cleaning Set (6 cards)
  { id: 'ss-001', name: 'Spring Blossom', description: 'The season of renewal', flavorText: 'Fresh starts bloom!', category: 'seasonal', rarity: 'legendary', artwork: '/cards/spring-blossom.png', borderColor: '#FFD700', effect: { type: 'xp_boost', value: 30, duration: 48, description: '+30 XP for 48 hours' }, setId: 'seasonal-spring', setNumber: 1, totalInSet: 6, pointsValue: 100 },
  { id: 'ss-002', name: 'Rainbow Rain', description: 'Washing winter away', flavorText: 'Colors after the storm', category: 'seasonal', rarity: 'epic', artwork: '/cards/rainbow-rain.png', borderColor: '#9B59B6', effect: null, setId: 'seasonal-spring', setNumber: 2, totalInSet: 6, pointsValue: 50 },
  { id: 'ss-003', name: 'Garden Guardian', description: 'Protects the growing greens', flavorText: 'Grow little sprouts!', category: 'seasonal', rarity: 'rare', artwork: '/cards/garden-guardian.png', borderColor: '#3498DB', effect: null, setId: 'seasonal-spring', setNumber: 3, totalInSet: 6, pointsValue: 25 },
  { id: 'ss-004', name: 'Butterfly Buddy', description: 'Transformation complete', flavorText: 'From cocoon to clean!', category: 'seasonal', rarity: 'uncommon', artwork: '/cards/butterfly-buddy.png', borderColor: '#2ECC71', effect: null, setId: 'seasonal-spring', setNumber: 4, totalInSet: 6, pointsValue: 15 },
  { id: 'ss-005', name: 'Fresh Breeze', description: 'Open windows and fresh air', flavorText: 'Ahhhh refreshing!', category: 'seasonal', rarity: 'uncommon', artwork: '/cards/fresh-breeze.png', borderColor: '#2ECC71', effect: null, setId: 'seasonal-spring', setNumber: 5, totalInSet: 6, pointsValue: 15 },
  { id: 'ss-006', name: 'Sunny Day', description: 'Perfect cleaning weather', flavorText: 'Let the sunshine in!', category: 'seasonal', rarity: 'common', artwork: '/cards/sunny-day.png', borderColor: '#95A5A6', effect: null, setId: 'seasonal-spring', setNumber: 6, totalInSet: 6, pointsValue: 10 },
];

// Card Packs
const cardPacksData = [
  {
    id: 'basic-pack',
    name: 'Basic Pack',
    description: 'A standard pack with 5 random cards',
    packType: 'basic',
    artwork: '/packs/basic-pack.png',
    cardCount: 5,
    pointCost: 50,
    coinCost: null,
    guaranteedRarity: null,
    rarityWeights: { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 },
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    sortOrder: 1,
  },
  {
    id: 'premium-pack',
    name: 'Premium Pack',
    description: 'Better odds for rare cards',
    packType: 'premium',
    artwork: '/packs/premium-pack.png',
    cardCount: 5,
    pointCost: 150,
    coinCost: null,
    guaranteedRarity: 'uncommon',
    rarityWeights: { common: 40, uncommon: 30, rare: 20, epic: 8, legendary: 2 },
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    sortOrder: 2,
  },
  {
    id: 'legendary-pack',
    name: 'Legendary Pack',
    description: 'Guaranteed rare or better!',
    packType: 'legendary',
    artwork: '/packs/legendary-pack.png',
    cardCount: 5,
    pointCost: 500,
    coinCost: null,
    guaranteedRarity: 'rare',
    rarityWeights: { common: 0, uncommon: 30, rare: 40, epic: 20, legendary: 10 },
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    sortOrder: 3,
  },
  {
    id: 'spring-pack',
    name: 'Spring Cleaning Pack',
    description: 'Limited time spring-themed cards',
    packType: 'seasonal',
    artwork: '/packs/spring-pack.png',
    cardCount: 3,
    pointCost: 100,
    coinCost: null,
    guaranteedRarity: null,
    rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
    isActive: true,
    availableFrom: new Date('2024-03-01'),
    availableUntil: new Date('2024-05-31'),
    sortOrder: 10,
  },
  {
    id: 'starter-pack',
    name: 'Starter Pack',
    description: 'Free pack for new collectors!',
    packType: 'basic',
    artwork: '/packs/starter-pack.png',
    cardCount: 10,
    pointCost: 0,
    coinCost: null,
    guaranteedRarity: 'rare',
    rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    sortOrder: 0,
  },
];

// Card Rewards
const cardRewardsData = [
  {
    id: 'daily-login-card',
    rewardType: 'daily_login',
    targetType: 'random_card',
    cardId: null,
    packId: null,
    rarity: 'common',
    quantity: 1,
    description: 'Earn a random common card just for logging in!',
    isActive: true,
  },
  {
    id: 'weekly-challenge-pack',
    rewardType: 'weekly_challenge',
    targetType: 'pack',
    cardId: null,
    packId: 'basic-pack',
    rarity: null,
    quantity: 1,
    description: 'Complete the weekly challenge for a free pack!',
    isActive: true,
  },
  {
    id: 'first-chore-card',
    rewardType: 'chore_milestone',
    targetType: 'specific_card',
    cardId: 'cc-008',
    packId: null,
    rarity: null,
    quantity: 1,
    description: 'Complete your first chore to earn Bed Making Buddy!',
    isActive: true,
  },
  {
    id: '10-chores-pack',
    rewardType: 'chore_milestone',
    targetType: 'pack',
    cardId: null,
    packId: 'premium-pack',
    rarity: null,
    quantity: 1,
    description: 'Complete 10 chores to earn a Premium Pack!',
    isActive: true,
  },
  {
    id: '50-chores-legendary',
    rewardType: 'chore_milestone',
    targetType: 'random_card',
    cardId: null,
    packId: null,
    rarity: 'legendary',
    quantity: 1,
    description: 'Complete 50 chores for a guaranteed Legendary card!',
    isActive: true,
  },
];

// Seed function
export async function seedCollectibleCards() {
  console.log('Seeding card sets...');
  for (const set of cardSetsData) {
    await db.insert(cardSets).values(set).onConflictDoNothing();
  }

  console.log('Seeding cards...');
  for (const card of cardsData) {
    await db.insert(cards).values({
      ...card,
      isActive: true,
      releasedAt: new Date(),
      retiredAt: null,
    }).onConflictDoNothing();
  }

  console.log('Seeding card packs...');
  for (const pack of cardPacksData) {
    await db.insert(cardPacks).values(pack).onConflictDoNothing();
  }

  console.log('Seeding card rewards...');
  for (const reward of cardRewardsData) {
    await db.insert(cardRewards).values(reward).onConflictDoNothing();
  }

  console.log('Collectible cards seeded successfully!');
}
