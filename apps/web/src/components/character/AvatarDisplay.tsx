import { cn } from '@chorechamp/ui';
import type { AvatarCustomization } from '@chorechamp/types';

interface AvatarDisplayProps {
  avatar: AvatarCustomization;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  frame?: string;
  className?: string;
}

const BACKGROUND_COLORS: Record<string, string> = {
  'bg-white': '#FFFFFF',
  'bg-blue': '#DBEAFE',
  'bg-green': '#D1FAE5',
  'bg-purple': '#EDE9FE',
  'bg-pink': '#FCE7F3',
  'bg-yellow': '#FEF3C7',
  'bg-gradient-blue': 'linear-gradient(135deg, #60A5FA, #3B82F6)',
  'bg-gradient-sunset': 'linear-gradient(135deg, #F97316, #EC4899)',
  'bg-gradient-forest': 'linear-gradient(135deg, #10B981, #059669)',
  'bg-sparkles': 'linear-gradient(135deg, #FBBF24, #F59E0B)',
  'bg-stars': 'linear-gradient(135deg, #1E3A8A, #312E81)',
  'bg-galaxy': 'linear-gradient(135deg, #581C87, #1E1B4B)',
};

const FRAME_STYLES: Record<string, string> = {
  'frame-none': '',
  'frame-circle': 'ring-2 ring-gray-300',
  'frame-square': 'ring-2 ring-gray-300 rounded-none',
  'frame-bronze': 'ring-4 ring-amber-600',
  'frame-silver': 'ring-4 ring-gray-400',
  'frame-gold': 'ring-4 ring-yellow-400',
  'frame-diamond': 'ring-4 ring-cyan-300 shadow-lg shadow-cyan-200',
  'frame-fire': 'ring-4 ring-orange-500 shadow-lg shadow-orange-300',
  'frame-trophy': 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-300',
  'frame-champion': 'ring-4 ring-gradient-to-r from-purple-500 to-pink-500',
};

// Skin tone colors available for avatar display
// Used in getSkinHueRotation for tinting
const SKIN_TONE_HUE_ROTATIONS: Record<string, number> = {
  'skin-light': 0,
  'skin-fair': 5,
  'skin-medium': 10,
  'skin-olive': 15,
  'skin-tan': 20,
  'skin-brown': 25,
  'skin-dark': 30,
  'skin-deep': 35,
};

const HAIR_STYLE_ICONS: Record<string, string> = {
  'hair-short': '🧑',
  'hair-medium': '👩',
  'hair-long': '👩‍🦰',
  'hair-curly': '👨‍🦱',
  'hair-wavy': '🧔',
  'hair-bald': '👨‍🦲',
  'hair-mohawk': '🦅',
  'hair-braids': '🎀',
  'hair-ponytail': '🎗️',
  'hair-afro': '🌺',
  'hair-spiky': '⚡',
  'hair-royal': '👑',
};

export function AvatarDisplay({
  avatar,
  size = 'md',
  frame,
  className,
}: AvatarDisplayProps) {
  const sizeClasses = {
    sm: 'h-10 w-10 text-xl',
    md: 'h-16 w-16 text-3xl',
    lg: 'h-24 w-24 text-5xl',
    xl: 'h-32 w-32 text-6xl',
  };

  const backgroundColor = BACKGROUND_COLORS[avatar.background] || BACKGROUND_COLORS['bg-white'];
  const frameStyle = frame ? FRAME_STYLES[frame] || '' : FRAME_STYLES[avatar.frame] || '';

  // Simple avatar representation using emoji and colors
  // In a production app, this would render actual avatar graphics
  const getAvatarEmoji = () => {
    // Base on hair style
    const hairEmoji = HAIR_STYLE_ICONS[avatar.hairStyle] || '🧑';
    return hairEmoji;
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden',
        sizeClasses[size],
        frameStyle,
        className
      )}
      style={{
        background: backgroundColor.startsWith('linear-gradient') ? backgroundColor : undefined,
        backgroundColor: !backgroundColor.startsWith('linear-gradient') ? backgroundColor : undefined,
      }}
    >
      {/* Avatar representation */}
      <span
        className="select-none"
        style={{
          // Apply skin tone filter in a real implementation
          filter: `hue-rotate(${getSkinHueRotation(avatar.skinTone)}deg)`,
        }}
      >
        {getAvatarEmoji()}
      </span>

      {/* Accessory overlay */}
      {avatar.accessories.length > 0 && (
        <div className="absolute top-0 right-0 text-xs">
          {avatar.accessories.includes('acc-glasses') && '👓'}
          {avatar.accessories.includes('acc-sunglasses') && '🕶️'}
          {avatar.accessories.includes('acc-cap') && '🧢'}
          {avatar.accessories.includes('acc-crown') && '👑'}
          {avatar.accessories.includes('acc-headphones') && '🎧'}
        </div>
      )}
    </div>
  );
}

function getSkinHueRotation(skinTone: string): number {
  return SKIN_TONE_HUE_ROTATIONS[skinTone] || 0;
}
