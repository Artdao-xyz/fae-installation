"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const DEFAULT_LINE_HEIGHT_PX = 19.2;
const HEIGHT_SAFETY_PX = 2;
/** Keep the last line(s) out of the zone where the fade + next panel row (e.g. “Show more”) read as clipping. */
const BOTTOM_CLEARANCE_PX = 10;

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

function lineBudgetForContent(contentRoot: HTMLElement | null, shellH: number): number {
  if (!contentRoot || shellH <= 0) {
    return 3;
  }

  const firstText = contentRoot.querySelector(
    "p, li, blockquote, h1, h2, h3, h4, h5, h6",
  );
  const lh = readLineHeightPx(firstText);

  const stagger = contentRoot.querySelector<HTMLElement>(
    ".fae-preview-body-stack",
  );
  if (!stagger) {
    return Math.max(1, Math.floor((shellH - HEIGHT_SAFETY_PX) / lh));
  }

  const nBlocks = Math.max(1, stagger.children.length);
  const gapCount = nBlocks - 1;
  let gapTotalPx = 0;

  if (gapCount > 0) {
    const a = stagger.children[0] as HTMLElement;
    const b = stagger.children[1] as HTMLElement;
    if (a && b) {
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

  const hForLines = Math.max(0, shellH - gapTotalPx - HEIGHT_SAFETY_PX);
  return Math.max(1, Math.floor(hForLines / lh));
}

function shellHeightPx(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const h = r.height;
  if (h > 0) return Math.round(h * 100) / 100;
  return el.clientHeight;
}

const OVERFLOW_EPS_PX = 1;

type PreviewBodyFillClampProps = {
  children: ReactNode;
  contentKey: string;
  onClampedChange?: (isClamped: boolean) => void;
};

/**
 * Docked preview body: no inner scroll; text is line-clamped to available height with a
 * bottom “gray” fade. Full text is read via “Show more” (full screen).
 */
export function PreviewBodyFillClamp({
  children,
  contentKey,
  onClampedChange,
}: PreviewBodyFillClampProps) {
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

    const scheduleClampReport = () => {
      if (!onClampedChange) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = contentRef.current;
          const isClamped = Boolean(
            el && el.scrollHeight > el.clientHeight + OVERFLOW_EPS_PX,
          );
          onClampedChange(isClamped);
        });
      });
    };

    const update = () => {
      const rawH = shellHeightPx(shell);
      const h = Math.max(0, rawH - BOTTOM_CLEARANCE_PX);
      const n = lineBudgetForContent(contentRef.current, h);
      setLineCount(
        Math.max(1, Math.floor(n / PREVIEW_BODY_LINE_BUDGET_DIVISOR)),
      );
      scheduleClampReport();
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
  }, [contentKey, onClampedChange]);

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
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-linear-to-t from-surface-canvas from-0% via-surface-canvas/95 via-35% to-transparent to-100%"
        aria-hidden
      />
    </div>
  );
}
