"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

type Props = {
  slides: readonly string[];
  alt: string;
  className?: string;
};

const SHELL =
  "relative block min-w-0 shrink-0 overflow-hidden rounded-[3.677px] bg-surface-canvas";

type SlideProps = {
  src: string;
  alt: string;
  variant?: "default" | "heroSplit";
};

/**
 * Fixed-height box + `fill` + `object-contain` so space is reserved before decode
 * (avoids CLS from swapping a guessed placeholder for measured intrinsic layout).
 */
function CarouselImageSlide({
  src,
  alt,
  variant = "default",
}: SlideProps) {
  const isAnimatedGif = /\.gif(?:[?#]|$)/i.test(src);

  const wrapperClass =
    variant === "heroSplit"
      ? "relative h-[280px] w-full min-w-0"
      : "relative h-[280px] w-full max-w-[362px] min-w-0";

  const sizes =
    variant === "heroSplit"
      ? "(min-width: 1024px) 480px, 60vw"
      : "(min-width: 0) min(100vw, 362px)";

  return (
    <div className={wrapperClass}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={isAnimatedGif}
        className="pointer-events-none object-contain object-center lg:object-left"
      />
    </div>
  );
}

const thumbNavButtonClass =
  "flex h-8 w-7 shrink-0 items-center justify-center rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:outline-none motion-reduce:transition-none";

function CarouselNavArrow({
  direction,
  label,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={thumbNavButtonClass}
      aria-label={label}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small SVG asset */}
      <img
        src="/svg/blue-arrow.svg"
        alt=""
        className={`h-[14px] w-[10px] shrink-0 object-contain ${
          direction === "prev" ? "rotate-180" : ""
        }`}
        aria-hidden
      />
    </button>
  );
}

type ThumbnailProps = {
  src: string;
  selected: boolean;
  indexOneBased: number;
  onSelect: () => void;
};

function CarouselThumbnail({
  src,
  selected,
  indexOneBased,
  onSelect,
}: ThumbnailProps) {
  const isAnimatedGif = /\.gif(?:[?#]|$)/i.test(src);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Show image ${indexOneBased}`}
      aria-current={selected ? "true" : undefined}
      className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-md outline-none transition-opacity motion-reduce:transition-none focus-visible:outline-none ${
        selected ? "opacity-100" : "opacity-[0.52] hover:opacity-[0.85]"
      }`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="36px"
        unoptimized={isAnimatedGif}
        className="object-cover"
      />
    </button>
  );
}

/**
 * Gallery carousel for Strapi `Image` in content preview: on large screens,
 * hero on the left and thumbnails + arrows on the right; on small screens,
 * thumbnails row stacks below the hero. Remount with `key` from the parent
 * when `slides` change so the index resets.
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

  if (n === 1) {
    return (
      <div
        className={`${SHELL} mx-auto w-full max-w-[362px] ${className}`.trim()}
        role="region"
        aria-roledescription="carousel"
        aria-label={alt}
      >
        <CarouselImageSlide key={src} src={src} alt={altText} />
      </div>
    );
  }

  return (
    <div
      className={`flex w-full min-w-0 flex-col items-center gap-2 lg:flex-row lg:items-end lg:justify-center ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <div className="relative flex min-h-0 w-full min-w-0 items-center justify-center overflow-hidden rounded-[3.677px] bg-surface-canvas max-lg:max-w-[362px] lg:flex-1 lg:justify-start ">
        <CarouselImageSlide
          key={`${index}-${src}`}
          src={src}
          alt={altText}
          variant="heroSplit"
        />
      </div>
      <div className="flex min-h-0 w-full min-w-0 flex-col items-center lg:flex-1">
        <div
          className="flex w-auto max-w-full items-center gap-0.5"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">
            Image {index + 1} of {n}
          </span>
          <CarouselNavArrow
            direction="prev"
            label="Previous image"
            onClick={() => go(-1)}
          />
          <div className="flex max-h-11 max-w-[min(11rem,70vw)] shrink justify-center gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin] lg:max-w-[min(11rem,42vw)]">
            {slides.map((thumbSrc, i) => (
              <CarouselThumbnail
                key={`${thumbSrc}-${i}`}
                src={thumbSrc}
                selected={i === index}
                indexOneBased={i + 1}
                onSelect={() => setIndex(i)}
              />
            ))}
          </div>
          <CarouselNavArrow
            direction="next"
            label="Next image"
            onClick={() => go(1)}
          />
        </div>
      </div>
    </div>
  );
}
