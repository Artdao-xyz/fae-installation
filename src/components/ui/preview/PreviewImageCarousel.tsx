"use client";

import { useCallback, useState } from "react";

type Props = {
  slides: readonly string[];
  alt: string;
  className?: string;
};

/**
 * Minimal carousel for Strapi `Image` gallery in content preview.
 * Remount with `key` from the parent when `slides` change so the index resets.
 */
export function PreviewImageCarousel({ slides, alt, className = "" }: Props) {
  const n = slides.length;
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 1) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  if (n === 0) return null;

  const src = slides[index]!;

  return (
    <div
      className={`relative flex size-[180px] shrink-0 flex-col overflow-hidden rounded-[3.677px] bg-surface-canvas ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${alt}${n > 1 ? ` (${index + 1} of ${n})` : ""}`}
        className="pointer-events-none max-h-[180px] min-h-0 w-full flex-1 object-contain object-top"
      />
      {n > 1 ? (
        <>
          <div
            className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1 rounded-sm bg-black-fae/50 px-1.5 py-0.5 font-fira-mono text-[10px] leading-none text-white tabular-nums backdrop-blur-sm"
            aria-live="polite"
          >
            {index + 1} / {n}
          </div>
          <button
            type="button"
            className="absolute left-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm border-hairline border-ink-primary/30 bg-surface-canvas/95 text-xs text-ink-body shadow-sm backdrop-blur-sm hover:bg-surface-hover/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
            aria-label="Previous image"
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm border-hairline border-ink-primary/30 bg-surface-canvas/95 text-xs text-ink-body shadow-sm backdrop-blur-sm hover:bg-surface-hover/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
            aria-label="Next image"
            onClick={() => go(1)}
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}
