import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@chorechamp/ui';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const SNAP_POINTS = {
  collapsed: 0.3,
  half: 0.5,
  full: 0.92,
};

const VELOCITY_THRESHOLD = 0.5;
const DISMISS_THRESHOLD = 0.15;

export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS.half);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setSheetHeight(SNAP_POINTS.half);
      });
    } else {
      setSheetHeight(0);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const snapToNearest = useCallback(
    (currentHeight: number, currentVelocity: number) => {
      if (currentHeight < DISMISS_THRESHOLD || currentVelocity < -VELOCITY_THRESHOLD) {
        onClose();
        return;
      }

      const points = Object.values(SNAP_POINTS);

      // If flicking upward, snap to the next higher point
      if (currentVelocity > VELOCITY_THRESHOLD) {
        const higher = points.find((p) => p > currentHeight);
        setSheetHeight(higher ?? SNAP_POINTS.full);
        return;
      }

      // If flicking downward, snap to the next lower point
      if (currentVelocity < -VELOCITY_THRESHOLD) {
        const lower = [...points].reverse().find((p) => p < currentHeight);
        if (lower) {
          setSheetHeight(lower);
        } else {
          onClose();
        }
        return;
      }

      // Otherwise snap to the closest point
      let closest = points[0];
      let minDist = Math.abs(currentHeight - points[0]);
      for (const p of points) {
        const dist = Math.abs(currentHeight - p);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
      setSheetHeight(closest);
    },
    [onClose],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      dragStartY.current = e.touches[0].clientY;
      dragStartHeight.current = sheetHeight;
      lastY.current = e.touches[0].clientY;
      lastTime.current = Date.now();
      velocity.current = 0;
    },
    [sheetHeight],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const currentY = e.touches[0].clientY;
      const windowHeight = window.innerHeight;
      const deltaY = dragStartY.current - currentY;
      const deltaRatio = deltaY / windowHeight;
      const newHeight = Math.max(0, Math.min(1, dragStartHeight.current + deltaRatio));

      // Track velocity
      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = ((lastY.current - currentY) / windowHeight) / (dt / 1000);
      }
      lastY.current = currentY;
      lastTime.current = now;

      setSheetHeight(newHeight);
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearest(sheetHeight, velocity.current);
  }, [isDragging, sheetHeight, snapToNearest]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-300',
          open && sheetHeight > 0 ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl',
          !isDragging && 'transition-transform duration-300 ease-out',
        )}
        style={{
          transform: `translateY(${(1 - sheetHeight) * 100}%)`,
          height: '92vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Bottom sheet'}
      >
        {/* Drag handle */}
        <div
          className="flex cursor-grab items-center justify-center pb-2 pt-3 active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain px-4 py-3" style={{ maxHeight: 'calc(92vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
