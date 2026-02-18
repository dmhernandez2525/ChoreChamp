import type { TranslationKeys } from '../types';

export const ja: TranslationKeys = {
  // Navigation
  'nav.home': 'ホーム',
  'nav.rewards': 'ごほうび',
  'nav.leaderboard': 'ランキング',
  'nav.settings': '設定',
  'nav.store': 'ストア',
  'nav.chores': 'お手伝い',
  'nav.family': '家族',
  'nav.activity': 'アクティビティ',
  'nav.menu': 'メニューを開く',
  'nav.close_menu': 'メニューを閉じる',

  // Common actions
  'action.save': '保存',
  'action.cancel': 'キャンセル',
  'action.delete': '削除',
  'action.edit': '編集',
  'action.create': '作成',
  'action.confirm': '確認',
  'action.back': '戻る',
  'action.next': '次へ',
  'action.done': '完了',
  'action.search': '検索',
  'action.filter': 'フィルター',
  'action.sort': '並べ替え',
  'action.refresh': '更新',
  'action.sign_in': 'ログイン',
  'action.sign_up': '新規登録',
  'action.sign_out': 'ログアウト',

  // Chores
  'chores.title': 'お手伝い',
  'chores.add_chore': 'お手伝いを追加',
  'chores.complete': '完了する',
  'chores.skip': 'スキップ',
  'chores.assign_to': '担当者',
  'chores.due_date': '期限',
  'chores.points': 'ポイント',
  'chores.recurring': '繰り返し',
  'chores.no_chores': 'まだお手伝いがありません',
  'chores.overdue': '期限切れ',
  'chores.today': '今日',
  'chores.upcoming': '予定',

  // Rewards
  'rewards.title': 'ごほうび',
  'rewards.redeem': '交換する',
  'rewards.cost': 'コスト',
  'rewards.available': '利用可能',
  'rewards.redeemed': '交換済み',
  'rewards.create_reward': 'ごほうびを作成',

  // Gamification
  'gamification.points': 'ポイント',
  'gamification.streak': '連続記録',
  'gamification.streak_days': '{{count}}日連続',
  'gamification.badge_earned': 'バッジ獲得！',
  'gamification.level_up': 'レベルアップ！',
  'gamification.leaderboard': 'ランキング',
  'gamification.rank': '順位',

  // Family
  'family.title': '家族',
  'family.members': 'メンバー',
  'family.invite': 'メンバーを招待',
  'family.role_parent': '親',
  'family.role_child': '子ども',
  'family.role_teen': '中高生',

  // Settings
  'settings.title': '設定',
  'settings.profile': 'プロフィール',
  'settings.notifications': '通知',
  'settings.security': 'セキュリティ',
  'settings.accessibility': 'アクセシビリティ',
  'settings.language': '言語',
  'settings.theme': 'テーマ',

  // Accessibility
  'a11y.high_contrast': 'ハイコントラスト',
  'a11y.reduced_motion': 'モーション軽減',
  'a11y.reading_font': '読みやすいフォント',
  'a11y.font_size': '文字サイズ',
  'a11y.focus_mode': '集中モード',

  // Time
  'time.today': '今日',
  'time.yesterday': '昨日',
  'time.tomorrow': '明日',
  'time.days_ago': '{{count}}日前',
  'time.just_now': 'たった今',

  // Errors
  'error.generic': '問題が発生しました。もう一度お試しください。',
  'error.network': 'ネットワークエラーです。接続を確認してください。',
  'error.not_found': '見つかりませんでした。',
  'error.unauthorized': '続行するにはログインしてください。',

  // Empty states
  'empty.no_results': '結果が見つかりませんでした。',
  'empty.no_data': 'データがありません。',
};
