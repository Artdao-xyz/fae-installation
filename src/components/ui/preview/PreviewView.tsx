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
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { PREVIEW_DOCK_WIDTH_TRANSITION_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { PreviewBlocksBody } from "./PreviewBlocksBody";
import { PreviewBodyFillClamp } from "./PreviewBodyFillClamp";
import {
  fullScreenContentInnerClass,
  fullScreenContentScrollClass,
  fullScreenContentShellClass,
  fullScreenShowMoreLessButtonClass,
  fullScreenShowMoreLessLabelClass,
} from "./fullScreenContentChrome";
import { PreviewImageCarousel } from "./PreviewImageCarousel";
import { PreviewPanelCollapseBar } from "./PreviewPanelCollapseBar";

type PreviewViewProps = {
  row: ContentRow;
  /** When true, preview fills the viewport (docked panel hidden). */
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
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

/** Non-interactive (e.g. +N overflow chip). Actionable pills use sidebar selection styling. */
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

type ClampedPreviewPillsProps = {
  items: readonly string[];
  docked: boolean;
  variant: FilterPillVariant;
  tone: FilterSidebarCategoryTone;
  itemKey: string;
  isSelected: (label: string) => boolean;
  onPillPress: (label: string) => void;
};

/** After real width change (e.g. window / preview panel), debounce a full re-measure. */
const PREVIEW_PILL_WIDTH_REMEASURE_MS = 120;

function ClampedPreviewPillsInner({
  items,
  docked,
  variant,
  tone,
  itemKey,
  isSelected,
  onPillPress,
}: ClampedPreviewPillsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const lastInlineWidthRef = useRef<number | null>(null);
  const [visiblePrefix, setVisiblePrefix] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!docked) return;
    const el = rowRef.current;
    if (!el) return;

    if (visiblePrefix === null) {
      let raf0 = 0;
      let raf1 = 0;
      let cancelled = false;
      /**
       * Read row count after the next two frames: during the docked panel `max-w` / width
       * transition, flex may report a single “row” or wrong tops; measuring in the first
       * useLayout pass sets `visiblePrefix === items.length` and hides +N forever at full width.
       */
      raf0 = requestAnimationFrame(() => {
        raf1 = requestAnimationFrame(() => {
          if (cancelled) return;
          const row = rowRef.current;
          if (!row) return;
          const nRows = rowCountForPillRow(row);
          const n = items.length;
          if (nRows <= 3) {
            setVisiblePrefix(n);
            return;
          }
          setVisiblePrefix(firstIndexOnRowAtLeast(row, 4));
        });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf0);
        cancelAnimationFrame(raf1);
      };
    }

    if (visiblePrefix < items.length) {
      if (rowCountForPillRow(el) > 3 && visiblePrefix > 0) {
        queueMicrotask(() => setVisiblePrefix((v) => (v !== null && v > 0 ? v - 1 : v)));
      }
    }
  }, [docked, itemKey, items, visiblePrefix]);

  useEffect(() => {
    if (!docked) return;
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    lastInlineWidthRef.current = null;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const w = Math.round(e.contentRect.width);
      const prev = lastInlineWidthRef.current;
      if (prev === null) {
        lastInlineWidthRef.current = w;
        return;
      }
      if (Math.abs(w - prev) < 1) {
        return;
      }
      lastInlineWidthRef.current = w;
      if (t !== undefined) clearTimeout(t);
      t = setTimeout(() => {
        setVisiblePrefix(null);
      }, PREVIEW_PILL_WIDTH_REMEASURE_MS);
    });
    ro.observe(node);
    return () => {
      if (t !== undefined) clearTimeout(t);
      ro.disconnect();
    };
  }, [docked, itemKey]);

  const renderPill = useCallback(
    (label: string) => (
      <FilterPill
        key={label}
        label={label}
        variant={variant}
        tone={tone}
        selected={isSelected(label)}
        onPress={() => onPillPress(label)}
        className="shrink-0"
      />
    ),
    [isSelected, onPillPress, tone, variant],
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

function ClampedPreviewPills({
  items,
  docked,
  variant,
  tone,
  isSelected,
  onPillPress,
}: {
  items: readonly string[];
  docked: boolean;
  variant: FilterPillVariant;
  tone: FilterSidebarCategoryTone;
  isSelected: (label: string) => boolean;
  onPillPress: (label: string) => void;
}) {
  const itemKey = items.join("\0");
  return (
    <ClampedPreviewPillsInner
      key={`${docked}-${itemKey}`}
      itemKey={itemKey}
      items={items}
      docked={docked}
      variant={variant}
      tone={tone}
      isSelected={isSelected}
      onPillPress={onPillPress}
    />
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
  onBodyClampedChange,
}: {
  row: ContentRow;
  fullScreen: boolean;
  /** Docked only: set when the line-clamped body is cut off; used for the "Show more" CTA. */
  onBodyClampedChange?: (isClamped: boolean) => void;
}) {
  const {
    selectedFocusAreas,
    selectedActivityTypes,
    selectedArtists,
    selectedFormats,
    selectedNetworks,
    toggleFocusArea,
    toggleActivityType,
    toggleArtist,
    toggleFormat,
    toggleNetwork,
    applyPreviewPillFilterAndClose,
  } = useFilterSelection();

  const isFocusPillSelected = useCallback(
    (l: string) => selectedFocusAreas.has(l),
    [selectedFocusAreas],
  );
  const isActivityPillSelected = useCallback(
    (l: string) => selectedActivityTypes.has(l),
    [selectedActivityTypes],
  );
  const isFormatPillSelected = useCallback(
    (l: string) => selectedFormats.has(l),
    [selectedFormats],
  );
  const isNetworkPillSelected = useCallback(
    (l: string) => selectedNetworks.has(l),
    [selectedNetworks],
  );
  const isArtistPillSelected = useCallback(
    (l: string) => selectedArtists.has(l),
    [selectedArtists],
  );

  const onFocusPillPress = useCallback(
    (label: string) => {
      toggleFocusArea(label);
      applyPreviewPillFilterAndClose();
    },
    [toggleFocusArea, applyPreviewPillFilterAndClose],
  );
  const onActivityPillPress = useCallback(
    (label: string) => {
      toggleActivityType(label);
      applyPreviewPillFilterAndClose();
    },
    [toggleActivityType, applyPreviewPillFilterAndClose],
  );
  const onFormatPillPress = useCallback(
    (label: string) => {
      toggleFormat(label);
      applyPreviewPillFilterAndClose();
    },
    [toggleFormat, applyPreviewPillFilterAndClose],
  );
  const onNetworkPillPress = useCallback(
    (label: string) => {
      toggleNetwork(label);
      applyPreviewPillFilterAndClose();
    },
    [toggleNetwork, applyPreviewPillFilterAndClose],
  );
  const onArtistPillPress = useCallback(
    (label: string) => {
      toggleArtist(label);
      applyPreviewPillFilterAndClose();
    },
    [toggleArtist, applyPreviewPillFilterAndClose],
  );

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
                isSelected={isFocusPillSelected}
                onPillPress={onFocusPillPress}
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
                isSelected={isActivityPillSelected}
                onPillPress={onActivityPillPress}
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
                isSelected={isFormatPillSelected}
                onPillPress={onFormatPillPress}
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
                isSelected={isNetworkPillSelected}
                onPillPress={onNetworkPillPress}
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
                  selected={isArtistPillSelected(label)}
                  onPress={() => onArtistPillPress(label)}
                  className="shrink-0"
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
          onClampedChange={onBodyClampedChange}
        >
          <PreviewBlocksBody content={row.contentBlocks} />
        </PreviewBodyFillClamp>
      ) : (
        <PreviewBodyFillClamp
          key={`${row.id}-plain`}
          contentKey={row.id}
          onClampedChange={onBodyClampedChange}
        >
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

/** `minmax(0,1fr)` keeps the body row from swallowing the chrome rows. */
const previewDockedAsideBaseClass =
  "grid h-full min-h-0 w-preview-panel shrink-0 overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas";

export const PreviewView = memo(function PreviewView({
  row,
  fullScreen,
  onFullScreenChange,
  className = "",
}: PreviewViewProps) {
  const { closeContentPreview } = useFilterSelection();
  /** Replay open animation when switching docked ↔ full screen (same easing as filter drawer). */
  const [shellEntered, setShellEntered] = useState(false);
  const [dockedBodyClamped, setDockedBodyClamped] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setDockedBodyClamped(false);
    });
    return () => cancelAnimationFrame(id);
  }, [row.id]);

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

  if (fullScreen) {
    return (
      <div
        data-fae-content-preview
        onPointerDown={(e) => e.stopPropagation()}
        className={`${fullScreenContentShellClass} transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          shellEntered ? "opacity-100" : "opacity-0"
        } motion-reduce:opacity-100`}
        role="dialog"
        aria-modal="true"
        aria-label="Content preview full screen"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={closeContentPreview}
        />
        <div className={fullScreenContentScrollClass}>
          <div className={fullScreenContentInnerClass}>
            <PreviewMainContent row={row} fullScreen onBodyClampedChange={undefined} />
          </div>
        </div>
        <div className="flex shrink-0 justify-start">
          <button
            type="button"
            onClick={() => onFullScreenChange(false)}
            className={fullScreenShowMoreLessButtonClass}
            aria-label="Exit full screen preview"
          >
            <OpenSvgIcon className="shrink-0" />
            <span className={fullScreenShowMoreLessLabelClass}>
              Show less
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-fae-content-preview
      onPointerDown={(e) => e.stopPropagation()}
      className={`${previewDockedOuterClass} ${
        shellEntered
          ? "max-w-[var(--width-preview-panel)]"
          : "max-w-0"
      } motion-reduce:max-w-[var(--width-preview-panel)]`}
      role="presentation"
    >
      <aside
        className={`${previewDockedAsideBaseClass} ${
          dockedBodyClamped
            ? "grid-rows-[auto_minmax(0,1fr)_auto]"
            : "grid-rows-[auto_minmax(0,1fr)]"
        } ${className}`}
        aria-label="Content preview"
        role="dialog"
        aria-modal="true"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={closeContentPreview}
        />
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-5 pt-5 pb-0">
          <PreviewMainContent
            row={row}
            fullScreen={false}
            onBodyClampedChange={setDockedBodyClamped}
          />
        </div>

        {dockedBodyClamped ? (
          <div className="flex min-h-0 shrink-0 justify-start">
            <button
              type="button"
              onClick={() => onFullScreenChange(true)}
              className={fullScreenShowMoreLessButtonClass}
              aria-label="Open full screen preview"
            >
              <OpenSvgIcon className="shrink-0 rotate-180" />
              <span className={fullScreenShowMoreLessLabelClass}>
                Show more
              </span>
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
});
