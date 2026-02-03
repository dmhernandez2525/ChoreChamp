export type ThemeId = 'classic' | 'sunrise' | 'ocean' | 'meadow' | 'berry';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    primary: string;
    background: string;
    accent: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'classic',
    name: 'Classic Blue',
    description: 'Clean and familiar with ChoreChamp blue accents.',
    preview: {
      primary: '#2563eb',
      background: '#f9fafb',
      accent: '#dbeafe',
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise Glow',
    description: 'Warm oranges and sunny highlights.',
    preview: {
      primary: '#ea580c',
      background: '#fff7ed',
      accent: '#ffedd5',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Fresh teal and airy coastal tones.',
    preview: {
      primary: '#0891b2',
      background: '#ecfeff',
      accent: '#cffafe',
    },
  },
  {
    id: 'meadow',
    name: 'Meadow Calm',
    description: 'Soft greens with grounded neutrals.',
    preview: {
      primary: '#16a34a',
      background: '#f0fdf4',
      accent: '#dcfce7',
    },
  },
  {
    id: 'berry',
    name: 'Berry Bloom',
    description: 'Gentle berry accents and playful warmth.',
    preview: {
      primary: '#db2777',
      background: '#fdf2f8',
      accent: '#fce7f3',
    },
  },
];

export function resolveThemeId(value?: string | null): ThemeId {
  const match = THEMES.find((theme) => theme.id === value);
  return match ? match.id : 'classic';
}

export function applyTheme(themeId?: string | null) {
  if (typeof document === 'undefined') return;
  const resolved = resolveThemeId(themeId);
  document.documentElement.dataset.theme = resolved;
}
