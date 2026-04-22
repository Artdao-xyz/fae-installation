"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const DEFAULT_LINE_HEIGHT_PX = 19.2;
/** Pixels to reserve for subpixel / rounding; avoids the last line spilling the shell. */
const HEIGHT_SAFETY_PX = 2;

/**
 * `2` = half the budgeted rows (debug). `1` = use full `lineBudgetForContent` result.
 * Tailwind’s `line-clamp-(var())` is not used here: inline `WebkitLineClamp` must be a
 * real number in React state so changes (and this divisor) always apply in the engine.
 */
const PREVIEW_BODY_LINE_BUDGET_DIVISOR = 1;

function readLineHeightPx(el: Element | null): number {
  if (!el) return DEFAULT_LINE_HEIGHT_PX;
  const cs = getComputedStyle(el);
  if (cs.lineHeight === "normal") {
    const fontSize = parseFloat(cs.fontSize) || 12;
    return fontSize * 1.6;
  }
  const n = parseFloat(cs.lineHeight);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LINE_HEIGHT_PX;
}

/**
 * Strapi `PreviewBlocksBody` wraps blocks in `.fae-preview-text-stagger` with `flex flex-col
 * gap-3`, so the vertical room for *lines* is not `H / lh` — we must subtract the flex gaps
 * between each block. Plain copy is a single `p` (no extra gaps).
 */
function lineBudgetForContent(contentRoot: HTMLElement | null, shellH: number): number {
  if (!contentRoot || shellH <= 0) {
    return 3;
  }

  const firstText = contentRoot.querySelector(
    "p, li, blockquote, h1, h2, h3, h4, h5, h6",
  );
  const lh = readLineHeightPx(firstText);

  const stagger = contentRoot.querySelector<HTMLElement>(".fae-preview-text-stagger");
  if (!stagger) {
    // Plain: one flow (usually a single <p>); no inter-block flex gap
    return Math.max(1, Math.floor((shellH - HEIGHT_SAFETY_PX) / lh));
  }

  const nBlocks = Math.max(1, stagger.children.length);
  const gapCount = nBlocks - 1;
  let gapTotalPx = 0;

  if (gapCount > 0) {
    const a = stagger.children[0] as HTMLElement;
    const b = stagger.children[1] as HTMLElement;
    if (a && b) {
      // Measure one gap in layout (reliable; parseFloat on `gap` can misparse rem in some engines)
      const g = b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
      if (g >= 0 && g < 80) {
        gapTotalPx = g * gapCount;
      }
    }
    if (gapTotalPx === 0) {
      const cs = getComputedStyle(stagger);
      const raw = parseFloat(cs.rowGap) || parseFloat(cs.gap) || 0;
      const gapPerBlock = raw >= 1 ? raw : 12;
      gapTotalPx = gapPerBlock * gapCount;
    }
  }

  // Height that can be filled with line-height-sized rows after gaps: ~ H - gaps - safety
  const hForLines = Math.max(0, shellH - gapTotalPx - HEIGHT_SAFETY_PX);
  return Math.max(1, Math.floor(hForLines / lh));
}

function shellHeightPx(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const h = r.height;
  if (h > 0) return Math.round(h * 100) / 100;
  return el.clientHeight;
}

type PreviewBodyFillClampProps = {
  children: ReactNode;
  /**
   * When the row / body output changes, pass a new key so the observer re-binds
   * and the line count is re-derived.
   */
  contentKey: string;
};

/**
 * Docked body: same stack as Tailwind `line-clamp` + `text-ellipsis` (inline, numeric
 * `lineCount` so it updates). Bottom fade. Line budget: shell height, `line-height`, Strapi
 * block gaps. See `PREVIEW_BODY_LINE_BUDGET_DIVISOR` for a debug half-budget.
 */
export function PreviewBodyFillClamp({ children, contentKey }: PreviewBodyFillClampProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(3);

  const lineClampStyle: CSSProperties = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lineCount,
    lineClamp: lineCount,
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
  };

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const update = () => {
      const h = shellHeightPx(shell);
      const n = lineBudgetForContent(contentRef.current, h);
      setLineCount(
        Math.max(1, Math.floor(n / PREVIEW_BODY_LINE_BUDGET_DIVISOR)),
      );
    };

    update();
    let alive = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (alive) update();
      });
    });
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(shell);
    if (contentRef.current) {
      ro.observe(contentRef.current);
    }
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [contentKey]);

  return (
    <div
      ref={shellRef}
      className="relative h-full min-h-0 w-full min-w-0 flex-1 basis-0 overflow-hidden"
    >
      <div
        ref={contentRef}
        className="relative z-0 h-full min-h-0 w-full min-w-0 max-w-full wrap-anywhere"
        style={lineClampStyle}
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-surface-canvas/80 from-15% to-transparent to-100%"
        aria-hidden
      />
    </div>
  );
}
