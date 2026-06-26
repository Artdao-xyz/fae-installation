import { useEffect, useState } from "react";

export const INSTALLATION_OVERLAY_TRANSITION_MS = 200;

export const FULL_SCREEN_SHELL_TRANSITION_MS = 700;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type OverlayTransitionOptions = {
  durationMs?: number;
  /** Skip fade-in when replacing another overlay — avoids flashing content behind. */
  skipEnterTransition?: boolean;
};

/** Fade in on open and fade out before unmount — enables crossfade between screens. */
export function useInstallationOverlayTransition(
  open: boolean,
  {
    durationMs = INSTALLATION_OVERLAY_TRANSITION_MS,
    skipEnterTransition = false,
  }: OverlayTransitionOptions = {},
) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(
    () => open && (skipEnterTransition || prefersReducedMotion()),
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const mountRaf = requestAnimationFrame(() => {
      if (cancelled) return;
      setMounted(true);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(mountRaf);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      let cancelled = false;
      const exitRaf = requestAnimationFrame(() => {
        if (cancelled) return;
        setEntered(false);
      });
      const exitTimer = window.setTimeout(() => {
        if (!cancelled) setMounted(false);
      }, durationMs);

      return () => {
        cancelled = true;
        cancelAnimationFrame(exitRaf);
        window.clearTimeout(exitTimer);
      };
    }

    if (!mounted) return;

    let cancelled = false;
    if (skipEnterTransition || prefersReducedMotion()) {
      const enterRaf = requestAnimationFrame(() => {
        if (!cancelled) setEntered(true);
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(enterRaf);
      };
    }

    const startRaf = requestAnimationFrame(() => {
      if (cancelled) return;
      setEntered(false);
      requestAnimationFrame(() => {
        if (!cancelled) setEntered(true);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(startRaf);
    };
  }, [open, mounted, durationMs, skipEnterTransition]);

  return { mounted, entered };
}
