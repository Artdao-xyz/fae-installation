"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onIdle` after `timeoutMs` without qualifying user activity.
 * Activity: pointer down/move, key down, touch start, scroll.
 */
export function useIdleTimeout(
  timeoutMs: number,
  onIdle: () => void,
  enabled: boolean,
): void {
  const onIdleRef = useRef(onIdle);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onIdleRef.current();
      }, timeoutMs);
    };

    const onActivity = (event: Event) => {
      if (event.type === "pointermove" && event instanceof PointerEvent) {
        const prev = lastMoveRef.current;
        lastMoveRef.current = { x: event.clientX, y: event.clientY };
        if (prev) {
          const dx = event.clientX - prev.x;
          const dy = event.clientY - prev.y;
          if (dx * dx + dy * dy < 1) return;
        }
      }
      schedule();
    };

    schedule();

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener("pointerdown", onActivity, opts);
    window.addEventListener("pointermove", onActivity, opts);
    window.addEventListener("keydown", onActivity, opts);
    window.addEventListener("touchstart", onActivity, opts);
    window.addEventListener("wheel", onActivity, opts);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      window.removeEventListener("pointerdown", onActivity, opts);
      window.removeEventListener("pointermove", onActivity, opts);
      window.removeEventListener("keydown", onActivity, opts);
      window.removeEventListener("touchstart", onActivity, opts);
      window.removeEventListener("wheel", onActivity, opts);
    };
  }, [enabled, timeoutMs]);
}
