"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties, type MutableRefObject, type Ref } from "react";
import {
  SIZE_DIMS,
  getThumbnailFullCardOuterSize,
  getThumbnailTextVariantOuterSize,
  type ThumbnailSize,
} from "./thumbnail-dimensions";

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
  | (BaseProps & {
      variant?: "full";
      imageSrc: string;
      imageAlt?: string;
      /**
       * `false` = collapse the label chip (orbit idle) while keeping the same image frame mounted.
       * Avoid toggling `variant` image ↔ full — that remounts `<img>` and makes idle look soft until
       * hover re-decodes at a larger layout box.
       */
      showLabelChip?: boolean;
      /**
       * `hugContent` = label row + card width grow with `shortTitle` (fixed 120px image below).
       * Default `fixed` = single outer width for sim/spread; long titles may overflow the chip in layout.
       */
      fullCardLabelWidth?: "fixed" | "hugContent";
    })
  | (BaseProps & { variant: "text" })
  | (BaseProps & { variant: "image"; imageSrc: string; imageAlt?: string });

function LabelChip({
  label,
  dims,
  labelRef,
  accessibilityLabel,
  rowWidth,
}: {
  label: string;
  dims: (typeof SIZE_DIMS)[ThumbnailSize];
  labelRef?: Ref<HTMLParagraphElement | null>;
  accessibilityLabel?: string;
  /** `hug` = width follows long labels (e.g. latest-updates strip). Default `full` = match image frame. */
  rowWidth?: "full" | "hug";
}) {
  return (
    <div
      className={`flex shrink-0 justify-center overflow-visible ${
        rowWidth === "hug" ? "w-max" : "w-full"
      }`}
    >
      <div
        className="inline-flex w-max max-w-none items-center gap-1.5 rounded-none border-b-hairline border-dotted border-ink-primary bg-[#f6f6f6] text-ink-primary"
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
          className="whitespace-nowrap font-lust-text font-medium leading-tight"
          style={{ fontSize: dims.textPx, lineHeight: `${dims.textPx + 3}px` }}
          aria-hidden
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null): void {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as MutableRefObject<T | null>).current = value;
}

/** Deterministic per-URL timing so SSR/client match and tiles don’t sync up. */
function swarmRevealTiming(key: string): { durationMs: number; delayMs: number } {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u1 = (h >>> 0) / 2 ** 32;
  const u2 = ((h ^ 0x9e3779b9) >>> 0) / 2 ** 32;
  const durationMs = 220 + Math.floor(u1 * 320);
  const delayMs = Math.floor(u2 * 220);
  return { durationMs, delayMs };
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
  const [loaded, setLoaded] = useState(false);
  const { durationMs, delayMs } = useMemo(
    () => swarmRevealTiming(imageSrc),
    [imageSrc],
  );

  const revealDelay = loaded ? delayMs : 0;
  const frameTransitionStyle: CSSProperties = {
    transitionProperty: "box-shadow",
    transitionDuration: `${durationMs}ms`,
    transitionDelay: `${revealDelay}ms`,
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
  };

  return (
    <div
      className={`fae-thumbnail-reveal relative shrink-0 overflow-hidden rounded bg-surface-canvas ${
        loaded ? "shadow-fae-thumbnail" : "shadow-none"
      }`}
      style={{ width: dims.frame, height: dims.frame, ...frameTransitionStyle }}
    >
      <Image
        ref={(node) => assignRef(imageRef, node)}
        alt={imageAlt || label}
        src={imageSrc}
        fill
        sizes={`${dims.frame}px`}
        unoptimized
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`fae-thumbnail-reveal__img pointer-events-none object-contain object-center ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
        style={{
          transitionProperty: "opacity, transform",
          transitionDuration: `${durationMs}ms`,
          transitionDelay: `${revealDelay}ms`,
          transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
        }}
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
  const fullCardLabelWidth =
    variant === "full" && "fullCardLabelWidth" in props
      ? (props.fullCardLabelWidth ?? "fixed")
      : "fixed";

  const suppressLabelChip =
    variant === "full" &&
    "showLabelChip" in props &&
    props.showLabelChip === false;

  const showLabelText = variant === "text";
  const showImage = variant === "full" || variant === "image";
  const imageSrc = "imageSrc" in props ? props.imageSrc : undefined;
  const imageAlt = "imageSrc" in props ? props.imageAlt : undefined;

  const gapStyle =
    variant === "full"
      ? { gap: suppressLabelChip ? 0 : dims.gapPx }
      : undefined;
  const textOuter =
    variant === "text" ? getThumbnailTextVariantOuterSize(size) : null;
  /** Full card: fixed outer box so label length never changes image frame size (spread/sim). */
  const fullOuter =
    variant === "full" && !suppressLabelChip
      ? getThumbnailFullCardOuterSize(size)
      : null;

  const fullCardBoxStyle: CSSProperties | undefined =
    fullOuter && fullCardLabelWidth === "hugContent"
      ? {
          width: "max-content",
          minWidth: fullOuter.width,
          maxWidth: "none",
          minHeight: fullOuter.height,
          boxSizing: "border-box",
          overflow: "visible",
        }
      : fullOuter
        ? {
            width: fullOuter.width,
            minWidth: fullOuter.width,
            maxWidth: fullOuter.width,
            minHeight: fullOuter.height,
            boxSizing: "border-box",
            overflow: "visible",
          }
        : undefined;

  return (
    <div
      className={`flex flex-col items-center min-w-0 ${className}`}
      style={{
        ...fullCardBoxStyle,
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
      {variant === "full" && (
        <div
          className={
            suppressLabelChip
              ? "h-0 overflow-hidden opacity-0 pointer-events-none"
              : undefined
          }
          aria-hidden={suppressLabelChip}
        >
          <LabelChip
            label={label}
            dims={dims}
            labelRef={labelRef}
            accessibilityLabel={accessibilityLabel}
            rowWidth={fullCardLabelWidth === "hugContent" ? "hug" : "full"}
          />
        </div>
      )}
      {showLabelText && (
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
