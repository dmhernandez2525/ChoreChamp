import { useState, useEffect, useCallback } from 'react';
import { cn } from '@chorechamp/ui';

interface DialogueLine {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'excited' | 'worried';
  animation: 'none' | 'bounce' | 'shake' | 'fade' | 'slide';
  choices: DialogueChoice[] | null;
  delay: number;
}

interface DialogueChoice {
  id: string;
  text: string;
  nextDialogueId: string | null;
  effect: {
    type: string;
    target: string;
    value: number;
  } | null;
  isCorrect: boolean | null;
}

interface DialogueBoxProps {
  lines: DialogueLine[];
  onComplete: () => void;
  onChoice?: (choiceId: string) => void;
  typingSpeed?: number;
  className?: string;
}

export function DialogueBox({
  lines,
  onComplete,
  onChoice,
  typingSpeed = 30,
  className,
}: DialogueBoxProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showChoices, setShowChoices] = useState(false);

  const currentLine = lines[currentLineIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText('');
    setIsTyping(true);
    setShowChoices(false);

    let charIndex = 0;
    const text = currentLine.text;

    const interval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);

        // Show choices if any, otherwise auto-advance after delay
        if (currentLine.choices && currentLine.choices.length > 0) {
          setShowChoices(true);
        } else if (currentLine.delay > 0) {
          setTimeout(() => handleAdvance(), currentLine.delay);
        }
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [currentLineIndex, currentLine, typingSpeed]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      // Skip typing animation
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      if (currentLine.choices && currentLine.choices.length > 0) {
        setShowChoices(true);
      }
      return;
    }

    // Don't advance if waiting for choice
    if (currentLine.choices && currentLine.choices.length > 0) {
      return;
    }

    // Advance to next line or complete
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
    } else {
      onComplete();
    }
  }, [isTyping, currentLine, currentLineIndex, lines.length, onComplete]);

  const handleChoice = (choice: DialogueChoice) => {
    if (onChoice) {
      onChoice(choice.id);
    }

    // Advance to next line or complete
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
    } else {
      onComplete();
    }
  };

  if (!currentLine) return null;

  const emotionBorderColor: Record<string, string> = {
    neutral: 'border-gray-400',
    happy: 'border-green-400',
    sad: 'border-blue-400',
    angry: 'border-red-400',
    surprised: 'border-yellow-400',
    excited: 'border-purple-400',
    worried: 'border-orange-400',
  };

  const animationClass: Record<string, string> = {
    none: '',
    bounce: 'animate-bounce',
    shake: 'animate-pulse',
    fade: 'animate-pulse',
    slide: 'animate-pulse',
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-b from-indigo-900/95 to-purple-900/95 rounded-2xl p-6 shadow-2xl border-2',
        emotionBorderColor[currentLine.emotion],
        className
      )}
      onClick={handleAdvance}
    >
      {/* Character info */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full overflow-hidden border-4',
            emotionBorderColor[currentLine.emotion],
            animationClass[currentLine.animation]
          )}
        >
          {currentLine.characterAvatar ? (
            <img
              src={currentLine.characterAvatar}
              alt={currentLine.characterName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
              {currentLine.characterName.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{currentLine.characterName}</h3>
          <span className="text-sm text-white/60 capitalize">{currentLine.emotion}</span>
        </div>
      </div>

      {/* Dialogue text */}
      <div className="bg-white/10 rounded-xl p-4 min-h-[100px] mb-4">
        <p className="text-white text-lg leading-relaxed">
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>

      {/* Choices or continue prompt */}
      {showChoices && currentLine.choices && currentLine.choices.length > 0 ? (
        <div className="space-y-2">
          {currentLine.choices.map((choice, index) => (
            <button
              key={choice.id}
              onClick={(e) => {
                e.stopPropagation();
                handleChoice(choice);
              }}
              className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-left transition-colors border border-white/20 hover:border-white/40"
            >
              <span className="text-white/60 mr-2">{index + 1}.</span>
              {choice.text}
              {choice.effect && choice.effect.type === 'add_points' && (
                <span className="float-right text-yellow-400">+{choice.effect.value} pts</span>
              )}
            </button>
          ))}
        </div>
      ) : !isTyping && (
        <div className="text-center text-white/50 text-sm">
          {currentLineIndex < lines.length - 1 ? 'Click to continue...' : 'Click to finish'}
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex justify-center gap-1 mt-4">
        {lines.map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index === currentLineIndex ? 'bg-white' : index < currentLineIndex ? 'bg-white/50' : 'bg-white/20'
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface DialogueModalProps {
  isOpen: boolean;
  lines: DialogueLine[];
  onClose: () => void;
  onChoice?: (choiceId: string) => void;
}

export function DialogueModal({
  isOpen,
  lines,
  onClose,
  onChoice,
}: DialogueModalProps) {
  if (!isOpen || lines.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60">
      <div className="w-full max-w-3xl mb-8">
        <DialogueBox
          lines={lines}
          onComplete={onClose}
          onChoice={onChoice}
        />
      </div>
    </div>
  );
}
