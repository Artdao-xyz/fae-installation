"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useState } from "react";

type Props = {
  slides: readonly string[];
  alt: string;
  className?: string;
};

type ImageShape = "landscape" | "portrait" | "square";

function shapeFromDimensions(w: number, h: number): ImageShape {
  if (w <= 0 || h <= 0) return "square";
  if (w > h) return "landscape";
  if (h > w) return "portrait";
  return "square";
}

const SHELL =
  "relative inline-block min-w-0 shrink-0 overflow-hidden rounded-[3.677px] bg-surface-canvas";

function shellClass(shape: ImageShape | null): string {
  if (shape === "landscape") {
    return `${SHELL} max-w-[362px]`;
  }
  if (shape === "portrait") {
    return `${SHELL} max-h-[250px] max-w-[362px]`;
  }
  if (shape === "square") {
    return `${SHELL} max-h-[280px] max-w-[280px]`;
  }
  /* Loading: stay within the largest allowed box until natural size is known */
  return `${SHELL} max-h-[362px] max-w-[362px]`;
}

function imageClass(shape: ImageShape | null): string {
  const base = "pointer-events-none block h-auto w-auto object-contain";
  if (shape === "landscape") {
    return `${base} max-w-[362px]`;
  }
  if (shape === "portrait") {
    return `${base} max-h-[250px] max-w-full`;
  }
  if (shape === "square") {
    return `${base} max-h-[280px] max-w-[280px]`;
  }
  return `${base} max-h-[362px] max-w-[362px]`;
}

type SlideProps = {
  src: string;
  alt: string;
};

/**
 * `next/image` with `width` / `height` (intrinsic pixels) keeps layout ratio and
 * reduces CLS. Decoded in `useLayoutEffect`; `onload` is deferred so state
 * updates are not synchronous with the effect body (eslint).
 * Remount with `key` when the slide changes so `measured` is fresh without
 * reset `setState` in an effect.
 */
function CarouselImageSlide({ src, alt }: SlideProps) {
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const img = new window.Image();
    const apply = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setMeasured({ w: img.naturalWidth, h: img.naturalHeight });
      } else {
        setMeasured({ w: 362, h: 200 });
      }
    };
    const onErr = () => setMeasured({ w: 362, h: 200 });
    img.onload = () => queueMicrotask(apply);
    img.onerror = () => queueMicrotask(onErr);
    img.src = src;
    if (img.complete) queueMicrotask(apply);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  const shape: ImageShape | null = measured
    ? shapeFromDimensions(measured.w, measured.h)
    : null;
  const showPlaceholder = !measured;

  return (
    <>
      {showPlaceholder ? (
        <div
          className="block aspect-4/3 w-full max-w-[362px] max-h-[362px] bg-surface-canvas"
          aria-hidden
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={measured.w}
          height={measured.h}
          sizes="(min-width: 0) min(100vw, 362px)"
          unoptimized
          className={imageClass(shape)}
        />
      )}
    </>
  );
}

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

  const src = n > 0 ? slides[index]! : null;
  if (n === 0 || src === null) return null;

  const altText = `${alt}${n > 1 ? ` (${index + 1} of ${n})` : ""}`;

  return (
    <div
      className={`${shellClass(null)} ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <CarouselImageSlide
        key={`${index}-${src}`}
        src={src}
        alt={altText}
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
