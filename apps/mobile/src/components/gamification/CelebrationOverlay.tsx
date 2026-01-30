import React, { useEffect, useRef, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CelebrationType = 'confetti' | 'fireworks' | 'stars' | 'trophy';
type Intensity = 'small' | 'medium' | 'large';

interface CelebrationOverlayProps {
  visible: boolean;
  type?: CelebrationType;
  intensity?: Intensity;
  onComplete?: () => void;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  emoji?: string;
}

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#F8B500', '#7B68EE', '#FF69B4'];
const STAR_EMOJIS = ['⭐', '✨', '🌟', '💫'];
const TROPHY_EMOJIS = ['🏆', '🎉', '🎊', '🥳'];

function getParticleCount(intensity: Intensity): number {
  switch (intensity) {
    case 'small': return 15;
    case 'medium': return 30;
    case 'large': return 50;
  }
}

function createParticles(type: CelebrationType, intensity: Intensity): Particle[] {
  const count = getParticleCount(intensity);
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const particle: Particle = {
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: type === 'fireworks' ? SCREEN_HEIGHT * 0.4 : -50,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 8,
      rotation: Math.random() * 360,
    };

    if (type === 'stars') {
      particle.emoji = STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)];
    } else if (type === 'trophy') {
      particle.emoji = TROPHY_EMOJIS[Math.floor(Math.random() * TROPHY_EMOJIS.length)];
    }

    particles.push(particle);
  }

  return particles;
}

function ConfettiParticle({ particle, duration }: { particle: Particle; duration: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(particle.x);
  const rotate = useSharedValue(particle.rotation);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const targetY = SCREEN_HEIGHT + 100;
    const drift = (Math.random() - 0.5) * 200;

    translateY.value = withTiming(targetY, {
      duration: duration + Math.random() * 1000,
      easing: Easing.out(Easing.quad),
    });

    translateX.value = withTiming(particle.x + drift, {
      duration: duration,
      easing: Easing.inOut(Easing.sin),
    });

    rotate.value = withTiming(particle.rotation + 720, {
      duration: duration,
    });

    opacity.value = withDelay(
      duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (particle.emoji) {
    return (
      <Animated.Text
        style={[
          styles.particle,
          { fontSize: particle.size * 2 },
          animatedStyle,
        ]}
      >
        {particle.emoji}
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size * 2,
          backgroundColor: particle.color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function FireworkParticle({ particle, duration }: { particle: Particle; duration: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(particle.x);
  const translateY = useSharedValue(particle.y);

  useEffect(() => {
    const angle = (particle.id / getParticleCount('large')) * Math.PI * 2;
    const distance = 100 + Math.random() * 100;
    const targetX = particle.x + Math.cos(angle) * distance;
    const targetY = particle.y + Math.sin(angle) * distance;

    scale.value = withSequence(
      withTiming(1.5, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(duration * 0.6, withTiming(0, { duration: duration * 0.4 }))
    );

    translateX.value = withTiming(targetX, {
      duration: duration * 0.8,
      easing: Easing.out(Easing.quad),
    });

    translateY.value = withSequence(
      withTiming(targetY, {
        duration: duration * 0.8,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(targetY + 50, { duration: duration * 0.2 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationOverlay({
  visible,
  type = 'confetti',
  intensity = 'medium',
  onComplete,
  duration = 2500,
}: CelebrationOverlayProps) {
  const particles = useRef<Particle[]>([]);
  const containerOpacity = useSharedValue(0);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (visible) {
      particles.current = createParticles(type, intensity);
      containerOpacity.value = withTiming(1, { duration: 100 });

      // Haptic feedback
      if (intensity === 'large') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Trigger completion callback
      const timer = setTimeout(() => {
        containerOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(handleComplete)();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, type, intensity, duration, handleComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    pointerEvents: containerOpacity.value > 0 ? 'none' : 'none',
  }));

  if (!visible) return null;

  const ParticleComponent = type === 'fireworks' ? FireworkParticle : ConfettiParticle;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {particles.current.map((particle) => (
        <ParticleComponent key={particle.id} particle={particle} duration={duration} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
});
