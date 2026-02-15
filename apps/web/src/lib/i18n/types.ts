export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'fr',
  'de',
  'pt',
  'it',
  'ja',
  'ko',
  'zh',
  'ar',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const RTL_LOCALES: readonly SupportedLocale[] = ['ar'];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  de: 'Deutsch',
  pt: 'Portugues',
  it: 'Italiano',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
};

export const LOCALE_NATIVE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  de: 'Deutsch',
  pt: 'Portugues',
  it: 'Italiano',
  ja: '\u65E5\u672C\u8A9E',
  ko: '\uD55C\uAD6D\uC5B4',
  zh: '\u4E2D\u6587',
  ar: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
};

export interface TranslationKeys {
  // Navigation
  'nav.home': string;
  'nav.rewards': string;
  'nav.leaderboard': string;
  'nav.settings': string;
  'nav.store': string;
  'nav.chores': string;
  'nav.family': string;
  'nav.activity': string;
  'nav.menu': string;
  'nav.close_menu': string;

  // Common actions
  'action.save': string;
  'action.cancel': string;
  'action.delete': string;
  'action.edit': string;
  'action.create': string;
  'action.confirm': string;
  'action.back': string;
  'action.next': string;
  'action.done': string;
  'action.search': string;
  'action.filter': string;
  'action.sort': string;
  'action.refresh': string;
  'action.sign_in': string;
  'action.sign_up': string;
  'action.sign_out': string;

  // Chores
  'chores.title': string;
  'chores.add_chore': string;
  'chores.complete': string;
  'chores.skip': string;
  'chores.assign_to': string;
  'chores.due_date': string;
  'chores.points': string;
  'chores.recurring': string;
  'chores.no_chores': string;
  'chores.overdue': string;
  'chores.today': string;
  'chores.upcoming': string;

  // Rewards
  'rewards.title': string;
  'rewards.redeem': string;
  'rewards.cost': string;
  'rewards.available': string;
  'rewards.redeemed': string;
  'rewards.create_reward': string;

  // Gamification
  'gamification.points': string;
  'gamification.streak': string;
  'gamification.streak_days': string;
  'gamification.badge_earned': string;
  'gamification.level_up': string;
  'gamification.leaderboard': string;
  'gamification.rank': string;

  // Family
  'family.title': string;
  'family.members': string;
  'family.invite': string;
  'family.role_parent': string;
  'family.role_child': string;
  'family.role_teen': string;

  // Settings
  'settings.title': string;
  'settings.profile': string;
  'settings.notifications': string;
  'settings.security': string;
  'settings.accessibility': string;
  'settings.language': string;
  'settings.theme': string;

  // Accessibility
  'a11y.high_contrast': string;
  'a11y.reduced_motion': string;
  'a11y.reading_font': string;
  'a11y.font_size': string;
  'a11y.focus_mode': string;

  // Time
  'time.today': string;
  'time.yesterday': string;
  'time.tomorrow': string;
  'time.days_ago': string;
  'time.just_now': string;

  // Errors
  'error.generic': string;
  'error.network': string;
  'error.not_found': string;
  'error.unauthorized': string;

  // Empty states
  'empty.no_results': string;
  'empty.no_data': string;
}

export type TranslationKey = keyof TranslationKeys;
