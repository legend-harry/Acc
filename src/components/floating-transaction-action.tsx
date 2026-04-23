'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { cn } from '@/lib/utils';

type DockSide = 'left' | 'right' | null;

const BUTTON_SIZE = 64;
const DOCK_WIDTH = 56;
const DOCK_HEIGHT = 176;
const EDGE_MARGIN = 20;
const LONG_PRESS_DELAY = 320;

export function FloatingTransactionAction() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [dockSide, setDockSide] = useState<DockSide>('right');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pressTimerRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const pointerPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const startX = Math.max(EDGE_MARGIN, window.innerWidth - BUTTON_SIZE - EDGE_MARGIN);
    const startY = Math.max(EDGE_MARGIN, window.innerHeight - BUTTON_SIZE - EDGE_MARGIN - 72);
    setPosition({ x: startX, y: startY });

    const handleResize = () => {
      setPosition((current) => ({
        x: Math.min(Math.max(EDGE_MARGIN, current.x), window.innerWidth - BUTTON_SIZE - EDGE_MARGIN),
        y: Math.min(Math.max(EDGE_MARGIN, current.y), window.innerHeight - BUTTON_SIZE - EDGE_MARGIN),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const clampPosition = (x: number, y: number) => {
    const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
    const maxY = window.innerHeight - BUTTON_SIZE - EDGE_MARGIN;
    return {
      x: Math.min(Math.max(EDGE_MARGIN, x), maxX),
      y: Math.min(Math.max(EDGE_MARGIN, y), maxY),
    };
  };

  const dockToNearestSide = (x: number, y: number) => {
    const dockToRight = x >= window.innerWidth / 2;
    setDockSide(dockToRight ? 'right' : 'left');
    setIsDocked(true);
    setPosition(clampPosition(x, y));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    suppressClickRef.current = false;

    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }

    pressTimerRef.current = window.setTimeout(() => {
      setIsDragging(true);
      suppressClickRef.current = true;
    }, LONG_PRESS_DELAY);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerPositionRef.current = { x: event.clientX, y: event.clientY };

    if (!isDragging) {
      return;
    }

    if (isDocked) {
      setIsDocked(false);
    }

    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;
    setPosition(clampPosition(nextX, nextY));

    if (
      event.clientX < 0 ||
      event.clientY < 0 ||
      event.clientX > window.innerWidth ||
      event.clientY > window.innerHeight ||
      event.clientX < 48 ||
      event.clientX > window.innerWidth - 48
    ) {
      dockToNearestSide(event.clientX, event.clientY);
    }
  };

  const finishInteraction = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    if (isDragging) {
      dockToNearestSide(pointerPositionRef.current.x, pointerPositionRef.current.y);
    }

    pointerIdRef.current = null;
    setIsDragging(false);

    if (!isDragging && !suppressClickRef.current) {
      setOpen(true);
    }

    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    setOpen(true);
  };

  const buttonStyle = isDocked
    ? dockSide === 'left'
      ? { left: `${EDGE_MARGIN}px`, bottom: '24px' }
      : { right: `${EDGE_MARGIN}px`, bottom: '24px' }
    : { left: `${position.x}px`, top: `${position.y}px` };

  return (
    <>
      <button
        type="button"
        data-no-translate
        aria-label="Add transaction"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onClick={handleClick}
        className={cn(
          'fixed z-50 select-none touch-none shadow-2xl shadow-primary/25 bg-primary text-primary-foreground transition-all duration-200 ease-out pointer-events-auto',
          isDocked
            ? 'h-44 w-14 rounded-[28px] flex flex-col items-center justify-center gap-2'
            : 'h-16 w-16 rounded-full flex items-center justify-center',
          isDragging && 'scale-105 shadow-primary/35',
        )}
        style={buttonStyle}
      >
        <Plus className={cn('h-6 w-6', isDocked && 'h-5 w-5')} />
        {isDocked && (
          <span className="writing-mode-vertical text-[10px] font-semibold tracking-[0.3em] uppercase rotate-180 [writing-mode:vertical-rl]">
            Transaction
          </span>
        )}
      </button>

      <AddExpenseDialog open={open} onOpenChange={setOpen} hideTrigger defaultType="expense">
        {null}
      </AddExpenseDialog>
    </>
  );
}
