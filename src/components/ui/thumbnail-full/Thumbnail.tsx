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

/**
 * Outer width/height for a `variant="full"` card (label chip + gap + image frame),
 * using a conservative label width so collision checks stay safe for typical titles.
 */
export function getThumbnailFullCardOuterSize(
  size: ThumbnailSize = "lg",
): { width: number; height: number } {
  const d = SIZE_DIMS[size];
  const labelH = d.labelMinH + 12; // vertical padding 6+6 on the chip row
  const labelW = d.padX * 2 + d.chipW + 6 + 9 * (d.textPx * 0.55);
  const width = Math.max(d.frame, Math.ceil(labelW));
  const height = labelH + d.gapPx + d.frame;
  return { width, height };
}

/**
 * Fixed outer box for `variant="text"` only (label chip, no frame). Same width
 * as full-card outer so filter transitions don’t reflow from `w-fit` + wrap.
 */
export function getThumbnailTextVariantOuterSize(
  size: ThumbnailSize = "lg",
): { width: number; height: number } {
  const outer = getThumbnailFullCardOuterSize(size);
  const d = SIZE_DIMS[size];
  return {
    width: outer.width,
    height: d.labelMinH + 12,
  };
}

type BaseProps = {
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Layout size; `lg` matches Figma max frame. */
  size?: ThumbnailSize;
  /** Imperative updates (e.g. scramble) — attach to the label `<p>`. */
  labelRef?: Ref<HTMLParagraphElement | null>;
  /** Imperative `src` swaps — attach to the `<img>`. */
  imageRef?: Ref<HTMLImageElement | null>;
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
  dims,
  labelRef,
  accessibilityLabel,
}: {
  label: string;
  dims: (typeof SIZE_DIMS)[ThumbnailSize];
  labelRef?: Ref<HTMLParagraphElement | null>;
  accessibilityLabel?: string;
}) {
  return (
    <div className="flex w-full shrink-0 justify-center overflow-visible">
      <div
        className="inline-flex w-max max-w-none items-center gap-1.5 rounded-xs bg-white-fae text-text-primary"
        style={{
          minHeight: dims.labelMinH,
          padding: `6px ${dims.padX}px`,
          boxSizing: "border-box",
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
          className="whitespace-nowrap font-sans font-semibold leading-tight"
          style={{ fontSize: dims.textPx, lineHeight: `${dims.textPx + 3}px` }}
          aria-hidden
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function ImageFrame({
  imageSrc,
  imageAlt,
  label,
  dims,
  imageRef,
}: {
  imageSrc: string;
  imageAlt?: string;
  label: string;
  dims: (typeof SIZE_DIMS)[ThumbnailSize];
  imageRef?: Ref<HTMLImageElement | null>;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded bg-black-fae shadow-fae-thumbnail"
      style={{ width: dims.frame, height: dims.frame }}
    >
      <img
        key={imageSrc}
        ref={imageRef}
        alt={imageAlt || label}
        src={imageSrc}
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
    labelRef,
    imageRef,
    accessibilityLabel,
  } = props;
  const variant = props.variant ?? "full";
  const dims = SIZE_DIMS[size];

  const showLabel = variant === "full" || variant === "text";
  const showImage = variant === "full" || variant === "image";
  const imageSrc = "imageSrc" in props ? props.imageSrc : undefined;
  const imageAlt = "imageSrc" in props ? props.imageAlt : undefined;

  const gapStyle = variant === "full" ? { gap: dims.gapPx } : undefined;
  const textOuter =
    variant === "text" ? getThumbnailTextVariantOuterSize(size) : null;
  /** Full card: fixed outer box so label length never changes image frame size (spread/sim). */
  const fullOuter =
    variant === "full" ? getThumbnailFullCardOuterSize(size) : null;

  return (
    <div
      className={`flex flex-col items-center min-w-0 ${className}`}
      style={{
        ...(fullOuter
          ? {
              width: fullOuter.width,
              minWidth: fullOuter.width,
              maxWidth: fullOuter.width,
              minHeight: fullOuter.height,
              boxSizing: "border-box",
              overflow: "visible",
            }
          : {}),
        ...(textOuter
          ? {
              width: textOuter.width,
              minWidth: textOuter.width,
              height: textOuter.height,
              minHeight: textOuter.height,
              boxSizing: "border-box",
              overflow: "visible",
            }
          : {}),
        ...gapStyle,
        ...style,
      }}
    >
      {showLabel && (
        <LabelChip
          label={label}
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
        />
      )}
    </div>
  );
}
