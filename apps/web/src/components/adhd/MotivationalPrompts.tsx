import { useState, useEffect } from 'react';
import { cn } from '@chorechamp/ui';

const STARTING_PROMPTS = [
  "You've got this! Let's do one thing at a time.",
  "Ready to crush it? Start with step one!",
  "Small steps lead to big wins. Let's go!",
  "Focus mode: activated. You're unstoppable!",
  "Time to shine! One task, full attention.",
];

const PROGRESS_PROMPTS = [
  "Amazing progress! Keep that momentum going!",
  "You're on fire! 🔥 Keep it up!",
  "Look at you go! So close to the finish!",
  "Halfway there! You're doing great!",
  "Every step counts. You're making it happen!",
];

const COMPLETION_PROMPTS = [
  "🎉 Nailed it! You're a chore champion!",
  "✨ Incredible work! Task conquered!",
  "🏆 Victory! Another one bites the dust!",
  "💪 Done and done! You're amazing!",
  "🌟 Fantastic job! Points earned!",
];

const ENCOURAGEMENT_PROMPTS = [
  "Take a breath. You're doing better than you think.",
  "Stuck? That's okay. Try the next small step.",
  "Progress, not perfection. Keep going!",
  "It's okay to go slow. You're still moving forward.",
  "You showed up. That's already a win!",
];

type PromptType = 'starting' | 'progress' | 'completion' | 'encouragement';

interface MotivationalPromptsProps {
  type: PromptType;
  className?: string;
  autoRotate?: boolean;
  rotateInterval?: number;
}

export function MotivationalPrompts({
  type,
  className,
  autoRotate = false,
  rotateInterval = 5000,
}: MotivationalPromptsProps) {
  const prompts = {
    starting: STARTING_PROMPTS,
    progress: PROGRESS_PROMPTS,
    completion: COMPLETION_PROMPTS,
    encouragement: ENCOURAGEMENT_PROMPTS,
  }[type];

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * prompts.length)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % prompts.length);
        setIsAnimating(false);
      }, 300);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, prompts.length]);

  const bgColors = {
    starting: 'bg-blue-50 text-blue-800',
    progress: 'bg-purple-50 text-purple-800',
    completion: 'bg-green-50 text-green-800',
    encouragement: 'bg-amber-50 text-amber-800',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4 text-center transition-opacity duration-300',
        bgColors[type],
        isAnimating && 'opacity-0',
        className
      )}
    >
      <p className="font-medium">{prompts[currentIndex]}</p>
    </div>
  );
}

// Quick encouragement toast
interface EncouragementToastProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

export function EncouragementToast({
  isVisible,
  message,
  onComplete,
}: EncouragementToastProps) {
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    if (isVisible) {
      const prompts = ENCOURAGEMENT_PROMPTS;
      setDisplayMessage(
        message || prompts[Math.floor(Math.random() * prompts.length)]
      );

      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, message, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-bounce-in">
      <div className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-white shadow-lg">
        <p className="font-medium">{displayMessage}</p>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: translateX(-50%) scale(0.8) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) scale(1.05) translateY(0);
          }
          100% {
            transform: translateX(-50%) scale(1) translateY(0);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
