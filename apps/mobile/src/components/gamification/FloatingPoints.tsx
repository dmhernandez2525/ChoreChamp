import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface FloatingPointsProps {
  points: number;
  x: number;
  y: number;
  onComplete?: () => void;
}

export function FloatingPoints({ points, x, y, onComplete }: FloatingPointsProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Animate in
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withSequence(
      withTiming(1.3, { duration: 200, easing: Easing.out(Easing.back) }),
      withTiming(1, { duration: 100 })
    );

    // Float up
    translateY.value = withTiming(-80, {
      duration: 1200,
      easing: Easing.out(Easing.quad),
    });

    // Fade out
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        if (onComplete) {
          runOnJS(onComplete)();
        }
      });
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const isPositive = points >= 0;
  const displayText = isPositive ? `+${points}` : `${points}`;
  const color = isPositive ? '#22C55E' : '#EF4444';

  return (
    <Animated.View
      style={[
        styles.container,
        { left: x - 40, top: y - 20 },
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, { color }]}>
        {displayText}
      </Text>
      <Text style={styles.label}>pts</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    width: 80,
    zIndex: 9999,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 2,
  },
});
