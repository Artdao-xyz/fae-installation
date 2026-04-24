"use client";

import { useSyncExternalStore } from "react";

function subscribeMaxLg(onChange: () => void) {
  const mq = window.matchMedia("(max-width: 1023px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMaxLgSnapshot() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

/** Desktop-first SSR snapshot; client corrects after hydration. */
function getMaxLgServerSnapshot() {
  return false;
}

/** `true` when viewport is below the `lg` breakpoint (Tailwind). */
export function useIsMaxLg() {
  return useSyncExternalStore(
    subscribeMaxLg,
    getMaxLgSnapshot,
    getMaxLgServerSnapshot,
  );
}
