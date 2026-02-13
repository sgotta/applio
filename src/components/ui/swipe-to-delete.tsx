"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Trash2 } from "lucide-react";

const BUTTON_WIDTH = 72;
const DIRECTION_LOCK_THRESHOLD = 10;
const DIRECTION_RATIO = 1.2;
const VELOCITY_THRESHOLD = 0.4; // px/ms
const RUBBER_BAND_FACTOR = 0.2;
const SNAP_DURATION = 250; // ms
const MD_BREAKPOINT = 768;

const EASE_OUT = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

export function SwipeToDelete({
  children,
  onDelete,
  className,
}: SwipeToDeleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef(false);
  const directionDecided = useRef(false);

  const [offset, setOffset] = useState(0);
  const [transition, setTransition] = useState("");
  const [revealed, setRevealed] = useState(false);

  // Reset on desktop resize
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches && (offset > 0 || revealed)) {
        setOffset(0);
        setRevealed(false);
        setTransition("");
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [offset, revealed]);

  const getContainerWidth = useCallback(() => {
    return containerRef.current?.offsetWidth ?? 320;
  }, []);

  const animateTo = useCallback(
    (target: number, duration: number, easing: string) => {
      setTransition(`transform ${duration}ms ${easing}`);
      setOffset(target);
      setTimeout(() => setTransition(""), duration);
    },
    []
  );

  const reset = useCallback(() => {
    animateTo(0, SNAP_DURATION, EASE_OUT);
    setRevealed(false);
  }, [animateTo]);

  const snapToReveal = useCallback(() => {
    animateTo(BUTTON_WIDTH, SNAP_DURATION, EASE_OUT);
    setRevealed(true);
  }, [animateTo]);

  // Open confirmation dialog, then slide row back.
  // The dialog lives in the parent — row returns to normal
  // regardless of confirm/cancel.
  const requestDelete = useCallback(() => {
    onDelete();
    reset();
  }, [onDelete, reset]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (revealed) {
        reset();
        return;
      }
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      isDragging.current = false;
      isScrolling.current = false;
      directionDecided.current = false;
      setTransition("");
    },
    [revealed, reset]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (revealed || isScrolling.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = startX.current - currentX;
      const dy = Math.abs(startY.current - currentY);
      const absDx = Math.abs(dx);

      if (!directionDecided.current) {
        if (dy > DIRECTION_LOCK_THRESHOLD && dy > absDx * DIRECTION_RATIO) {
          isScrolling.current = true;
          return;
        }
        if (
          absDx > DIRECTION_LOCK_THRESHOLD &&
          absDx > dy * DIRECTION_RATIO
        ) {
          directionDecided.current = true;
          isDragging.current = true;
        }
        return;
      }

      if (dx <= 0) {
        setOffset(0);
        return;
      }

      // Rubber-band past button width
      if (dx <= BUTTON_WIDTH) {
        setOffset(dx);
      } else {
        const excess = dx - BUTTON_WIDTH;
        setOffset(BUTTON_WIDTH + excess * RUBBER_BAND_FACTOR);
      }
    },
    [revealed]
  );

  const handleTouchEnd = useCallback(() => {
    if (revealed || !isDragging.current) return;

    const elapsed = Date.now() - startTime.current;
    const velocity = offset / Math.max(elapsed, 1);
    const containerWidth = getContainerWidth();
    const commitThreshold = containerWidth * 0.4;

    // Full swipe or fast flick → open confirmation dialog
    if (
      offset >= commitThreshold ||
      (velocity > VELOCITY_THRESHOLD && offset > BUTTON_WIDTH * 0.5)
    ) {
      requestDelete();
      isDragging.current = false;
      return;
    }

    // Past half of button width → snap to reveal
    if (offset >= BUTTON_WIDTH * 0.5) {
      snapToReveal();
      isDragging.current = false;
      return;
    }

    // Below all thresholds → snap back
    reset();
    isDragging.current = false;
  }, [offset, revealed, getContainerWidth, requestDelete, snapToReveal, reset]);

  const isActive = offset > 0;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden md:overflow-visible ${className ?? ""}`}
    >
      {/* Red delete zone behind content */}
      {isActive && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 md:hidden rounded-r-sm"
          style={{ width: Math.max(offset, BUTTON_WIDTH) }}
          onClick={requestDelete}
        >
          <Trash2 className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Sliding content */}
      <div
        className="relative bg-white dark:bg-background will-change-transform"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: transition || "none",
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
