"use client";

import { useEffect, useState } from "react";

const MAX_LG_QUERY = "(max-width: 1023px)";

/** `true` when viewport is below the `lg` breakpoint (Tailwind). Starts desktop-first so SSR and hydration match. */
export function useIsMaxLg() {
  const [isMaxLg, setIsMaxLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MAX_LG_QUERY);
    const update = () => setIsMaxLg(mq.matches);

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMaxLg;
}
