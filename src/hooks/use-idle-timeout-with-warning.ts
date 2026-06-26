"use client";

import { useEffect, useRef, useState } from "react";

type IdleTimeoutWithWarningResult = {
  warningActive: boolean;
  secondsRemaining: number;
};

/**
 * Fires `onWarning` then `onIdle` after inactivity. Resets on pointer/keyboard activity.
 */
export function useIdleTimeoutWithWarning(
  timeoutMs: number,
  warningBeforeMs: number,
  onIdle: () => void,
  enabled: boolean,
): IdleTimeoutWithWarningResult {
  const onIdleRef = useRef(onIdle);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);
  const [warningActive, setWarningActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      idleTimerRef.current = null;
      warningTimerRef.current = null;
      deadlineRef.current = null;
      queueMicrotask(() => {
        setWarningActive(false);
        setSecondsRemaining(0);
      });
      return;
    }

    const clearTimers = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      idleTimerRef.current = null;
      warningTimerRef.current = null;
    };

    const schedule = () => {
      clearTimers();
      deadlineRef.current = null;
      queueMicrotask(() => {
        setWarningActive(false);
        setSecondsRemaining(0);
      });

      const warningLead = Math.min(
        Math.max(0, warningBeforeMs),
        Math.max(0, timeoutMs - 1_000),
      );
      const warningAt = timeoutMs - warningLead;

      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        deadlineRef.current = null;
        setWarningActive(false);
        setSecondsRemaining(0);
        onIdleRef.current();
      }, timeoutMs);

      if (warningLead > 0) {
        warningTimerRef.current = setTimeout(() => {
          warningTimerRef.current = null;
          deadlineRef.current = Date.now() + warningLead;
          setWarningActive(true);
          setSecondsRemaining(Math.ceil(warningLead / 1000));
        }, warningAt);
      }
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
      clearTimers();
      window.removeEventListener("pointerdown", onActivity, opts);
      window.removeEventListener("pointermove", onActivity, opts);
      window.removeEventListener("keydown", onActivity, opts);
      window.removeEventListener("touchstart", onActivity, opts);
      window.removeEventListener("wheel", onActivity, opts);
    };
  }, [enabled, timeoutMs, warningBeforeMs]);

  useEffect(() => {
    if (!warningActive || !enabled) return;

    const tick = () => {
      const deadline = deadlineRef.current;
      if (!deadline) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) setWarningActive(false);
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [warningActive, enabled]);

  return { warningActive, secondsRemaining };
}
