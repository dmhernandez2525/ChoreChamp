import type { TranslationKeys } from '../types';

export const ko: TranslationKeys = {
  // Navigation
  'nav.home': '홈',
  'nav.rewards': '보상',
  'nav.leaderboard': '리더보드',
  'nav.settings': '설정',
  'nav.store': '상점',
  'nav.chores': '집안일',
  'nav.family': '가족',
  'nav.activity': '활동',
  'nav.menu': '메뉴 열기',
  'nav.close_menu': '메뉴 닫기',

  // Common actions
  'action.save': '저장',
  'action.cancel': '취소',
  'action.delete': '삭제',
  'action.edit': '편집',
  'action.create': '만들기',
  'action.confirm': '확인',
  'action.back': '뒤로',
  'action.next': '다음',
  'action.done': '완료',
  'action.search': '검색',
  'action.filter': '필터',
  'action.sort': '정렬',
  'action.refresh': '새로고침',
  'action.sign_in': '로그인',
  'action.sign_up': '회원가입',
  'action.sign_out': '로그아웃',

  // Chores
  'chores.title': '집안일',
  'chores.add_chore': '집안일 추가',
  'chores.complete': '완료',
  'chores.skip': '건너뛰기',
  'chores.assign_to': '담당자 지정',
  'chores.due_date': '마감일',
  'chores.points': '포인트',
  'chores.recurring': '반복',
  'chores.no_chores': '아직 집안일이 없습니다',
  'chores.overdue': '기한 초과',
  'chores.today': '오늘',
  'chores.upcoming': '예정',

  // Rewards
  'rewards.title': '보상',
  'rewards.redeem': '교환',
  'rewards.cost': '비용',
  'rewards.available': '사용 가능',
  'rewards.redeemed': '교환 완료',
  'rewards.create_reward': '보상 만들기',

  // Gamification
  'gamification.points': '포인트',
  'gamification.streak': '연속 기록',
  'gamification.streak_days': '{{count}}일 연속',
  'gamification.badge_earned': '배지 획득!',
  'gamification.level_up': '레벨 업!',
  'gamification.leaderboard': '리더보드',
  'gamification.rank': '순위',

  // Family
  'family.title': '가족',
  'family.members': '구성원',
  'family.invite': '구성원 초대',
  'family.role_parent': '부모',
  'family.role_child': '어린이',
  'family.role_teen': '청소년',

  // Settings
  'settings.title': '설정',
  'settings.profile': '프로필',
  'settings.notifications': '알림',
  'settings.security': '보안',
  'settings.accessibility': '접근성',
  'settings.language': '언어',
  'settings.theme': '테마',

  // Accessibility
  'a11y.high_contrast': '고대비',
  'a11y.reduced_motion': '모션 줄이기',
  'a11y.reading_font': '읽기 글꼴',
  'a11y.font_size': '글꼴 크기',
  'a11y.focus_mode': '집중 모드',

  // Time
  'time.today': '오늘',
  'time.yesterday': '어제',
  'time.tomorrow': '내일',
  'time.days_ago': '{{count}}일 전',
  'time.just_now': '방금',

  // Errors
  'error.generic': '문제가 발생했습니다. 다시 시도해 주세요.',
  'error.network': '네트워크 오류입니다. 연결을 확인해 주세요.',
  'error.not_found': '찾을 수 없습니다.',
  'error.unauthorized': '계속하려면 로그인해 주세요.',

  // Empty states
  'empty.no_results': '결과를 찾을 수 없습니다.',
  'empty.no_data': '사용 가능한 데이터가 없습니다.',
};
