import type { CSSProperties, Ref } from "react";

const SIZE_DIMS = {
  sm: { frame: 75, labelMinH: 24, textPx: 11, gapPx: 5, chipW: 2.5, chipH: 10, padX: 10 },
  md: { frame: 120, labelMinH: 28, textPx: 12, gapPx: 6, chipW: 3, chipH: 12, padX: 12 },
  lg: { frame: 156, labelMinH: 28, textPx: 12, gapPx: 6, chipW: 3, chipH: 12, padX: 12 },
} as const;

export type ThumbnailSize = keyof typeof SIZE_DIMS;

export function getThumbnailFramePx(size: ThumbnailSize = "lg"): number {
  return SIZE_DIMS[size].frame;
}

type BaseProps = {
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Layout size; `lg` matches Figma max frame. */
  size?: ThumbnailSize;
  /**
   * Label chip palette. Omitted = Figma default (white chip + primary text).
   * `light` / `dark` match the former particle text chips.
   */
  chipTone?: "light" | "dark";
  /** Imperative updates (e.g. scramble) — attach to the label `<p>`. */
  labelRef?: Ref<HTMLParagraphElement | null>;
  /** Imperative `src` swaps — attach to the `<img>`. */
  imageRef?: Ref<HTMLImageElement | null>;
  /** Decoded dimensions for `<img>` (optional). */
  imageWidth?: number;
  imageHeight?: number;
  /**
   * When the visible label may differ (e.g. scrambled), screen readers use this stable phrase.
   * The `<p>` is `aria-hidden` so gibberish is not read aloud.
   */
  accessibilityLabel?: string;
};

export type ThumbnailProps =
  | (BaseProps & { variant?: "full"; imageSrc: string; imageAlt?: string })
  | (BaseProps & { variant: "text" })
  | (BaseProps & { variant: "image"; imageSrc: string; imageAlt?: string });

function LabelChip({
  label,
  chipTone,
  dims,
  labelRef,
  accessibilityLabel,
}: {
  label: string;
  chipTone: "light" | "dark" | undefined;
  dims: (typeof SIZE_DIMS)[ThumbnailSize];
  labelRef?: Ref<HTMLParagraphElement | null>;
  accessibilityLabel?: string;
}) {
  const tone =
    chipTone === "light"
      ? "bg-white-fae text-text-primary "
      : chipTone === "dark"
        ? "bg-black-fae text-white-fae"
        : "bg-white-fae text-text-primary";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xs ${tone}`}
      style={{
        minHeight: dims.labelMinH,
        padding: `6px ${dims.padX}px`,
      }}
      role="group"
      aria-label={accessibilityLabel ?? label}
    >
      <span
        className="shrink-0 rounded-[1px] bg-blue-600"
        style={{ width: dims.chipW, height: dims.chipH }}
        aria-hidden
      />
      <p
        ref={labelRef}
        className="truncate font-sans font-semibold leading-tight"
        style={{ fontSize: dims.textPx, lineHeight: `${dims.textPx + 3}px` }}
        aria-hidden
      >
        {label}
      </p>
    </div>
  );
}

function ImageFrame({
  imageSrc,
  imageAlt,
  label,
  dims,
  imageRef,
  imageWidth,
  imageHeight,
}: {
  imageSrc: string;
  imageAlt?: string;
  label: string;
  dims: (typeof SIZE_DIMS)[ThumbnailSize];
  imageRef?: Ref<HTMLImageElement | null>;
  imageWidth?: number;
  imageHeight?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded bg-black-fae shadow-fae-thumbnail"
      style={{ width: dims.frame, height: dims.frame }}
    >
      <img
        ref={imageRef}
        alt={imageAlt || label}
        src={imageSrc}
        width={imageWidth}
        height={imageHeight}
        className="pointer-events-none absolute inset-0 size-full object-cover"
        draggable={false}
      />
    </div>
  );
}

/**
 * Label chip and/or image frame for static layouts or the particle sim.
 * Root is unpositioned unless you pass `className` / `style` (parent owns motion).
 */
export function Thumbnail(props: ThumbnailProps) {
  const {
    label = "Fairclouds",
    className = "",
    style,
    size = "lg",
    chipTone,
    labelRef,
    imageRef,
    imageWidth,
    imageHeight,
    accessibilityLabel,
  } = props;
  const variant = props.variant ?? "full";
  const dims = SIZE_DIMS[size];

  const showLabel = variant === "full" || variant === "text";
  const showImage = variant === "full" || variant === "image";
  const imageSrc = "imageSrc" in props ? props.imageSrc : undefined;
  const imageAlt = "imageSrc" in props ? props.imageAlt : undefined;

  const gapStyle = variant === "full" ? { gap: dims.gapPx } : undefined;

  return (
    <div
      className={`flex w-fit flex-col items-center ${className}`}
      style={{ ...gapStyle, ...style }}
    >
      {showLabel && (
        <LabelChip
          label={label}
          chipTone={chipTone}
          dims={dims}
          labelRef={labelRef}
          accessibilityLabel={accessibilityLabel}
        />
      )}
      {showImage && imageSrc !== undefined && (
        <ImageFrame
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          label={label}
          dims={dims}
          imageRef={imageRef}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
        />
      )}
    </div>
  );
}
