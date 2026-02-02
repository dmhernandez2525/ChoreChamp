import { useState, useCallback } from 'react';
import { cn } from '@chorechamp/ui';
import type { AvatarCustomization, AvatarItem, AvatarItemCategory } from '@chorechamp/types';
import { AvatarDisplay } from './AvatarDisplay';

interface AvatarBuilderProps {
  currentAvatar: AvatarCustomization;
  availableItems: AvatarItem[];
  unlockedItems: string[];
  characterLevel: number;
  onSave: (avatar: AvatarCustomization) => void;
  isSaving?: boolean;
}

const CATEGORY_LABELS: Record<AvatarItemCategory, string> = {
  skin_tone: 'Skin Tone',
  hair_style: 'Hair Style',
  hair_color: 'Hair Color',
  eye_color: 'Eye Color',
  face_shape: 'Face Shape',
  outfit: 'Outfit',
  outfit_color: 'Outfit Color',
  accessory: 'Accessories',
  background: 'Background',
  frame: 'Frame',
};

const CATEGORY_ORDER: AvatarItemCategory[] = [
  'skin_tone',
  'face_shape',
  'hair_style',
  'hair_color',
  'eye_color',
  'outfit',
  'outfit_color',
  'accessory',
  'background',
  'frame',
];

export function AvatarBuilder({
  currentAvatar,
  availableItems,
  unlockedItems,
  characterLevel,
  onSave,
  isSaving = false,
}: AvatarBuilderProps) {
  const [avatar, setAvatar] = useState<AvatarCustomization>(currentAvatar);
  const [activeCategory, setActiveCategory] = useState<AvatarItemCategory>('skin_tone');

  const hasChanges = JSON.stringify(avatar) !== JSON.stringify(currentAvatar);

  const isItemUnlocked = useCallback(
    (item: AvatarItem): boolean => {
      if (item.isDefault) return true;
      if (unlockedItems.includes(item.id)) return true;

      // Check level-based unlocks
      if (item.unlockType === 'level' && item.unlockLevel) {
        return characterLevel >= item.unlockLevel;
      }

      return false;
    },
    [unlockedItems, characterLevel]
  );

  const getItemsForCategory = useCallback(
    (category: AvatarItemCategory) => {
      return availableItems
        .filter((item) => item.category === category)
        .sort((a, b) => {
          // Sort: unlocked first, then by sort order
          const aUnlocked = isItemUnlocked(a);
          const bUnlocked = isItemUnlocked(b);
          if (aUnlocked && !bUnlocked) return -1;
          if (!aUnlocked && bUnlocked) return 1;
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
    },
    [availableItems, isItemUnlocked]
  );

  const handleItemSelect = (category: AvatarItemCategory, itemId: string) => {
    if (category === 'accessory') {
      // Toggle accessory
      const currentAccessories = avatar.accessories || [];
      const newAccessories = currentAccessories.includes(itemId)
        ? currentAccessories.filter((id) => id !== itemId)
        : itemId === 'acc-none'
          ? []
          : [...currentAccessories.filter((id) => id !== 'acc-none'), itemId];

      setAvatar((prev) => ({ ...prev, accessories: newAccessories }));
    } else {
      // Set single value
      const fieldMap: Record<AvatarItemCategory, keyof AvatarCustomization> = {
        skin_tone: 'skinTone',
        hair_style: 'hairStyle',
        hair_color: 'hairColor',
        eye_color: 'eyeColor',
        face_shape: 'faceShape',
        outfit: 'outfit',
        outfit_color: 'outfitColor',
        accessory: 'accessories',
        background: 'background',
        frame: 'frame',
      };
      const field = fieldMap[category];
      if (field && field !== 'accessories') {
        setAvatar((prev) => ({ ...prev, [field]: itemId }));
      }
    }
  };

  const isItemSelected = (category: AvatarItemCategory, itemId: string): boolean => {
    if (category === 'accessory') {
      if (itemId === 'acc-none') {
        return avatar.accessories.length === 0;
      }
      return avatar.accessories.includes(itemId);
    }

    const fieldMap: Record<AvatarItemCategory, keyof AvatarCustomization> = {
      skin_tone: 'skinTone',
      hair_style: 'hairStyle',
      hair_color: 'hairColor',
      eye_color: 'eyeColor',
      face_shape: 'faceShape',
      outfit: 'outfit',
      outfit_color: 'outfitColor',
      accessory: 'accessories',
      background: 'background',
      frame: 'frame',
    };
    const field = fieldMap[category];
    return field && field !== 'accessories' && avatar[field] === itemId;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-400 bg-amber-50';
      case 'epic':
        return 'border-purple-400 bg-purple-50';
      case 'rare':
        return 'border-blue-400 bg-blue-50';
      case 'uncommon':
        return 'border-green-400 bg-green-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Preview */}
      <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Preview</h3>
        <AvatarDisplay avatar={avatar} size="xl" />
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setAvatar(currentAvatar)}
            disabled={!hasChanges || isSaving}
            className={cn(
              'px-4 py-2 text-sm rounded-lg border',
              hasChanges
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Reset
          </button>
          <button
            onClick={() => onSave(avatar)}
            disabled={!hasChanges || isSaving}
            className={cn(
              'px-4 py-2 text-sm rounded-lg font-medium',
              hasChanges
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Customization Options */}
      <div className="flex-1">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b pb-3">
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                activeCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {getItemsForCategory(activeCategory).map((item) => {
            const unlocked = isItemUnlocked(item);
            const selected = isItemSelected(activeCategory, item.id);

            return (
              <button
                key={item.id}
                onClick={() => unlocked && handleItemSelect(activeCategory, item.id)}
                disabled={!unlocked}
                className={cn(
                  'relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all',
                  selected
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : getRarityColor(item.rarity),
                  !unlocked && 'opacity-50 cursor-not-allowed grayscale'
                )}
                title={`${item.name}${!unlocked ? ' (Locked)' : ''}`}
              >
                {/* Item Icon */}
                <span className="text-2xl">
                  {item.icon?.startsWith('#') ? (
                    <span
                      className="inline-block w-6 h-6 rounded-full border"
                      style={{ backgroundColor: item.icon }}
                    />
                  ) : (
                    item.icon || '❓'
                  )}
                </span>

                {/* Item Name */}
                <span className="text-[10px] text-gray-600 mt-1 truncate w-full text-center">
                  {item.name}
                </span>

                {/* Lock Indicator */}
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                    <span className="text-lg">🔒</span>
                  </div>
                )}

                {/* Unlock Level */}
                {!unlocked && item.unlockLevel && (
                  <span className="absolute -top-1 -right-1 text-[9px] bg-gray-800 text-white px-1 rounded">
                    Lv.{item.unlockLevel}
                  </span>
                )}

                {/* Selected Indicator */}
                {selected && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[10px]">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
