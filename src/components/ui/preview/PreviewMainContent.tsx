"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ContentRow } from "@/data/content-types";
import type { FilterSidebarCategoryTone } from "@/components/ui/filter-sidebar/config/filterSidebarTones";
import {
  FilterPill,
  type FilterPillVariant,
} from "@/components/ui/filter-sidebar/primitives/FilterPill";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { fullScreenContentInnerClass } from "./fullScreenContentChrome";
import { PreviewBlocksBody } from "./PreviewBlocksBody";
import { PreviewImageCarousel } from "./PreviewImageCarousel";

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

const sectionLabelClass =
  "w-[72px] shrink-0 font-lust-text text-xs font-normal leading-none tracking-[-0.228px] text-ink-body";

const clampPillRowClass =
  "flex min-h-0 w-full min-w-0 flex-wrap content-start gap-1.5 gap-y-1.5";

/** Selected pills first, then original order within each group. */
function sortPillsSelectedFirst(
  list: readonly string[],
  isSelected: (label: string) => boolean,
): string[] {
  return [...list]
    .map((label, order) => ({ label, order }))
    .sort((a, b) => {
      const sa = isSelected(a.label) ? 0 : 1;
      const sb = isSelected(b.label) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return a.order - b.order;
    })
    .map((x) => x.label);
}

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
  const itemsSorted = useMemo(
    () => sortPillsSelectedFirst(items, isSelected),
    [items, isSelected],
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const lastInlineWidthRef = useRef<number | null>(null);
  const [visiblePrefix, setVisiblePrefix] = useState<number | null>(null);
  const [overflowExpanded, setOverflowExpanded] = useState(false);

  useLayoutEffect(() => {
    if (!docked || overflowExpanded) return;
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
          const n = itemsSorted.length;
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

    if (visiblePrefix < itemsSorted.length) {
      if (rowCountForPillRow(el) > 3 && visiblePrefix > 0) {
        queueMicrotask(() => setVisiblePrefix((v) => (v !== null && v > 0 ? v - 1 : v)));
      }
    }
  }, [docked, itemKey, itemsSorted, overflowExpanded, visiblePrefix]);

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
        setOverflowExpanded(false);
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
    return itemsSorted.map((label) => renderPill(label));
  }

  if (overflowExpanded) {
    return (
      <div className="w-full min-w-0" ref={rootRef}>
        <div ref={rowRef} className={clampPillRowClass}>
          {itemsSorted.map((label) => renderPill(label))}
        </div>
      </div>
    );
  }

  if (visiblePrefix === null) {
    return (
      <div className="w-full min-w-0" ref={rootRef}>
        <div ref={rowRef} className={clampPillRowClass}>
          {itemsSorted.map((label) => renderPill(label))}
        </div>
      </div>
    );
  }

  const overflow = itemsSorted.length - visiblePrefix;
  const vis = itemsSorted.slice(0, visiblePrefix);

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
            onPress={() => setOverflowExpanded(true)}
            className="shrink-0"
            title={`Show ${overflow} more`}
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
  const selectionLayoutSig = useMemo(
    () =>
      `${itemKey}\0${items.map((l) => (isSelected(l) ? 1 : 0)).join("")}`,
    [itemKey, items, isSelected],
  );
  return (
    <ClampedPreviewPillsInner
      key={`${docked}-${selectionLayoutSig}`}
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

export function PreviewMainContent({
  row,
  fullScreen,
}: {
  row: ContentRow;
  fullScreen: boolean;
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
    <div className="flex w-full shrink-0 flex-col gap-2.5">
      <p className="min-w-0 max-w-full wrap-anywhere font-lust-text text-xl leading-snug tracking-[-0.38px] text-black-fae">
        {row.title}
      </p>
      {dateLine ? (
        <p className="w-full min-w-0 font-lust-text text-xs leading-none tracking-[-0.228px] text-black-fae">
          {dateLine}
        </p>
      ) : null}
      <Divider />
      <div className="flex shrink-0 flex-col">
        {previewSlides.length > 0 ? (
          <PreviewImageCarousel
            key={previewSlides.join("\0")}
            slides={previewSlides}
            alt={row.title}
          />
        ) : (
          <div
            className="relative flex h-[200px] w-full max-w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-[3.677px] bg-surface-canvas"
            aria-hidden
          />
        )}
      </div>
    </div>
  );

  const categoriesBlock = hasCategories ? (
    <div className="w-full min-w-0 shrink-0">
      <Divider />
      <div className="flex shrink-0 flex-col gap-3 pt-2.5">
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
              {sortPillsSelectedFirst(
                row.artists,
                isArtistPillSelected,
              ).map((label) => (
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
    </div>
  ) : null;

  const mainBody = hasBody && (
    <div className="min-w-0 w-full">
      <Divider />
      <div className="pt-2.5">
        {hasBlocks && row.contentBlocks ? (
          <PreviewBlocksBody
            key={`${row.id}-blocks`}
            content={row.contentBlocks}
          />
        ) : (
          <div
            key={`${row.id}-plain`}
            className="fae-preview-body-stack flex flex-col gap-3"
          >
            {paragraphs.map((p, i) => (
              <RichParagraph key={i} text={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const resourcesBlock = hasResources ? (
    <div className="w-full min-w-0 shrink-0">
      <Divider />
      <div className="flex shrink-0 flex-col gap-2 pt-2.5 pb-2">
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
    </div>
  ) : null;

  const mainColumnClass = fullScreen
    ? `${fullScreenContentInnerClass} fae-preview-cascade w-full min-w-0`
    : "fae-preview-cascade w-full min-w-0 flex flex-col gap-5";

  return (
    <div key={row.id} className={mainColumnClass}>
      {heroBlock}
      {categoriesBlock}
      {mainBody}
      {resourcesBlock}
    </div>
  );
}
