import React, { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ComparisonSliderProps {
  position: number; // 0..100
  onChange: (nextPos: number) => void;
  leftLabel?: string;
  rightLabel?: string;
}

/**
 * Interactive pointer-draggable before/after divider overlay.
 * Parent positions Before and After canvases stacked in the same container
 * and uses `clipPath: inset(0 ${100 - position}% 0 0)` on the Before layer.
 */
export function ComparisonSliderOverlay({
  position,
  onChange,
  leftLabel = 'Original',
  rightLabel = 'Edited',
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    onChange(pct);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      aria-label="Before and after comparison position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(Math.max(0, position - 4));
        if (e.key === 'ArrowRight') onChange(Math.min(100, position + 4));
      }}
      className="absolute inset-0 z-20 cursor-ew-resize select-none touch-none"
    >
      <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
        {leftLabel}
      </div>
      <div className="pointer-events-none absolute top-3 right-3 rounded-md bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
        {rightLabel}
      </div>

      <div
        style={{ left: `${position}%` }}
        className="pointer-events-none absolute inset-y-0 -translate-x-1/2"
      >
        <div className="h-full w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.45)]" />
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-[#202124]/85 text-white shadow-md">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
