import { useEffect, useState } from 'react';

interface PointsEarnedToastProps {
  isVisible: boolean;
  points: number;
  pointsName?: string;
  onComplete?: () => void;
}

export function PointsEarnedToast({
  isVisible,
  points,
  pointsName = 'Stars',
  onComplete,
}: PointsEarnedToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setDisplayPoints(0);

      // Animate the counter
      const duration = 1000;
      const steps = 20;
      const increment = points / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayPoints(Math.min(Math.round(increment * currentStep), points));

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);

      // Hide after animation
      const hideTimer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 2500);

      return () => {
        clearInterval(interval);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, points, onComplete]);

  if (!isAnimating) return null;

  return (
    <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
      <div className="animate-points-toast flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-3 shadow-lg">
        <span className="text-2xl">⭐</span>
        <span className="text-xl font-bold text-white">
          +{displayPoints} {pointsName}
        </span>
      </div>

      {/* Floating stars effect */}
      <div className="absolute inset-0 overflow-visible">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="absolute animate-float-up text-xl"
            style={{
              left: `${20 + i * 15}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      <style>{`
        @keyframes points-toast {
          0% {
            transform: translateY(-20px) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translateY(0) scale(1.1);
            opacity: 1;
          }
          20% {
            transform: translateY(0) scale(1);
          }
          80% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-10px) scale(0.9);
            opacity: 0;
          }
        }
        .animate-points-toast {
          animation: points-toast 2.5s ease-out forwards;
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-60px) scale(0.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
