import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * SwipeToDelete — long-press (3s) then swipe left/right to delete.
 *
 * 1. User presses and holds for 3 seconds → item enters "armed" state (red glow).
 * 2. While armed, swipe left or right (> 80px) → triggers onDelete.
 * 3. Releasing before 3s resets everything.
 * 4. After arming, if user doesn't swipe within 4s, it auto-disarms.
 */
interface Props {
  onDelete: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const HOLD_DURATION = 3000; // 3 seconds to arm
const SWIPE_THRESHOLD = 80; // pixels to trigger delete
const AUTO_DISARM_MS = 4000; // auto-disarm after arming

const SwipeToDelete: React.FC<Props> = ({ onDelete, children, className = '', disabled = false }) => {
  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const [armed, setArmed] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const touchStartXRef = useRef(0);
  const isHoldingRef = useRef(false);
  const disarmTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
    if (disarmTimerRef.current) { clearTimeout(disarmTimerRef.current); disarmTimerRef.current = null; }
    isHoldingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setHoldProgress(0);
    setArmed(false);
    setOffsetX(0);
    setDeleting(false);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startHold = useCallback((clientX: number) => {
    if (disabled || armed) return;
    isHoldingRef.current = true;
    startTimeRef.current = Date.now();
    touchStartXRef.current = clientX;

    // Progress ticker — updates every 50ms
    progressIntervalRef.current = window.setInterval(() => {
      if (!isHoldingRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(pct);
    }, 50);

    // After 3s → arm
    holdTimerRef.current = window.setTimeout(() => {
      if (!isHoldingRef.current) return;
      setArmed(true);
      setHoldProgress(100);
      if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);

      // Auto-disarm after 4s if not swiped
      disarmTimerRef.current = window.setTimeout(() => {
        reset();
      }, AUTO_DISARM_MS);
    }, HOLD_DURATION);
  }, [disabled, armed, reset]);

  const endHold = useCallback(() => {
    if (!armed) {
      clearTimers();
      setHoldProgress(0);
    }
  }, [armed, clearTimers]);

  const handleMove = useCallback((clientX: number) => {
    if (armed) {
      const dx = clientX - touchStartXRef.current;
      setOffsetX(dx);
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        setDeleting(true);
        clearTimers();
        // Animate out, then call delete
        setTimeout(() => {
          onDelete();
          reset();
        }, 300);
      }
    } else if (isHoldingRef.current) {
      // If they move too much during hold, cancel
      const dx = Math.abs(clientX - touchStartXRef.current);
      if (dx > 15) {
        clearTimers();
        setHoldProgress(0);
        isHoldingRef.current = false;
      }
    }
  }, [armed, onDelete, reset, clearTimers]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    startHold(e.touches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => endHold();

  // Mouse handlers (for desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    touchStartXRef.current = e.clientX;
    startHold(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => endHold();
  const onMouseLeave = () => { if (!armed) endHold(); };

  // Border color based on state
  const borderStyle = armed
    ? 'ring-2 ring-red-400 shadow-lg shadow-red-100'
    : holdProgress > 0
    ? 'ring-1 ring-red-200/60'
    : '';

  return (
    <div className="relative overflow-hidden rounded-xl" ref={containerRef}>
      {/* Red background revealed during swipe */}
      {armed && (
        <div className="absolute inset-0 flex items-center justify-between px-6 bg-gradient-to-r from-red-500 to-red-400 rounded-xl">
          <span className="text-white text-xs font-bold">🗑️ Delete</span>
          <span className="text-white text-xs font-bold">Delete 🗑️</span>
        </div>
      )}

      {/* Main content — slides on swipe */}
      <div
        className={`relative transition-transform ${deleting ? 'duration-300' : 'duration-0'} ${borderStyle} ${className}`}
        style={{
          transform: `translateX(${deleting ? (offsetX > 0 ? 400 : -400) : offsetX}px)`,
          opacity: deleting ? 0 : 1,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {children}

        {/* Hold progress indicator — thin bottom bar */}
        {holdProgress > 0 && !armed && (
          <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-red-400 to-red-500 rounded-b-xl transition-all"
            style={{ width: `${holdProgress}%` }} />
        )}

        {/* Armed indicator — pulsing border glow */}
        {armed && !deleting && (
          <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse border-2 border-red-400/50" />
        )}
      </div>

      {/* Swipe hint when armed */}
      {armed && !deleting && (
        <div className="absolute bottom-1 left-0 right-0 text-center animate-pulse">
          <p className="text-[9px] font-bold text-red-500">← swipe to delete →</p>
        </div>
      )}
    </div>
  );
};

export default SwipeToDelete;
