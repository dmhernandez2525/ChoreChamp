import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  initialSeconds?: number;
  countDown?: boolean;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newSeconds?: number) => void;
  toggle: () => void;
  formattedTime: string;
  progress: number;
}

export function useTimer({
  initialSeconds = 0,
  countDown = false,
  onComplete,
  autoStart = false,
}: UseTimerOptions = {}): UseTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const totalSecondsRef = useRef(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    const resetValue = newSeconds ?? initialSeconds;
    setSeconds(resetValue);
    totalSecondsRef.current = resetValue;
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    clearTimer();
  }, [initialSeconds, clearTimer]);

  const toggle = useCallback(() => {
    if (!isRunning) {
      start();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isRunning, isPaused, start, resume, pause]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (countDown) {
            if (prev <= 1) {
              clearTimer();
              setIsComplete(true);
              setIsRunning(false);
              onComplete?.();
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return clearTimer;
  }, [isRunning, isPaused, countDown, clearTimer, onComplete]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = countDown && totalSecondsRef.current > 0
    ? ((totalSecondsRef.current - seconds) / totalSecondsRef.current) * 100
    : 0;

  return {
    seconds,
    isRunning,
    isPaused,
    isComplete,
    start,
    pause,
    resume,
    reset,
    toggle,
    formattedTime: formatTime(seconds),
    progress,
  };
}
