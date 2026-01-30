import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ChoreTimerProps {
  estimatedMinutes: number;
  onTimerStart?: () => void;
  onTimerComplete?: (durationSeconds: number) => void;
  onTimerPause?: (durationSeconds: number) => void;
  startedAt?: Date | null;
}

type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export function ChoreTimer({
  estimatedMinutes,
  onTimerStart,
  onTimerComplete,
  onTimerPause,
  startedAt,
}: ChoreTimerProps) {
  const [state, setState] = useState<TimerState>(startedAt ? 'running' : 'idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const totalSeconds = estimatedMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = Math.min(1, elapsedSeconds / totalSeconds);
  const isOvertime = elapsedSeconds > totalSeconds;

  // Initialize from startedAt if provided
  useEffect(() => {
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setElapsedSeconds(elapsed);
      setState('running');
    }
  }, [startedAt]);

  // Timer interval
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev: number) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  // Pulse animation for overtime
  useEffect(() => {
    if (isOvertime && state === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOvertime, state, pulseAnim]);

  // Haptic feedback at milestones
  useEffect(() => {
    if (state === 'running') {
      if (elapsedSeconds === totalSeconds) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (remainingSeconds === 60 && !isOvertime) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [elapsedSeconds, totalSeconds, remainingSeconds, isOvertime, state]);

  const formatTime = useCallback((seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStart = () => {
    setState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTimerStart?.();
  };

  const handlePause = () => {
    setState('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTimerPause?.(elapsedSeconds);
  };

  const handleResume = () => {
    setState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = () => {
    setState('completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTimerComplete?.(elapsedSeconds);
  };

  const handleReset = () => {
    setState('idle');
    setElapsedSeconds(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getProgressColor = () => {
    if (isOvertime) return '#EF4444'; // red
    if (progress > 0.75) return '#F59E0B'; // amber
    return '#22C55E'; // green
  };

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm">
      <View className="items-center">
        {/* Timer Circle */}
        <Animated.View
          style={{ transform: [{ scale: pulseAnim }] }}
          className="relative"
        >
          {/* Background circle */}
          <View
            className="w-40 h-40 rounded-full border-8 border-gray-100 items-center justify-center"
          >
            {/* Progress arc (simplified) */}
            <View
              className="absolute inset-0 rounded-full border-8"
              style={{
                borderColor: getProgressColor(),
                opacity: progress,
              }}
            />

            {/* Time display */}
            <View className="items-center">
              <Text
                className={`text-4xl font-bold ${
                  isOvertime ? 'text-danger-600' : 'text-gray-900'
                }`}
              >
                {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsedSeconds - totalSeconds : remainingSeconds)}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {isOvertime ? 'overtime' : 'remaining'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Estimate */}
        <Text className="text-gray-500 mt-4">
          Estimated: {estimatedMinutes} min
        </Text>

        {/* Progress bar */}
        <View className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, progress * 100)}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </View>

        {/* Controls */}
        <View className="flex-row gap-3 mt-6">
          {state === 'idle' && (
            <TouchableOpacity
              className="bg-primary-500 rounded-xl px-8 py-3"
              onPress={handleStart}
            >
              <Text className="text-white font-semibold text-lg">Start Timer</Text>
            </TouchableOpacity>
          )}

          {state === 'running' && (
            <>
              <TouchableOpacity
                className="bg-gray-100 rounded-xl px-6 py-3"
                onPress={handlePause}
              >
                <Text className="text-gray-700 font-semibold">Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-success-500 rounded-xl px-6 py-3"
                onPress={handleComplete}
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'paused' && (
            <>
              <TouchableOpacity
                className="bg-primary-500 rounded-xl px-6 py-3"
                onPress={handleResume}
              >
                <Text className="text-white font-semibold">Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-100 rounded-xl px-6 py-3"
                onPress={handleReset}
              >
                <Text className="text-gray-700 font-semibold">Reset</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'completed' && (
            <View className="bg-success-100 rounded-xl px-8 py-3">
              <Text className="text-success-700 font-semibold text-lg">
                Completed in {formatTime(elapsedSeconds)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
