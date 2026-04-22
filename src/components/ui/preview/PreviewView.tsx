"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ContentRow } from "@/data/content-types";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import type { FilterSidebarCategoryTone } from "@/components/ui/filter-sidebar/config/filterSidebarTones";
import {
  FilterPill,
  type FilterPillVariant,
} from "@/components/ui/filter-sidebar/primitives/FilterPill";
import { PREVIEW_DOCK_WIDTH_TRANSITION_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { PreviewBlocksBody } from "./PreviewBlocksBody";
import { PreviewBodyFillClamp } from "./PreviewBodyFillClamp";
import { PreviewImageCarousel } from "./PreviewImageCarousel";
import { PreviewPanelCollapseBar } from "./PreviewPanelCollapseBar";

type PreviewViewProps = {
  row: ContentRow;
  /** When true, preview fills the viewport (docked panel hidden). */
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
  /** Dismisses the preview entirely (dock or full screen). */
  onClose: () => void;
  className?: string;
};

function Divider() {
  return (
    <div
      className="h-0 w-full shrink-0 border-t-hairline border-dotted border-ink-primary"
      role="presentation"
    />
  );
}

function resourceLinkLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    if (path && path !== "/") {
      const short = path.length > 24 ? `${path.slice(0, 24)}…` : path;
      return `${host}${short}`;
    }
    return host;
  } catch {
    return url;
  }
}

function RichParagraph({
  text,
  preserveParagraphBreaks = false,
}: {
  text: string;
  preserveParagraphBreaks?: boolean;
}) {
  const segments = text.split(/(\*[^*]+\*)/g);
  return (
    <p
      className={`mb-0 font-suisseintl text-xs font-normal leading-[1.6] tracking-[0.36px] text-ink-caption${
        preserveParagraphBreaks ? " whitespace-pre-line" : ""
      }`}
    >
      {segments.map((seg, i) => {
        if (seg.startsWith("*") && seg.endsWith("*") && seg.length >= 2) {
          return (
            <em key={i} className="italic">
              {seg.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{seg}</span>;
      })}
    </p>
  );
}

/** Read-only pills: match FilterSidebar variants; always ink (never selection blue) in preview. */
const pillReadOnlyClass = "pointer-events-none shrink-0";

const sectionLabelClass =
  "w-[72px] shrink-0 font-lust-text text-xs font-normal leading-none tracking-[-0.228px] text-ink-body";

const clampPillRowClass =
  "flex min-h-0 w-full min-w-0 flex-wrap content-start gap-1.5 gap-y-1.5";

function rowCountForPillRow(container: HTMLElement): number {
  const children = Array.from(container.children) as HTMLElement[];
  if (children.length === 0) return 0;
  return new Set(children.map((c) => Math.round(c.offsetTop))).size;
}

/** Returns index of the first child that sits on the (1-based) `minRow1Based`-th line, or `childCount` if there are fewer row breaks. */
function firstIndexOnRowAtLeast(
  container: HTMLElement,
  minRow1Based: number,
): number {
  const children = Array.from(container.children) as HTMLElement[];
  if (children.length === 0) return 0;
  const tops = children.map((c) => c.offsetTop);
  const u = [...new Set(tops.map((t) => Math.round(t)))].sort(
    (a, b) => a - b,
  );
  if (u.length < minRow1Based) return children.length;
  const y = u[minRow1Based - 1];
  const i = children.findIndex((c) => Math.round(c.offsetTop) === y);
  return i < 0 ? children.length : i;
}

function ClampedPreviewPills({
  items,
  docked,
  variant,
  tone,
}: {
  items: readonly string[];
  docked: boolean;
  variant: FilterPillVariant;
  tone: FilterSidebarCategoryTone;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [visiblePrefix, setVisiblePrefix] = useState<number | null>(null);

  const itemKey = items.join("\0");

  useLayoutEffect(() => {
    if (!docked) return;
    setVisiblePrefix(null);
  }, [docked, itemKey]);

  useLayoutEffect(() => {
    if (!docked) return;
    const el = rowRef.current;
    if (!el) return;

    if (visiblePrefix === null) {
      const nRows = rowCountForPillRow(el);
      if (nRows <= 3) {
        setVisiblePrefix(items.length);
        return;
      }
      setVisiblePrefix(firstIndexOnRowAtLeast(el, 4));
      return;
    }

    if (visiblePrefix < items.length) {
      if (rowCountForPillRow(el) > 3 && visiblePrefix > 0) {
        setVisiblePrefix(visiblePrefix - 1);
      }
    }
  }, [docked, itemKey, items.length, visiblePrefix]);

  useEffect(() => {
    if (!docked) return;
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setVisiblePrefix(null);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [docked, itemKey]);

  const renderPill = useCallback(
    (label: string) => (
      <FilterPill
        key={label}
        label={label}
        variant={variant}
        tone={tone}
        selected={false}
        className={pillReadOnlyClass}
      />
    ),
    [tone, variant],
  );

  if (!docked) {
    return items.map((label) => renderPill(label));
  }

  if (visiblePrefix === null) {
    return (
      <div className="w-full min-w-0" ref={rootRef}>
        <div ref={rowRef} className={clampPillRowClass}>
          {items.map((label) => renderPill(label))}
        </div>
      </div>
    );
  }

  const overflow = items.length - visiblePrefix;
  const vis = items.slice(0, visiblePrefix);

  return (
    <div className="w-full min-w-0" ref={rootRef}>
      <div ref={rowRef} className={clampPillRowClass}>
        {vis.map((label) => renderPill(label))}
        {overflow > 0 ? (
          <FilterPill
            key="__overflow__"
            label={`+${overflow}`}
            variant={variant}
            tone={tone}
            selected={false}
            className={pillReadOnlyClass}
            title={`${overflow} more in this category`}
          />
        ) : null}
      </div>
    </div>
  );
}

function CategoryBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-0 gap-2.5">
      <p className={sectionLabelClass}>{label}</p>
      <div className="flex min-h-0 min-w-0 flex-1 flex-wrap content-start gap-1.5 gap-y-1.5">
        {children}
      </div>
    </div>
  );
}

function PreviewMainContent({
  row,
  fullScreen,
}: {
  row: ContentRow;
  fullScreen: boolean;
}) {
  const previewSlides = useMemo(
    () =>
      row.imageGallery.length > 0
        ? row.imageGallery
        : row.imageUrl
          ? [row.imageUrl]
          : [],
    [row.imageGallery, row.imageUrl],
  );

  const paragraphs = useMemo(
    () => row.content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
    [row.content],
  );

  const hasFocus = row.focusAreas.length > 0;
  const hasActivity = row.activityTypes.length > 0;
  const hasFormats = row.formats.length > 0;
  const hasNetworks = row.networks.length > 0;
  const hasArtists = row.artists.length > 0;
  const hasCategories =
    hasFocus || hasActivity || hasFormats || hasNetworks || hasArtists;
  const hasBlocks =
    row.contentBlocks !== null && row.contentBlocks.length > 0;
  const hasBody = hasBlocks || paragraphs.length > 0;
  const hasResources = row.resources.length > 0;
  const dateLine =
    row.yearLabel.trim().length > 0
      ? row.yearLabel
      : row.year > 0
        ? String(row.year)
        : "";

  const heroBlock = (
    <div className="flex w-full shrink-0 items-start gap-5">
      {previewSlides.length > 0 ? (
        <PreviewImageCarousel
          key={previewSlides.join("\0")}
          slides={previewSlides}
          alt={row.title}
        />
      ) : (
        <div
          className="relative flex size-[180px] shrink-0 items-center justify-center overflow-hidden rounded-[3.677px] bg-surface-canvas"
          aria-hidden
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-2.5">
        <p className="min-w-0 max-w-full wrap-anywhere font-lust-text text-xl leading-snug tracking-[-0.38px] text-black-fae">
          {row.title}
        </p>
        {dateLine ? (
          <p className="font-lust-text text-xs tracking-[-0.228px] text-black-fae">
            {dateLine}
          </p>
        ) : null}
      </div>
    </div>
  );

  const categoriesBlock = hasCategories ? (
    <>
      <Divider />
      <div className="flex shrink-0 flex-col gap-3">
          {hasFocus ? (
            <CategoryBlock label="Focus">
              <ClampedPreviewPills
                items={row.focusAreas}
                docked={!fullScreen}
                variant="square"
                tone="fae-briefings"
              />
            </CategoryBlock>
          ) : null}
          {hasActivity ? (
            <CategoryBlock label="Activity">
              <ClampedPreviewPills
                items={row.activityTypes}
                docked={!fullScreen}
                variant="rounded"
                tone="fae-briefings"
              />
            </CategoryBlock>
          ) : null}
          {hasFormats ? (
            <CategoryBlock label="Format">
              <ClampedPreviewPills
                items={row.formats}
                docked={!fullScreen}
                variant="rounded"
                tone="fae-briefings"
              />
            </CategoryBlock>
          ) : null}
          {hasNetworks ? (
            <CategoryBlock label="Network">
              <ClampedPreviewPills
                items={row.networks}
                docked={!fullScreen}
                variant="dotted"
                tone="network"
              />
            </CategoryBlock>
          ) : null}
          {hasArtists ? (
            <CategoryBlock label="Artist">
              {row.artists.map((label) => (
                <FilterPill
                  key={label}
                  label={label}
                  variant="rounded"
                  tone="artists"
                  selected={false}
                  className={pillReadOnlyClass}
                />
              ))}
            </CategoryBlock>
          ) : null}
        </div>
    </>
  ) : null;

  const bodyBlockFull = hasBody && (
    <>
      <Divider />
      {hasBlocks && row.contentBlocks ? (
        <PreviewBlocksBody
          key={`${row.id}-blocks`}
          content={row.contentBlocks}
        />
      ) : (
        <div
          key={`${row.id}-plain`}
          className="fae-preview-text-stagger flex flex-col gap-3"
        >
          {paragraphs.map((p, i) => (
            <RichParagraph key={i} text={p} />
          ))}
        </div>
      )}
    </>
  );

  const bodyBlockDocked = hasBody && (
    <>
      <Divider />
      {hasBlocks && row.contentBlocks ? (
        <PreviewBodyFillClamp
          key={`${row.id}-blocks`}
          contentKey={`${row.id}-blocks`}
        >
          <PreviewBlocksBody content={row.contentBlocks} />
        </PreviewBodyFillClamp>
      ) : (
        <PreviewBodyFillClamp key={`${row.id}-plain`} contentKey={row.id}>
          <RichParagraph text={row.content} preserveParagraphBreaks />
        </PreviewBodyFillClamp>
      )}
    </>
  );

  const resourcesBlock = hasResources ? (
    <>
      <Divider />
      <div className="flex shrink-0 flex-col gap-2 pb-2">
          <p className="font-lust-text text-xs leading-none tracking-[-0.228px] text-ink-caption">
            Sources
          </p>
          <ul className="flex list-none flex-col gap-1 p-0">
            {row.resources.map((href) => (
              <li key={href} className="leading-none">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-sm bg-surface-canvas/90 py-0 pl-0 pr-0 font-fira-mono text-[10px] leading-[14px] text-ink-body underline decoration-solid [text-decoration-skip-ink:none] backdrop-blur-fae-md hover:bg-surface-hover/80"
                >
                  <span className="min-w-0 truncate">
                    {resourceLinkLabel(href)}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/svg/blue-arrow.svg"
                    alt=""
                    className="h-[7px] w-[5px] shrink-0 object-contain"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
    </>
  ) : null;

  if (fullScreen) {
    return (
      <>
        {heroBlock}
        {categoriesBlock}
        {bodyBlockFull}
        {resourcesBlock}
      </>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5 overflow-hidden">
      {heroBlock}
      {categoriesBlock}
      {bodyBlockDocked}
      {resourcesBlock}
    </div>
  );
}

/** Fixed shell: clip width 0 → token (avoids `fr` interpolation overshoot in some browsers). */
const previewDockedOuterClass = `fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] z-[47] flex min-h-0 min-w-0 justify-end overflow-hidden ${PREVIEW_DOCK_WIDTH_TRANSITION_CLASS}`;

/** `minmax(0,1fr)` lets the middle row shrink; otherwise content spills under the "Show more" bar. */
const previewDockedAsideClass =
  "grid h-full min-h-0 w-preview-panel shrink-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas";

/** Same inset on all sides as `MarginGuideFrame` dashed guides. */
const fullScreenShellClass =
  "fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] left-[var(--inset-margin-guide)] z-50 flex min-h-0 min-w-0 flex-col overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas";

const showMoreButtonClass =
  "inline-flex w-fit items-center gap-2 self-start border-t-hairline border-r-hairline border-solid border-ink-primary px-5 py-3 font-fira-mono text-sm text-black-fae transition-colors hover:bg-black-fae/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas";

export const PreviewView = memo(function PreviewView({
  row,
  fullScreen,
  onFullScreenChange,
  onClose,
  className = "",
}: PreviewViewProps) {
  /** Replay open animation when switching docked ↔ full screen (same easing as filter drawer). */
  const [shellEntered, setShellEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    queueMicrotask(() => {
      if (cancelled || typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setShellEntered(true);
        return;
      }
      setShellEntered(false);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellEntered(true);
      });
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fullScreen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (fullScreen) onFullScreenChange(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullScreen, onClose, onFullScreenChange]);

  if (fullScreen) {
    return (
      <div
        className={`${fullScreenShellClass} transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          shellEntered ? "opacity-100" : "opacity-0"
        } motion-reduce:opacity-100`}
        role="dialog"
        aria-modal="true"
        aria-label="Content preview full screen"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={onClose}
        />
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-12 md:py-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            <PreviewMainContent row={row} fullScreen />
          </div>
        </div>
        <div className="flex shrink-0 justify-start">
          <button
            type="button"
            onClick={() => onFullScreenChange(false)}
            className={showMoreButtonClass}
            aria-label="Exit full screen preview"
          >
            <OpenSvgIcon className="shrink-0" />
            <span className="select-none text-[13px] leading-none tracking-wide">Show less</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${previewDockedOuterClass} ${
        shellEntered
          ? "max-w-[var(--width-preview-panel)]"
          : "max-w-0"
      } motion-reduce:max-w-[var(--width-preview-panel)]`}
      role="presentation"
    >
      <aside
        className={`${previewDockedAsideClass} ${className}`}
        aria-label="Content preview"
        role="dialog"
        aria-modal="true"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={onClose}
        />
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-5 pt-5 pb-0">
          <PreviewMainContent row={row} fullScreen={false} />
        </div>

        <div className="flex min-h-0 shrink-0 justify-start">
          <button
            type="button"
            onClick={() => onFullScreenChange(true)}
            className={showMoreButtonClass}
            aria-label="Open full screen preview"
          >
            <OpenSvgIcon className="shrink-0 rotate-180" />
            <span className="select-none text-[13px] leading-none tracking-wide">
              Show more
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
});
