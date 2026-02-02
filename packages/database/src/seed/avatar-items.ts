// Avatar item definitions for the character system
// Reference: F9.1 RPG Character System

export const avatarItemData = [
  // SKIN TONES (all default)
  { id: 'skin-light', category: 'skin_tone', name: 'Light', icon: '#FFDBB4', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'skin-fair', category: 'skin_tone', name: 'Fair', icon: '#EDB98A', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'skin-medium', category: 'skin_tone', name: 'Medium', icon: '#D08B5B', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'skin-olive', category: 'skin_tone', name: 'Olive', icon: '#AE8B61', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },
  { id: 'skin-tan', category: 'skin_tone', name: 'Tan', icon: '#9A6D4A', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 5 },
  { id: 'skin-brown', category: 'skin_tone', name: 'Brown', icon: '#7D5339', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 6 },
  { id: 'skin-dark', category: 'skin_tone', name: 'Dark', icon: '#5C4033', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 7 },
  { id: 'skin-deep', category: 'skin_tone', name: 'Deep', icon: '#3D2B1F', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 8 },

  // HAIR STYLES - Default
  { id: 'hair-short', category: 'hair_style', name: 'Short', icon: '💇', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'hair-medium', category: 'hair_style', name: 'Medium', icon: '💇‍♀️', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'hair-long', category: 'hair_style', name: 'Long', icon: '👩‍🦰', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'hair-curly', category: 'hair_style', name: 'Curly', icon: '👨‍🦱', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },
  { id: 'hair-wavy', category: 'hair_style', name: 'Wavy', icon: '🌊', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 5 },
  { id: 'hair-bald', category: 'hair_style', name: 'Bald', icon: '👨‍🦲', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 6 },

  // HAIR STYLES - Unlockable
  { id: 'hair-mohawk', category: 'hair_style', name: 'Mohawk', icon: '🦅', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 10 },
  { id: 'hair-braids', category: 'hair_style', name: 'Braids', icon: '🎀', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 11 },
  { id: 'hair-ponytail', category: 'hair_style', name: 'Ponytail', icon: '🎗️', rarity: 'uncommon', unlockType: 'level', unlockLevel: 20, isDefault: false, sortOrder: 12 },
  { id: 'hair-afro', category: 'hair_style', name: 'Afro', icon: '🌺', rarity: 'rare', unlockType: 'level', unlockLevel: 30, isDefault: false, sortOrder: 13 },
  { id: 'hair-spiky', category: 'hair_style', name: 'Spiky', icon: '⚡', rarity: 'rare', unlockType: 'achievement', unlockAchievementId: 'streak-master', isDefault: false, sortOrder: 14 },
  { id: 'hair-royal', category: 'hair_style', name: 'Royal', icon: '👑', rarity: 'epic', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 15 },

  // HAIR COLORS - Default
  { id: 'haircolor-black', category: 'hair_color', name: 'Black', icon: '#000000', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'haircolor-brown', category: 'hair_color', name: 'Brown', icon: '#8B4513', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'haircolor-blonde', category: 'hair_color', name: 'Blonde', icon: '#FFD700', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'haircolor-red', category: 'hair_color', name: 'Red', icon: '#B22222', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },
  { id: 'haircolor-gray', category: 'hair_color', name: 'Gray', icon: '#808080', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 5 },
  { id: 'haircolor-white', category: 'hair_color', name: 'White', icon: '#FFFFFF', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 6 },

  // HAIR COLORS - Unlockable
  { id: 'haircolor-blue', category: 'hair_color', name: 'Blue', icon: '#3B82F6', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 10 },
  { id: 'haircolor-purple', category: 'hair_color', name: 'Purple', icon: '#8B5CF6', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 11 },
  { id: 'haircolor-pink', category: 'hair_color', name: 'Pink', icon: '#EC4899', rarity: 'uncommon', unlockType: 'level', unlockLevel: 20, isDefault: false, sortOrder: 12 },
  { id: 'haircolor-green', category: 'hair_color', name: 'Green', icon: '#10B981', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 13 },
  { id: 'haircolor-rainbow', category: 'hair_color', name: 'Rainbow', icon: '🌈', rarity: 'epic', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 14 },
  { id: 'haircolor-galaxy', category: 'hair_color', name: 'Galaxy', icon: '🌌', rarity: 'legendary', unlockType: 'level', unlockLevel: 75, isDefault: false, sortOrder: 15 },

  // EYE COLORS - Default
  { id: 'eyes-brown', category: 'eye_color', name: 'Brown', icon: '#8B4513', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'eyes-blue', category: 'eye_color', name: 'Blue', icon: '#3B82F6', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'eyes-green', category: 'eye_color', name: 'Green', icon: '#10B981', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'eyes-hazel', category: 'eye_color', name: 'Hazel', icon: '#D97706', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },
  { id: 'eyes-gray', category: 'eye_color', name: 'Gray', icon: '#6B7280', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 5 },

  // EYE COLORS - Unlockable
  { id: 'eyes-violet', category: 'eye_color', name: 'Violet', icon: '#7C3AED', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 10 },
  { id: 'eyes-gold', category: 'eye_color', name: 'Gold', icon: '#F59E0B', rarity: 'epic', unlockType: 'level', unlockLevel: 40, isDefault: false, sortOrder: 11 },
  { id: 'eyes-fire', category: 'eye_color', name: 'Fire', icon: '#EF4444', rarity: 'epic', unlockType: 'achievement', unlockAchievementId: 'legendary-streak', isDefault: false, sortOrder: 12 },
  { id: 'eyes-cosmic', category: 'eye_color', name: 'Cosmic', icon: '✨', rarity: 'legendary', unlockType: 'level', unlockLevel: 100, isDefault: false, sortOrder: 13 },

  // FACE SHAPES - Default
  { id: 'face-round', category: 'face_shape', name: 'Round', icon: '⭕', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'face-oval', category: 'face_shape', name: 'Oval', icon: '🥚', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'face-square', category: 'face_shape', name: 'Square', icon: '⬜', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'face-heart', category: 'face_shape', name: 'Heart', icon: '💛', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },

  // OUTFITS - Default
  { id: 'outfit-casual', category: 'outfit', name: 'Casual', icon: '👕', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'outfit-sporty', category: 'outfit', name: 'Sporty', icon: '🏃', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'outfit-formal', category: 'outfit', name: 'Formal', icon: '👔', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'outfit-cozy', category: 'outfit', name: 'Cozy', icon: '🧥', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },

  // OUTFITS - Class-themed (unlocked with class levels)
  { id: 'outfit-cleaner', category: 'outfit', name: 'Cleaner Uniform', icon: '🧹', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 10 },
  { id: 'outfit-organizer', category: 'outfit', name: 'Organizer Suit', icon: '📋', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 11 },
  { id: 'outfit-helper', category: 'outfit', name: 'Helper Vest', icon: '🤝', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 12 },
  { id: 'outfit-chef', category: 'outfit', name: 'Chef Coat', icon: '👨‍🍳', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 13 },
  { id: 'outfit-guardian', category: 'outfit', name: 'Guardian Armor', icon: '🛡️', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 14 },

  // OUTFITS - Special
  { id: 'outfit-superhero', category: 'outfit', name: 'Superhero', icon: '🦸', rarity: 'rare', unlockType: 'achievement', unlockAchievementId: 'helpful-hero', isDefault: false, sortOrder: 20 },
  { id: 'outfit-champion', category: 'outfit', name: 'Champion', icon: '🏆', rarity: 'epic', unlockType: 'achievement', unlockAchievementId: 'chore-champion', isDefault: false, sortOrder: 21 },
  { id: 'outfit-royal', category: 'outfit', name: 'Royal Robes', icon: '👑', rarity: 'legendary', unlockType: 'level', unlockLevel: 100, isDefault: false, sortOrder: 22 },

  // OUTFIT COLORS - Default
  { id: 'outfitcolor-blue', category: 'outfit_color', name: 'Blue', icon: '#3B82F6', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'outfitcolor-red', category: 'outfit_color', name: 'Red', icon: '#EF4444', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 2 },
  { id: 'outfitcolor-green', category: 'outfit_color', name: 'Green', icon: '#10B981', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 3 },
  { id: 'outfitcolor-purple', category: 'outfit_color', name: 'Purple', icon: '#8B5CF6', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 4 },
  { id: 'outfitcolor-yellow', category: 'outfit_color', name: 'Yellow', icon: '#F59E0B', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 5 },
  { id: 'outfitcolor-black', category: 'outfit_color', name: 'Black', icon: '#1F2937', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 6 },
  { id: 'outfitcolor-white', category: 'outfit_color', name: 'White', icon: '#F9FAFB', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 7 },
  { id: 'outfitcolor-pink', category: 'outfit_color', name: 'Pink', icon: '#EC4899', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 8 },

  // OUTFIT COLORS - Unlockable
  { id: 'outfitcolor-gold', category: 'outfit_color', name: 'Gold', icon: '#FFD700', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 10 },
  { id: 'outfitcolor-silver', category: 'outfit_color', name: 'Silver', icon: '#C0C0C0', rarity: 'rare', unlockType: 'level', unlockLevel: 30, isDefault: false, sortOrder: 11 },
  { id: 'outfitcolor-rainbow', category: 'outfit_color', name: 'Rainbow', icon: '🌈', rarity: 'epic', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 12 },
  { id: 'outfitcolor-galaxy', category: 'outfit_color', name: 'Galaxy', icon: '🌌', rarity: 'legendary', unlockType: 'level', unlockLevel: 75, isDefault: false, sortOrder: 13 },

  // ACCESSORIES - Default (none)
  { id: 'acc-none', category: 'accessory', name: 'None', icon: '❌', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },

  // ACCESSORIES - Glasses
  { id: 'acc-glasses', category: 'accessory', name: 'Glasses', icon: '👓', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 1 },
  { id: 'acc-sunglasses', category: 'accessory', name: 'Sunglasses', icon: '🕶️', rarity: 'uncommon', unlockType: 'level', unlockLevel: 5, isDefault: false, sortOrder: 2 },

  // ACCESSORIES - Hats
  { id: 'acc-cap', category: 'accessory', name: 'Cap', icon: '🧢', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 10 },
  { id: 'acc-beanie', category: 'accessory', name: 'Beanie', icon: '🎿', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 11 },
  { id: 'acc-crown', category: 'accessory', name: 'Crown', icon: '👑', rarity: 'legendary', unlockType: 'level', unlockLevel: 100, isDefault: false, sortOrder: 12 },

  // ACCESSORIES - Other
  { id: 'acc-headphones', category: 'accessory', name: 'Headphones', icon: '🎧', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 20 },
  { id: 'acc-bandana', category: 'accessory', name: 'Bandana', icon: '🎀', rarity: 'uncommon', unlockType: 'level', unlockLevel: 20, isDefault: false, sortOrder: 21 },
  { id: 'acc-cape', category: 'accessory', name: 'Cape', icon: '🦸', rarity: 'epic', unlockType: 'achievement', unlockAchievementId: 'helpful-hero', isDefault: false, sortOrder: 22 },
  { id: 'acc-halo', category: 'accessory', name: 'Halo', icon: '😇', rarity: 'legendary', unlockType: 'achievement', unlockAchievementId: 'completionist', isDefault: false, sortOrder: 23 },

  // BACKGROUNDS - Default
  { id: 'bg-white', category: 'background', name: 'White', icon: '#FFFFFF', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 1 },
  { id: 'bg-blue', category: 'background', name: 'Sky Blue', icon: '#DBEAFE', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 2 },
  { id: 'bg-green', category: 'background', name: 'Mint', icon: '#D1FAE5', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 3 },
  { id: 'bg-purple', category: 'background', name: 'Lavender', icon: '#EDE9FE', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 4 },
  { id: 'bg-pink', category: 'background', name: 'Rose', icon: '#FCE7F3', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 5 },
  { id: 'bg-yellow', category: 'background', name: 'Sunshine', icon: '#FEF3C7', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 6 },

  // BACKGROUNDS - Unlockable
  { id: 'bg-gradient-blue', category: 'background', name: 'Ocean Gradient', icon: '🌊', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 10 },
  { id: 'bg-gradient-sunset', category: 'background', name: 'Sunset Gradient', icon: '🌅', rarity: 'uncommon', unlockType: 'level', unlockLevel: 15, isDefault: false, sortOrder: 11 },
  { id: 'bg-gradient-forest', category: 'background', name: 'Forest Gradient', icon: '🌲', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 12 },
  { id: 'bg-sparkles', category: 'background', name: 'Sparkles', icon: '✨', rarity: 'rare', unlockType: 'level', unlockLevel: 30, isDefault: false, sortOrder: 13 },
  { id: 'bg-stars', category: 'background', name: 'Starfield', icon: '⭐', rarity: 'epic', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 14 },
  { id: 'bg-galaxy', category: 'background', name: 'Galaxy', icon: '🌌', rarity: 'legendary', unlockType: 'level', unlockLevel: 75, isDefault: false, sortOrder: 15 },

  // FRAMES - Default
  { id: 'frame-none', category: 'frame', name: 'None', icon: '❌', rarity: 'common', unlockType: 'default', isDefault: true, sortOrder: 0 },
  { id: 'frame-circle', category: 'frame', name: 'Circle', icon: '⭕', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 1 },
  { id: 'frame-square', category: 'frame', name: 'Square', icon: '⬜', rarity: 'common', unlockType: 'default', isDefault: false, sortOrder: 2 },

  // FRAMES - Unlockable
  { id: 'frame-bronze', category: 'frame', name: 'Bronze', icon: '🥉', rarity: 'uncommon', unlockType: 'level', unlockLevel: 10, isDefault: false, sortOrder: 10 },
  { id: 'frame-silver', category: 'frame', name: 'Silver', icon: '🥈', rarity: 'rare', unlockType: 'level', unlockLevel: 25, isDefault: false, sortOrder: 11 },
  { id: 'frame-gold', category: 'frame', name: 'Gold', icon: '🥇', rarity: 'epic', unlockType: 'level', unlockLevel: 50, isDefault: false, sortOrder: 12 },
  { id: 'frame-diamond', category: 'frame', name: 'Diamond', icon: '💎', rarity: 'legendary', unlockType: 'level', unlockLevel: 100, isDefault: false, sortOrder: 13 },

  // FRAMES - Achievement
  { id: 'frame-fire', category: 'frame', name: 'Fire', icon: '🔥', rarity: 'epic', unlockType: 'achievement', unlockAchievementId: 'legendary-streak', isDefault: false, sortOrder: 20 },
  { id: 'frame-trophy', category: 'frame', name: 'Trophy', icon: '🏆', rarity: 'epic', unlockType: 'achievement', unlockAchievementId: 'century-club', isDefault: false, sortOrder: 21 },
  { id: 'frame-champion', category: 'frame', name: 'Champion', icon: '👑', rarity: 'legendary', unlockType: 'achievement', unlockAchievementId: 'completionist', isDefault: false, sortOrder: 22 },
];

export type AvatarItemData = (typeof avatarItemData)[number];
