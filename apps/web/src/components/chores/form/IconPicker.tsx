import { useState } from 'react';
import { cn } from '@chorechamp/ui';

const CHORE_ICONS = {
  kitchen: ['🍽️', '🧹', '🧽', '🗑️', '🍳', '☕', '🧊', '🥗'],
  bathroom: ['🚿', '🛁', '🧼', '🪥', '🚽', '🪒', '🧴', '🪞'],
  bedroom: ['🛏️', '👕', '👖', '🧺', '🧸', '📚', '💡', '🪴'],
  living_room: ['🛋️', '📺', '🖼️', '🪟', '🧹', '🌿', '📖', '🕯️'],
  outdoor: ['🌳', '🚗', '🏡', '🧹', '🍂', '🌸', '🔧', '🚰'],
  pet_care: ['🐕', '🐈', '🐟', '🐹', '🦜', '🥣', '🚶', '🧹'],
  laundry: ['👕', '🧺', '👔', '🧦', '🩳', '🧥', '🎽', '🪣'],
  general: ['✨', '🧽', '🪣', '🧹', '📦', '🔧', '🏠', '✅'],
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  category?: string;
}

export function IconPicker({ value, onChange, category = 'general' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const icons = CHORE_ICONS[category as keyof typeof CHORE_ICONS] || CHORE_ICONS.general;
  const allIcons = Object.values(CHORE_ICONS).flat();
  const uniqueIcons = [...new Set(allIcons)];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>

      {/* Selected icon button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 bg-white text-2xl hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {value || '✨'}
      </button>

      {/* Icon picker dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs text-gray-500">
              Suggested for {category.replace('_', ' ')}:
            </p>
            <div className="grid grid-cols-8 gap-1">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onChange(icon);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100',
                    value === icon && 'bg-blue-100 ring-2 ring-blue-500'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className="mt-3 border-t pt-3">
              <p className="mb-2 text-xs text-gray-500">All icons:</p>
              <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                {uniqueIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      onChange(icon);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100',
                      value === icon && 'bg-blue-100 ring-2 ring-blue-500'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
