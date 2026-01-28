import { useEffect, useState } from 'react';
import { Button } from '@chorechamp/ui';
import { Confetti } from './Confetti';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  message?: string;
  showConfetti?: boolean;
  autoCloseDelay?: number;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function CelebrationModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  message,
  showConfetti = true,
  autoCloseDelay,
  primaryAction,
}: CelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Trigger entrance animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      // Auto-close if specified
      if (autoCloseDelay) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    // Wait for exit animation
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {showConfetti && <Confetti isActive={isOpen} duration={4000} pieceCount={100} />}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 ${
            isAnimating
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Icon */}
          {icon && (
            <div className="flex justify-center mb-4">
              <div className="animate-bounce-slow text-6xl">{icon}</div>
            </div>
          )}

          {/* Title */}
          <h2 className="text-center text-2xl font-bold text-gray-900">{title}</h2>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-center text-lg font-medium text-blue-600">
              {subtitle}
            </p>
          )}

          {/* Message */}
          {message && (
            <p className="mt-3 text-center text-gray-600">{message}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            {primaryAction ? (
              <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
            ) : (
              <Button onClick={handleClose}>Awesome!</Button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
