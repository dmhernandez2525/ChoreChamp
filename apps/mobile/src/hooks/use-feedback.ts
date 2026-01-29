import { useCallback } from 'react';
import { AppHaptics } from '../services/haptics';
import { AppSounds } from '../services/sounds';

/**
 * Combined feedback type
 */
export type FeedbackType =
  | 'choreComplete'
  | 'rewardRedeemed'
  | 'pointsEarned'
  | 'streakAchieved'
  | 'levelUp'
  | 'buttonPress'
  | 'selection'
  | 'success'
  | 'error'
  | 'warning'
  | 'swipe'
  | 'pullRefresh'
  | 'modalOpen'
  | 'modalClose'
  | 'tap';

/**
 * Hook for triggering combined haptic + sound feedback
 */
export function useFeedback() {
  const trigger = useCallback(async (type: FeedbackType) => {
    // Trigger both haptic and sound feedback in parallel
    switch (type) {
      case 'choreComplete':
        await Promise.all([
          AppHaptics.choreComplete(),
          AppSounds.choreComplete(),
        ]);
        break;

      case 'rewardRedeemed':
        await Promise.all([
          AppHaptics.rewardRedeemed(),
          AppSounds.rewardRedeemed(),
        ]);
        break;

      case 'pointsEarned':
        await Promise.all([
          AppHaptics.lightTap(),
          AppSounds.pointsEarned(),
        ]);
        break;

      case 'streakAchieved':
        await Promise.all([
          AppHaptics.heavyTap(),
          AppSounds.streakAchieved(),
        ]);
        break;

      case 'levelUp':
        await Promise.all([
          AppHaptics.heavyTap(),
          AppSounds.levelUp(),
        ]);
        break;

      case 'buttonPress':
        await Promise.all([
          AppHaptics.buttonPress(),
          AppSounds.tap(),
        ]);
        break;

      case 'selection':
        await Promise.all([
          AppHaptics.selection(),
          AppSounds.tap(),
        ]);
        break;

      case 'success':
        await Promise.all([
          AppHaptics.choreComplete(),
          AppSounds.success(),
        ]);
        break;

      case 'error':
        await Promise.all([
          AppHaptics.error(),
          AppSounds.error(),
        ]);
        break;

      case 'warning':
        await Promise.all([
          AppHaptics.warning(),
          AppSounds.notification(),
        ]);
        break;

      case 'swipe':
        await AppHaptics.swipeAction();
        break;

      case 'pullRefresh':
        await AppHaptics.pullRefresh();
        break;

      case 'modalOpen':
        await Promise.all([
          AppHaptics.modalOpen(),
          AppSounds.transition(),
        ]);
        break;

      case 'modalClose':
        await Promise.all([
          AppHaptics.modalClose(),
          AppSounds.transition(),
        ]);
        break;

      case 'tap':
        await Promise.all([
          AppHaptics.lightTap(),
          AppSounds.tap(),
        ]);
        break;
    }
  }, []);

  // Convenience methods
  return {
    trigger,
    choreComplete: useCallback(() => trigger('choreComplete'), [trigger]),
    rewardRedeemed: useCallback(() => trigger('rewardRedeemed'), [trigger]),
    pointsEarned: useCallback(() => trigger('pointsEarned'), [trigger]),
    streakAchieved: useCallback(() => trigger('streakAchieved'), [trigger]),
    levelUp: useCallback(() => trigger('levelUp'), [trigger]),
    buttonPress: useCallback(() => trigger('buttonPress'), [trigger]),
    selection: useCallback(() => trigger('selection'), [trigger]),
    success: useCallback(() => trigger('success'), [trigger]),
    error: useCallback(() => trigger('error'), [trigger]),
    warning: useCallback(() => trigger('warning'), [trigger]),
    swipe: useCallback(() => trigger('swipe'), [trigger]),
    pullRefresh: useCallback(() => trigger('pullRefresh'), [trigger]),
    modalOpen: useCallback(() => trigger('modalOpen'), [trigger]),
    modalClose: useCallback(() => trigger('modalClose'), [trigger]),
    tap: useCallback(() => trigger('tap'), [trigger]),
  };
}
