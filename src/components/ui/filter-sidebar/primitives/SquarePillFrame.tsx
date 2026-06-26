import type { ReactNode } from "react";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  filterPillLabelBoxClass,
  filterPillSelection,
  interactiveChromeMatClass,
} from "./filterFramedClasses";
import {
  toneAccentClass,
  toneSelectedBorderClass,
} from "../config/filterSidebarTones";

/**
 * Corner markers: 2×2 SVG rects, `crispEdges`, ±1px placement (even size → whole-pixel centering).
 * Same CSS size on every display; scaling by `devicePixelRatio` made external monitors look too big.
 */
const SQUARE_MARKER_SIZE = 2;
const SQUARE_CORNER_POSITIONS = [
  "left-0 top-0 -translate-x-px -translate-y-px",
  "right-0 top-0 translate-x-px -translate-y-px",
  "left-0 bottom-0 -translate-x-px translate-y-px",
  "right-0 bottom-0 translate-x-px translate-y-px",
] as const;

function SquareCornerMarkers({
  selected,
  tone,
}: {
  selected: boolean;
  tone?: FilterSidebarCategoryTone;
}) {
  const n = SQUARE_MARKER_SIZE;
  return (
    <>
      {SQUARE_CORNER_POSITIONS.map((positionClass, i) => (
        <svg
          key={i}
          width={n}
          height={n}
          viewBox={`0 0 ${n} ${n}`}
          shapeRendering="crispEdges"
          className={`pointer-events-none absolute z-0 block shrink-0 ${positionClass} ${
            selected
              ? tone
                ? toneAccentClass[tone].marker
                : filterPillSelection.text
              : "text-ink-primary"
          }`}
          aria-hidden
        >
          <rect width={n} height={n} x={0} y={0} fill="currentColor" />
        </svg>
      ))}
    </>
  );
}

type SquarePillFrameProps = {
  children: ReactNode;
  selected?: boolean;
  tone?: FilterSidebarCategoryTone;
  className?: string;
  labelClassName?: string;
};

export function SquarePillFrame({
  children,
  selected = false,
  tone,
  className = "",
  labelClassName = "",
}: SquarePillFrameProps) {
  const cellBorder = selected
    ? `${interactiveChromeMatClass} ${
        tone ? toneAccentClass[tone].marker : filterPillSelection.text
      } [border-width:var(--border-width-thin)] border-solid ${
        tone ? toneSelectedBorderClass[tone] : filterPillSelection.border
      }`
    : `${interactiveChromeMatClass} [border-width:var(--border-width-thin)] border-solid border-ink-primary text-ink-primary`;

  return (
    <span
      className={`relative isolate inline-flex items-center justify-center ${className}`}
    >
      <SquareCornerMarkers selected={selected} tone={tone} />
      <span
        className={`relative z-10 box-border inline-flex items-center justify-center ${filterPillLabelBoxClass} line-clamp-2 ${cellBorder} ${labelClassName}`}
      >
        {children}
      </span>
    </span>
  );
}
