"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import {
  getFilterSubpanelColumnWidthPx,
  getPreviewPanelWidthPx,
} from "@/components/ui/filter-sidebar/shell/layout-classes";
import { useIsMaxLg } from "@/components/ui/filter-sidebar/shell/useIsMaxLg";
import { getMarginGuideInsetPx } from "@/lib/margin-guide";
import { buildSuggestedSourceRowsSplit } from "@/lib/preview-suggested-outputs";
import {
  fetchPreviewBodyOnHover,
  fetchPreviewOutputDetail,
  getCachedPreviewDetailRow,
} from "@/lib/preview-output-detail";
import type { ContentRow } from "@/data/content-types";
import {
  Thumbnail,
  getThumbnailFramePx,
  getThumbnailFullCardOuterSize,
  getThumbnailTextVariantOuterSize,
  type ThumbnailSize,
} from "@/components/ui/thumbnail-full";
import { PreviewView } from "@/components/ui/preview";
import {
  PlacementBoundsDebugOverlay,
  useFaePlacementDebugEnabled,
} from "@/components/particle-canvas/placement-bounds-debug";
import {
  ParticleSystem,
  type Particle,
  type LifeFreezeOptions,
  type SimConfig,
  type Vec3,
  cloneParticle,
  apparentScaleFromParticle,
  seededRand,
  clamp,
  smoothstep01,
  lerp3,
  v3,
  TEXT_PARTICLE_RATIO,
  pickIdleTextWordIndex,
  particleOrbitIdealPos,
} from "./particle-system";
import {
  computeSpreadTargets,
  countContentRowsMatchingFilter,
  maxSpreadCountForViewport,
  pickSpreadIndicesLinkedThenRelated,
  pickSpreadIndicesFromRows,
  REGROUP_MS,
  FILTER_DIM_MS,
  HOVER_CARD_MS,
  HOVER_ENTER_DELAY_MS,
  HOVER_POINTER_MOTION_MAX_AGE_MS,
  FILTER_BG_DESAT_MUL,
  FILTER_BG_GRAYSCALE_MAX,
  FILTER_BG_OPACITY_MUL,
  type FilterMatchMode,
  type SpreadLayoutPhase,
  type TaxonomyFilterSelection,
} from "./image-particle-spread";
import { rowMatchesFilterSelection } from "@/lib/filter-row-match";
import { scaleForTargetVisualWidth } from "./image-particle-scale";
import { extractWordsFromTitle, scrambleWord } from "./image-particle-scramble";
import type {
  ImageParticleSimulationMode,
  ImageParticleSimulationStats,
} from "./image-particle-types";
import { IDLE_DEPTH_BLUR_DISABLED } from "./config";

const ROW_IMAGE_ATTR = "data-row-image";
/** When leaving a filter spread, fade out “injected” row pixels in this segment of the leave (0–1 t). */
const PATCHED_ROW_EXIT_FADE_START_U = 0.4;
const POST_LEAVE_SWARM_REVEAL_MS = 360;

/** `FILTER_SUBPANEL_COLUMN_TRANSITION_CLASS` is 300ms; add buffer so `measure` runs after width settles. */
const SUBPANEL_PLACEMENT_SETTLE_MS = 360;

function taxonomySelectionFromContentRow(
  row: ContentRow,
): TaxonomyFilterSelection {
  return {
    focus: new Set(row.focusAreas),
    activity: new Set(row.activityTypes),
    artists: new Set(row.artists),
    formats: new Set(row.formats),
    networks: new Set(row.networks),
  };
}

function buildTextIndexSetForCount(count: number): Set<number> {
  if (count === 0) return new Set();
  const set = new Set<number>();
  const textCount = Math.max(1, Math.floor(count * TEXT_PARTICLE_RATIO));
  const step = Math.max(1, Math.floor(count / textCount));
  for (let t = 0; t < textCount; t++) {
    const idx =
      (t * step +
        Math.floor(seededRand(t + 777.3) * step * 0.4)) %
      count;
    set.add(idx);
  }
  return set;
}

type SpreadDisplayPatch =
  | { type: "filter"; catalogIndices: number[] }
  | { type: "preview"; rows: ContentRow[] };

/** Imperative sync so slot `i` always shows `row`’s URL (avoids stale src when React reuses `<img>`). */
function syncImgToContentRow(
  img: HTMLImageElement,
  row: ContentRow,
): void {
  const imageUrl = row.imageUrl.trim();
  if (
    img.dataset.idx !== row.id ||
    img.getAttribute(ROW_IMAGE_ATTR) !== imageUrl
  ) {
    img.src = imageUrl;
    img.alt = row.shortTitle;
    img.title = row.shortTitle;
    img.dataset.idx = row.id;
    img.setAttribute(ROW_IMAGE_ATTR, imageUrl);
  }
}

type PlacementBounds = { cx: number; cy: number; w: number; h: number };

function approxEqualPlacementBounds(a: PlacementBounds, b: PlacementBounds) {
  /** Slightly looser to avoid `sys.resize` on every 1px step when RO is noisy. */
  const eps = 2;
  return (
    Math.abs(a.cx - b.cx) <= eps &&
    Math.abs(a.cy - b.cy) <= eps &&
    Math.abs(a.w - b.w) <= eps &&
    Math.abs(a.h - b.h) <= eps
  );
}

export type ImageParticleSimulationViewProps = {
  mode: ImageParticleSimulationMode;
  /**
   * Max particle slots for the idle swarm (and base preloads). Spreads may replace the first
   * *k* slots with rows from the full fetched catalog (filters, preview) without increasing N.
   */
  imageLimit?: number;
  fetchedWidth: number;
  fetchedHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  speedFactor: number;
  onStatsChange?: (stats: ImageParticleSimulationStats) => void;
  config: SimConfig;
  /** Idle text tiles: full `shortTitle` vs one keyword (default full title). */
  idleTextFullTitle?: boolean;
  /**
   * When set, idle orbit + spread packing use this element’s screen rect (clipped on the
   * right when the preview panel is open to match its fixed width). Omit to use the full window.
   */
  placementContainerRef?: RefObject<HTMLElement | null>;
  /**
   * How spread rows are chosen from Focus + Activity + Artists selections.
   * Default `intersection` (AND). Use `union` for OR within each group.
   */
  filterMatchMode?: FilterMatchMode;
  /** Extra classes on the root `<section>` (e.g. hide overlay on mobile while the sim keeps running). */
  rootClassName?: string;
  /** Share URL slug to open immediately when the page is loaded through `/[slug]`. */
  initialPreviewSlug?: string;
};

export function ImageParticleSimulationView({
  imageLimit,
  displayedWidth,
  displayedHeight,
  speedFactor,
  onStatsChange,
  config,
  idleTextFullTitle = true,
  placementContainerRef,
  filterMatchMode: filterMatchModeProp,
  rootClassName,
  initialPreviewSlug,
}: ImageParticleSimulationViewProps) {
  const filterMatchMode = filterMatchModeProp ?? "intersection";
  const filterMatchModeRef = useRef(filterMatchMode);
  filterMatchModeRef.current = filterMatchMode;

  const {
    selectedFocusAreas,
    selectedActivityTypes,
    selectedArtists,
    selectedFormats,
    selectedNetworks,
    filtersPanelOpen,
    setFiltersPanelOpen,
    filterSubpanelsOpen,
    setBriefingsSubpanelOpen,
    setRdSubpanelOpen,
    setNetworkSubpanelOpen,
    setArtistsSubpanelOpen,
    openContentPreview,
    registerContentPreviewOpener,
    registerContentPreviewCloser,
    setContentPreviewRow,
    resetToIdle,
    snapshotFiltersBeforeContentPreview,
    restoreFiltersAfterContentPreview,
    contentCatalog,
    contentCatalogError,
    contentCatalogTotal,
    contentCatalogFetchMs,
    searchQueryResetNonce,
  } = useFilterSelection();

  const isMaxLg = useIsMaxLg();
  const isMaxLgRef = useRef(isMaxLg);
  isMaxLgRef.current = isMaxLg;

  const idleTextFullTitleRef = useRef(idleTextFullTitle);
  idleTextFullTitleRef.current = idleTextFullTitle;

  const spreadSelectionRef = useRef<TaxonomyFilterSelection>({
    focus: selectedFocusAreas,
    activity: selectedActivityTypes,
    artists: selectedArtists,
    formats: selectedFormats,
    networks: selectedNetworks,
  });
  spreadSelectionRef.current = {
    focus: selectedFocusAreas,
    activity: selectedActivityTypes,
    artists: selectedArtists,
    formats: selectedFormats,
    networks: selectedNetworks,
  };

  const spreadSig = useMemo(
    () =>
      [...selectedFocusAreas].sort().join("\0") +
      "|" +
      [...selectedActivityTypes].sort().join("\0") +
      "|" +
      [...selectedArtists].sort().join("\0") +
      "|" +
      [...selectedFormats].sort().join("\0") +
      "|" +
      [...selectedNetworks].sort().join("\0"),
    [
      selectedFocusAreas,
      selectedActivityTypes,
      selectedArtists,
      selectedFormats,
      selectedNetworks,
    ],
  );
  const spreadSignatureRef = useRef("");
  spreadSignatureRef.current = spreadSig;

  /** Increments on each filter or preview spread layout so pack geometry is never identical to the previous run. */
  const spreadLayoutSaltRef = useRef(0);

  const [previewRow, setPreviewRow] = useState<ContentRow | null>(null);
  const [previewFullScreen, setPreviewFullScreen] = useState(false);
  const previewFullScreenRef = useRef(previewFullScreen);
  previewFullScreenRef.current = previewFullScreen;
  const previewRowRef = useRef<ContentRow | null>(null);
  previewRowRef.current = previewRow;
  const prevFiltersPanelOpenRef = useRef(filtersPanelOpen);

  const closeSidebarPanels = useCallback(() => {
    setFiltersPanelOpen(false);
    setBriefingsSubpanelOpen(false);
    setRdSubpanelOpen(false);
    setNetworkSubpanelOpen(false);
    setArtistsSubpanelOpen(false);
  }, [
    setArtistsSubpanelOpen,
    setBriefingsSubpanelOpen,
    setFiltersPanelOpen,
    setNetworkSubpanelOpen,
    setRdSubpanelOpen,
  ]);

  useEffect(() => {
    const sidebarJustOpened =
      filtersPanelOpen && !prevFiltersPanelOpenRef.current;
    prevFiltersPanelOpenRef.current = filtersPanelOpen;

    if (sidebarJustOpened && previewFullScreen) {
      setPreviewFullScreen(false);
      return;
    }

    if (previewFullScreen) {
      closeSidebarPanels();
    }
  }, [closeSidebarPanels, filtersPanelOpen, previewFullScreen]);

  /**
   * Hover: same output detail as click (`Text` + `Source` + media + taxonomies in one request).
   * Merges into the open panel; keeps existing `resources` when the patch has none. Full row is
   * cached on open via `fetchPreviewOutputDetail` when the user clicks.
   */
  const prefetchOutputDetailOnHover = useCallback((documentId: string) => {
    void fetchPreviewBodyOnHover(documentId).then((patch) => {
      if (!patch) return;
      setPreviewRow((prev) => {
        if (prev?.id !== documentId) return prev;
        return {
          ...prev,
          ...patch,
          resources:
            patch.resources.length > 0 ? patch.resources : prev.resources,
        };
      });
    });
  }, []);

  const closePreview = useCallback(() => {
    restoreFiltersAfterContentPreview();
    setPreviewRow(null);
    setPreviewFullScreen(false);
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, [restoreFiltersAfterContentPreview]);

  const handleFilteredThumbnailClick = useCallback(
    (row: ContentRow) => {
      if (previewRowRef.current == null) {
        snapshotFiltersBeforeContentPreview();
      }
      const hit = getCachedPreviewDetailRow(row.id);
      setPreviewRow(hit ? { ...row, ...hit } : row);
      const sharePath = `/${row.shareSlug}`;
      if (window.location.pathname !== sharePath) {
        window.history.pushState(null, "", sharePath);
      }
      if (hit) {
        console.log("[preview] sources (click)", {
          id: row.id,
          resources: hit.resources,
        });
        return;
      }
      void fetchPreviewOutputDetail(row.id).then((full) => {
        if (!full) return;
        console.log("[preview] sources (click)", {
          id: row.id,
          resources: full.resources,
        });
        setPreviewRow((prev) =>
          prev?.id === row.id ? { ...prev, ...full } : prev,
        );
      });
    },
    [snapshotFiltersBeforeContentPreview],
  );

  const didOpenInitialPreviewRef = useRef(false);
  useEffect(() => {
    if (!initialPreviewSlug || didOpenInitialPreviewRef.current) return;
    const row = contentCatalog.find(
      (item) => item.shareSlug === initialPreviewSlug,
    );
    if (!row) return;

    didOpenInitialPreviewRef.current = true;
    handleFilteredThumbnailClick(row);
  }, [contentCatalog, handleFilteredThumbnailClick, initialPreviewSlug]);

  useEffect(() => {
    registerContentPreviewOpener(handleFilteredThumbnailClick);
    return () => registerContentPreviewOpener(null);
  }, [registerContentPreviewOpener, handleFilteredThumbnailClick]);

  useEffect(() => {
    registerContentPreviewCloser(closePreview);
    return () => registerContentPreviewCloser(null);
  }, [registerContentPreviewCloser, closePreview]);

  useEffect(() => {
    setContentPreviewRow(previewRow);
  }, [previewRow, setContentPreviewRow]);

  useEffect(() => {
    setPreviewFullScreen(false);
  }, [previewRow?.id]);

  const spreadEnterSignatureRef = useRef<string | null>(null);

  // ---- State ----
  /**
   * Idle swarm: fixed prefix of the catalog (performance). Spreads can temporarily override the
   * first k slots with rows from the full catalog via `spreadDisplayPatch`.
   */
  const swarmRows = useMemo((): ContentRow[] => {
    if (contentCatalog.length === 0) return [];
    if (imageLimit !== undefined && imageLimit > 0) {
      return contentCatalog.slice(0, imageLimit);
    }
    return [...contentCatalog];
  }, [contentCatalog, imageLimit]);

  const [spreadDisplayPatch, setSpreadDisplayPatch] =
    useState<SpreadDisplayPatch | null>(null);

  const catalogTextIndexSet = useMemo(
    () => buildTextIndexSetForCount(contentCatalog.length),
    [contentCatalog.length],
  );

  const displayContentRows = useMemo((): ContentRow[] => {
    if (!spreadDisplayPatch) return swarmRows;
    if (spreadDisplayPatch.type === "filter") {
      const out = swarmRows.slice();
      for (let j = 0; j < spreadDisplayPatch.catalogIndices.length; j++) {
        const ci = spreadDisplayPatch.catalogIndices[j];
        if (ci === undefined || j >= out.length) continue;
        out[j] = contentCatalog[ci]!;
      }
      return out;
    }
    const out = swarmRows.slice();
    for (let s = 0; s < spreadDisplayPatch.rows.length; s++) {
      if (s < out.length) out[s] = spreadDisplayPatch.rows[s]!;
    }
    return out;
  }, [swarmRows, contentCatalog, spreadDisplayPatch]);

  const contentCatalogRef = useRef(contentCatalog);
  contentCatalogRef.current = contentCatalog;
  const catalogTextIndexSetRef = useRef(catalogTextIndexSet);
  catalogTextIndexSetRef.current = catalogTextIndexSet;
  const displayContentRowsRef = useRef(displayContentRows);
  displayContentRowsRef.current = displayContentRows;
  const swarmSizeRef = useRef(0);
  swarmSizeRef.current = swarmRows.length;
  const swarmRowsRef = useRef(swarmRows);
  swarmRowsRef.current = swarmRows;
  const setSpreadDisplayPatchRef = useRef(setSpreadDisplayPatch);
  setSpreadDisplayPatchRef.current = setSpreadDisplayPatch;

  /** Consecutive pool slots: linked rows, then related + taxonomy matches — matches preview patch rows. */
  const previewSourceRows = useMemo(() => {
    if (!previewRow || previewFullScreen) {
      return { linked: [] as ContentRow[], related: [] as ContentRow[] };
    }
    const { linked, related } = buildSuggestedSourceRowsSplit(
      previewRow,
      contentCatalog,
    );
    const n = swarmRows.length;
    if (n === 0) return { linked: [], related: [] };
    const used = new Set<string>([previewRow.id]);
    const linkedRows: ContentRow[] = [];
    for (const row of linked) {
      if (used.has(row.id)) continue;
      linkedRows.push(row);
      used.add(row.id);
      if (linkedRows.length >= n) break;
    }
    const relatedRows: ContentRow[] = [];
    for (const row of related) {
      if (used.has(row.id)) continue;
      relatedRows.push(row);
      used.add(row.id);
      if (linkedRows.length + relatedRows.length >= n) break;
    }
    if (linkedRows.length + relatedRows.length < n) {
      const previewTaxonomy = taxonomySelectionFromContentRow(previewRow);
      for (const row of contentCatalog) {
        if (used.has(row.id)) continue;
        if (
          !rowMatchesFilterSelection(
            row,
            previewTaxonomy,
            filterMatchMode,
          )
        ) {
          continue;
        }
        relatedRows.push(row);
        used.add(row.id);
        if (linkedRows.length + relatedRows.length >= n) break;
      }
    }
    return { linked: linkedRows, related: relatedRows };
  }, [
    previewRow,
    previewFullScreen,
    contentCatalog,
    swarmRows.length,
    filterMatchMode,
  ]);

  const previewSourceRowsRef = useRef(previewSourceRows);
  previewSourceRowsRef.current = previewSourceRows;

  const [contentTotal, setContentTotal] = useState(0);
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  /** Physics + spread: size and center in viewport pixels (matches placement layer). */
  const [placementBounds, setPlacementBounds] = useState({
    cx: 720,
    cy: 450,
    w: 1440,
    h: 900,
  });
  const placementBoundsRef = useRef(placementBounds);
  placementBoundsRef.current = placementBounds;
  const placementDebug = useFaePlacementDebugEnabled();
  /** True while spread layout chrome applies (enter → hold → leave). */
  const [spreadChromeActive, setSpreadChromeActive] = useState(false);
  const [selectedFilterIndices, setSelectedFilterIndices] = useState<number[]>(
    [],
  );
  /** Idle hover: full-card chrome + pin physics (cleared when filter spread runs). */
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const spreadChromeActiveRef = useRef(false);
  spreadChromeActiveRef.current = spreadChromeActive;
  const hoverSlotRef = useRef<number | null>(null);
  const hoverPinRef = useRef<{ slot: number; pos: Vec3 } | null>(null);
  /** `in` → `hold` (expanded); `out` = shrinking until DOM clears. */
  const hoverPhaseRef = useRef<"in" | "hold" | "out" | null>(null);
  const hoverAnimT0Ref = useRef(0);
  const hoverEnterDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  /** `null` until first qualifying pointer move/down this session; used to gate idle tile hover. */
  const lastPointerMotionMsRef = useRef<number | null>(null);

  const clearHoverEnterDelay = useCallback(() => {
    if (hoverEnterDelayTimerRef.current !== null) {
      clearTimeout(hoverEnterDelayTimerRef.current);
      hoverEnterDelayTimerRef.current = null;
    }
  }, []);

  const clearIdleHoverState = useCallback(() => {
    clearHoverEnterDelay();
    hoverPhaseRef.current = null;
    hoverAnimT0Ref.current = 0;
    hoverSlotRef.current = null;
    hoverPinRef.current = null;
    setHoveredIndex(null);
  }, [clearHoverEnterDelay]);

  const beginIdleHoverExpand = useCallback(
    (index: number) => {
      if (spreadChromeActiveRef.current) return;
      clearHoverEnterDelay();
      const sysInner = systemRef.current;
      const pt = sysInner?.particles[index];
      if (!pt) return;
      const t = performance.now();
      hoverPhaseRef.current = "in";
      hoverAnimT0Ref.current = t;
      hoverSlotRef.current = index;
      hoverPinRef.current = { slot: index, pos: { ...pt.pos } };
      setHoveredIndex(index);
    },
    [clearHoverEnterDelay],
  );

  useEffect(() => {
    const markPointerActivity = (e: PointerEvent) => {
      if (e.type === "pointermove" && e.pointerType === "mouse") {
        if (e.movementX * e.movementX + e.movementY * e.movementY < 0.25) {
          return;
        }
      }
      lastPointerMotionMsRef.current = performance.now();
    };
    window.addEventListener("pointermove", markPointerActivity, {
      passive: true,
    });
    window.addEventListener("pointerdown", markPointerActivity, {
      passive: true,
    });
    return () => {
      window.removeEventListener("pointermove", markPointerActivity);
      window.removeEventListener("pointerdown", markPointerActivity);
    };
  }, []);

  const pointerMotionRecentEnough = useCallback(() => {
    const last = lastPointerMotionMsRef.current;
    if (last === null) return false;
    return (
      performance.now() - last <= HOVER_POINTER_MOTION_MAX_AGE_MS
    );
  }, []);

  const handleTilePointerEnter = useCallback(
    (index: number) => {
      if (isMaxLg) return;
      if (spreadChromeActive) return;
      if (!pointerMotionRecentEnough()) return;
      clearHoverEnterDelay();
      const sys = systemRef.current;
      const p = sys?.particles[index];
      if (!p) return;
      hoverEnterDelayTimerRef.current = setTimeout(() => {
        hoverEnterDelayTimerRef.current = null;
        if (spreadChromeActiveRef.current) return;
        if (!pointerMotionRecentEnough()) return;
        beginIdleHoverExpand(index);
      }, HOVER_ENTER_DELAY_MS);
    },
    [
      beginIdleHoverExpand,
      clearHoverEnterDelay,
      isMaxLg,
      pointerMotionRecentEnough,
      spreadChromeActive,
    ],
  );

  const handleTilePointerLeave = useCallback(
    (index: number) => {
      if (isMaxLg) return;
      clearHoverEnterDelay();
      if (hoverSlotRef.current !== index) return;
      hoverPhaseRef.current = "out";
      hoverAnimT0Ref.current = performance.now();
    },
    [clearHoverEnterDelay, isMaxLg],
  );

  useEffect(() => {
    if (!spreadChromeActive) return;
    clearIdleHoverState();
  }, [spreadChromeActive, clearIdleHoverState]);

  useEffect(() => {
    if (previewRow != null) {
      clearIdleHoverState();
    }
  }, [previewRow, clearIdleHoverState]);

  useEffect(() => {
    if (searchQueryResetNonce === 0) return;
    clearIdleHoverState();
  }, [searchQueryResetNonce, clearIdleHoverState]);

  useEffect(() => {
    return () => clearHoverEnterDelay();
  }, [clearHoverEnterDelay]);

  const handleTilePreviewClick = useCallback(
    (row: ContentRow, slotIndex: number) => {
      if (isMaxLg && !spreadChromeActiveRef.current) {
        /** `hoverSlotRef` updates synchronously in `beginIdleHoverExpand` so a 2nd tap works before `hoveredIndex` commits. */
        if (hoverSlotRef.current === slotIndex) {
          openContentPreview(row);
        } else {
          prefetchOutputDetailOnHover(row.id);
          beginIdleHoverExpand(slotIndex);
        }
        return;
      }
      openContentPreview(row);
    },
    [
      beginIdleHoverExpand,
      isMaxLg,
      openContentPreview,
      prefetchOutputDetailOnHover,
    ],
  );

  const idleSnapshotRef = useRef<Particle[] | null>(null);
  /** Inner spread slots — filter-matching tiles (center-first). */
  const spreadTargetsRef = useRef<Vec3[]>([]);
  const selectedIndicesRef = useRef<number[]>([]);
  const filterT0Ref = useRef(0);
  /**
   * After a patched slot clears to swarm, per-slot alpha ramp 0→1 so the idle thumbnail doesn’t pop.
   * Cleared in `beginSpreadEnter` and when the reveal window completes.
   */
  const postLeaveContentRevealRef = useRef<{
    t0: number;
    slots: Set<number>;
  } | null>(null);
  const spreadLayoutPhaseRef = useRef<SpreadLayoutPhase>("idle");
  /** True during enter after swapping filters in place — skip enter scale ramp for tiles already at card size. */
  const spreadInPlaceRespreadRef = useRef(false);
  /** Selection before the current `beginSpreadEnter` — used to fade demoted tiles instead of snapping dim. */
  const spreadPrevSelectedRef = useRef<Set<number>>(new Set());
  /**
   * `placementBounds.w/h` for the sim box when we last built spread targets. When it changes
   * (e.g. preview opens) with the same index list, we respread so tiles stay in bounds.
   */
  const spreadLayoutPlacementWhRef = useRef<{ w: number; h: number } | null>(
    null,
  );
  const leaveFromRef = useRef<Vec3[]>([]);
  const leaveScaleFromRef = useRef<number[]>([]);
  /**
   * Per-index `offsetWidth` measured once when opening spread from idle (sm / text outer).
   * In-place respreads must not refresh: nodes are lg-sized then and would break leave scale.
   */
  const idleNodeWidthRef = useRef<number[] | null>(null);
  /** After leave `u>=1`, sync React to idle + re-apply DOM styles in the same tick (see flushSync in tick). */
  const leaveCompleteAfterRenderRef = useRef(false);
  /**
   * After filter-off, ramp depth blur from 0 so tiles that were spread (blur forced off)
   * don't pop when idle blur turns on for only the far-depth subset.
   */
  const idleBlurRampT0Ref = useRef<number | null>(null);
  /** Indices that had blur forced off while spread — only those get the post-filter blur ramp. */
  const idleBlurRampIndicesRef = useRef<Set<number> | null>(null);
  /**
   * Leave freezes physics; first idle frames would otherwise integrate orbit springs and move
   * particles away from the restored snapshot — visible as a position jump on some tiles.
   */
  const idlePhysicsSkipFramesRef = useRef(0);

  const textWordsByRow = useMemo(
    () => displayContentRows.map((r) => extractWordsFromTitle(r.title)),
    [displayContentRows],
  );

  const textIndexSet = useMemo(() => {
    const count = swarmRows.length;
    if (count === 0) return new Set<number>();
    const set = new Set<number>();
    const textCount = Math.max(1, Math.floor(count * TEXT_PARTICLE_RATIO));
    const step = Math.max(1, Math.floor(count / textCount));
    for (let t = 0; t < textCount; t++) {
      const idx =
        (t * step +
          Math.floor(seededRand(t + 777.3) * step * 0.4)) %
        count;
      set.add(idx);
    }
    return set;
  }, [swarmRows.length]);

  const thumbnailSize = useMemo<ThumbnailSize>(() => {
    const d = Math.min(displayedWidth, displayedHeight);
    return d <= 80 ? "sm" : d <= 130 ? "md" : "lg";
  }, [displayedWidth, displayedHeight]);

  const thumbnailFramePx = useMemo(
    () => getThumbnailFramePx(thumbnailSize),
    [thumbnailSize]
  );

  const filteredLgOuter = useMemo(
    () => getThumbnailFullCardOuterSize("lg"),
    [],
  );

  /** Idle orbit fits the lg full-card thumbnail inside the smaller `thumbnailFramePx` box via CSS scale. */
  const lgFramePx = useMemo(() => getThumbnailFramePx("lg"), []);
  const idleOrbitThumbScale = thumbnailFramePx / lgFramePx;

  const textIdleOuter = useMemo(
    () => getThumbnailTextVariantOuterSize(thumbnailSize),
    [thumbnailSize],
  );

  const selectedFilterSet = useMemo(
    () => new Set(selectedFilterIndices),
    [selectedFilterIndices],
  );

  const spreadTaxonomy: TaxonomyFilterSelection = useMemo(
    () => ({
      focus: selectedFocusAreas,
      activity: selectedActivityTypes,
      artists: selectedArtists,
      formats: selectedFormats,
      networks: selectedNetworks,
    }),
    [
      selectedFocusAreas,
      selectedActivityTypes,
      selectedArtists,
      selectedFormats,
      selectedNetworks,
    ],
  );

  const placementDebugStats = useMemo(() => {
    const w = placementBounds.w;
    const h = placementBounds.h;
    const cap = w > 0 && h > 0 ? maxSpreadCountForViewport(w, h) : 0;
    return {
      totalRows: swarmRows.length,
      rowsMatchingFilter: countContentRowsMatchingFilter(
        contentCatalog,
        spreadTaxonomy,
        filterMatchMode,
      ),
      viewportMaxSlots: cap,
      spreadShown: spreadChromeActive ? selectedFilterIndices.length : null,
    };
  }, [
    contentCatalog,
    swarmRows.length,
    spreadTaxonomy,
    filterMatchMode,
    placementBounds.w,
    placementBounds.h,
    spreadChromeActive,
    selectedFilterIndices.length,
  ]);

  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const textRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const systemRef = useRef<ParticleSystem | null>(null);
  const configRef = useRef<SimConfig>(config);
  configRef.current = config;
  const textWordsByRowRef = useRef(textWordsByRow);
  textWordsByRowRef.current = textWordsByRow;

  const filterSubpanelsOpenRef = useRef(filterSubpanelsOpen);
  filterSubpanelsOpenRef.current = filterSubpanelsOpen;

  const subpanelOpenPrevForPlacementRef = useRef(filterSubpanelsOpen);
  const subpanelCloseSettlingRef = useRef(false);
  const subpanelSettleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const subpanelSettleLayoutPrevRef = useRef(filterSubpanelsOpen);
  const [settleAfterSubpanelCloseNonce, setSettleAfterSubpanelCloseNonce] =
    useState(0);

  /** Synchronous: before any `useLayoutEffect`, so the first `measure` after a close sees "settling". */
  if (subpanelOpenPrevForPlacementRef.current && !filterSubpanelsOpen) {
    subpanelCloseSettlingRef.current = true;
  } else if (filterSubpanelsOpen) {
    subpanelCloseSettlingRef.current = false;
  }
  subpanelOpenPrevForPlacementRef.current = filterSubpanelsOpen;

  useLayoutEffect(() => {
    if (filterSubpanelsOpen) {
      if (subpanelSettleTimeoutRef.current) {
        clearTimeout(subpanelSettleTimeoutRef.current);
        subpanelSettleTimeoutRef.current = null;
      }
      subpanelSettleLayoutPrevRef.current = filterSubpanelsOpen;
      return;
    }
    if (subpanelSettleLayoutPrevRef.current && !filterSubpanelsOpen) {
      if (subpanelSettleTimeoutRef.current) {
        clearTimeout(subpanelSettleTimeoutRef.current);
      }
      subpanelSettleTimeoutRef.current = setTimeout(() => {
        subpanelSettleTimeoutRef.current = null;
        subpanelCloseSettlingRef.current = false;
        setSettleAfterSubpanelCloseNonce((n) => n + 1);
      }, SUBPANEL_PLACEMENT_SETTLE_MS);
    }
    subpanelSettleLayoutPrevRef.current = filterSubpanelsOpen;
    return () => {
      if (subpanelSettleTimeoutRef.current) {
        clearTimeout(subpanelSettleTimeoutRef.current);
        subpanelSettleTimeoutRef.current = null;
      }
    };
  }, [filterSubpanelsOpen]);

  // ---- Placement (main column below hero; minus preview drawer when open) ----
  useLayoutEffect(() => {
    /** Width reserved on the right: margin guide inset + docked preview panel (matches `PreviewView`). */
    const previewRightReservationPx = () => {
      if (!previewRow) return 0;
      const vw = window.innerWidth;
      /** `max-lg`: preview is a sheet overlay, not the docked panel — do not reserve width. */
      if (vw < 1024) return 0;
      if (previewFullScreen) return 0;
      const inset = getMarginGuideInsetPx();
      const panelW = getPreviewPanelWidthPx(vw);
      return inset + panelW;
    };

    /**
     * Domain subpanels (briefings, R&D, artists, network): ignore `ResizeObserver` / scroll while a
     * subpanel is open, and for ~360ms after it closes (column width is still animating) so
     * `placementBounds` do not chase intermediate widths. A single re-measure runs when settling
     * ends. Real viewport resizes use `isWindowResize` and may apply `subW`.
     */
    const measure = (isWindowResize: boolean) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      /** Align sim height with the inner band of the margin guide (not full window). */
      const marginGuideInset = getMarginGuideInsetPx();
      const viewportHForSim = Math.max(64, vh - 2 * marginGuideInset);
      const reservedRight = previewRightReservationPx();
      const rightLimit = vw - reservedRight;
      const cy = vh / 2;
      const h = viewportHForSim;

      if (!filtersPanelOpen) {
        /**
         * Sidebar closed: normal idle uses the full viewport. With a docked preview,
         * use the full region left of the preview panel; centering on `vw / 2` would
         * shrink the box symmetrically and prevent the preview spread cap from growing.
         */
        const previewDocked = previewRow != null && vw >= 1024 && !previewFullScreen;
        const cx = previewDocked ? rightLimit / 2 : vw / 2;
        const w = previewDocked
          ? Math.max(64, rightLimit)
          : Math.max(64, 2 * Math.min(cx, Math.max(0, rightLimit - cx)));
        const next: PlacementBounds = { cx, cy, w, h };
        setPlacementBounds((prev) =>
          approxEqualPlacementBounds(prev, next) ? prev : next,
        );
        return;
      }

      const el = placementContainerRef?.current;
      if (!el) {
        const w = Math.max(64, rightLimit);
        const next: PlacementBounds = { cx: vw / 2, cy, w, h };
        setPlacementBounds((prev) =>
          approxEqualPlacementBounds(prev, next) ? prev : next,
        );
        return;
      }

      if (
        (filterSubpanelsOpenRef.current || subpanelCloseSettlingRef.current) &&
        !isWindowResize
      ) {
        return;
      }

      const r = el.getBoundingClientRect();
      const right = Math.min(r.right, rightLimit);
      const subW =
        filterSubpanelsOpenRef.current && isWindowResize
          ? getFilterSubpanelColumnWidthPx(vw)
          : 0;
      const leftV = r.left - subW;
      const w = Math.max(64, right - leftV);
      const cx = leftV + w / 2;
      const next: PlacementBounds = { cx, cy, w, h };
      setPlacementBounds((prev) =>
        approxEqualPlacementBounds(prev, next) ? prev : next,
      );
    };

    const onResize = () => {
      measure(true);
    };

    let roScrollRafId = 0;
    const onRoOrScroll = () => {
      if (roScrollRafId !== 0) return;
      roScrollRafId = requestAnimationFrame(() => {
        roScrollRafId = 0;
        measure(false);
      });
    };

    measure(false);
    const el = placementContainerRef?.current;
    const ro = new ResizeObserver(onRoOrScroll);
    if (el) ro.observe(el);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onRoOrScroll, true);
    return () => {
      if (roScrollRafId !== 0) {
        cancelAnimationFrame(roScrollRafId);
        roScrollRafId = 0;
      }
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onRoOrScroll, true);
    };
  }, [
    placementContainerRef,
    previewRow,
    previewFullScreen,
    filtersPanelOpen,
    settleAfterSubpanelCloseNonce,
  ]);

  // ---- Catalog metadata (list lives in `FilterSelectionProvider`; sim uses `swarmRows` + spread patch) ----
  useEffect(() => {
    setFetchError(contentCatalogError);
    setFetchDurationMs(contentCatalogFetchMs);
    setContentTotal(contentCatalogTotal);
  }, [contentCatalogError, contentCatalogFetchMs, contentCatalogTotal]);

  // ---- Preload images ----
  useEffect(() => {
    setLoadedCount(0);
    setErrorCount(0);
    setLoadDurationMs(null);
    if (displayContentRows.length === 0) return;

    let cancelled = false;
    let loaded = 0;
    let errors = 0;
    let handled = 0;
    const start = performance.now();

    const mark = (isError: boolean) => {
      if (cancelled) return;
      handled++;
      if (isError) errors++;
      else loaded++;
      setLoadedCount(loaded);
      setErrorCount(errors);
      if (handled >= displayContentRows.length)
        setLoadDurationMs(Math.round(performance.now() - start));
    };

    for (const row of displayContentRows) {
      const imageUrl = row.imageUrl.trim();
      if (!imageUrl) {
        mark(true);
        continue;
      }
      const img = new window.Image();
      let settled = false;
      const settle = (isError: boolean) => {
        if (settled) return;
        settled = true;
        img.onload = null;
        img.onerror = null;
        mark(isError);
      };
      img.onload = () => settle(false);
      img.onerror = () => settle(true);
      img.src = imageUrl;
      if (img.complete) settle(img.naturalWidth === 0);
    }

    return () => {
      cancelled = true;
    };
  }, [displayContentRows]);

  // ---- Stats ----
  const totalImages = displayContentRows.length;
  const loadDone =
    totalImages > 0 && loadedCount + errorCount >= totalImages;

  useEffect(() => {
    onStatsChange?.({
      loadedCount,
      errorCount,
      loadDurationMs,
      contentRowsCount: displayContentRows.length,
      contentTotal,
      fetchDurationMs,
      fetchError,
      totalImages,
      loadDone,
    });
  }, [
    loadedCount,
    errorCount,
    loadDurationMs,
    displayContentRows.length,
    contentTotal,
    fetchDurationMs,
    fetchError,
    totalImages,
    loadDone,
    onStatsChange,
  ]);

  // ---- Init system (respawn only when swarm size changes) ----
  useEffect(() => {
    if (swarmRows.length === 0) {
      systemRef.current = null;
      return;
    }
    const sys = new ParticleSystem();
    sys.cfg = { ...configRef.current };
    sys.init(
      swarmRows.length,
      textWordsByRowRef.current,
      placementBounds.w,
      placementBounds.h,
    );

    systemRef.current = sys;
    // placementBounds w/h are applied without re-init via the resize effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid respawning when only viewport changes
  }, [swarmRows.length]);

  // Display row patches (filters/preview suggestions) can change text words; do not respawn particles for that.
  useEffect(() => {
    systemRef.current?.updateWordsByRow(textWordsByRow);
  }, [textWordsByRow]);

  // ---- Viewport for physics: resize without respawning (sidebar / subpanels / window) ----
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys || swarmRows.length === 0) return;
    sys.resize(placementBounds.w, placementBounds.h);
  }, [placementBounds.w, placementBounds.h, swarmRows.length]);

  // ---- Animation loop ----
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys || swarmRows.length === 0) return;

    let rafId = 0;
    let lastTime = performance.now();

    /** Read live sim box from ref so spread picks and targets follow mid-frame / post-resize `placementBounds`. */
    const getViewportSpread = () => ({
      w: placementBoundsRef.current.w,
      h: placementBoundsRef.current.h,
    });

    const PLACEMENT_RESPREAD_EPS = 0.5;

    /**
     * Filter picks use the full catalog, then map to the first k swarm slots (0..k-1) with
     * `SpreadDisplayPatch` so tiles outside the idle prefix can still appear. Preview linked+related
     * still uses per-slot pool indices from `pickSpreadIndicesLinkedThenRelated`.
     */
    const getSpreadPickResult = (): {
      poolIndices: number[];
      patch: SpreadDisplayPatch;
    } => {
      const viewportSpread = getViewportSpread();
      const pr = previewRowRef.current;
      const pfs = previewFullScreenRef.current;
      const cat = contentCatalogRef.current;
      const nPool = swarmSizeRef.current;
      if (nPool === 0) {
        return { poolIndices: [], patch: { type: "filter", catalogIndices: [] } };
      }
      if (
        pr &&
        !pfs &&
        (previewSourceRowsRef.current.linked.length > 0 ||
          previewSourceRowsRef.current.related.length > 0)
      ) {
        const cap = maxSpreadCountForViewport(
          viewportSpread.w,
          viewportSpread.h,
        );
        const rows = [
          ...previewSourceRowsRef.current.linked,
          ...previewSourceRowsRef.current.related,
        ].slice(0, Math.min(nPool, cap));
        const linkedCount = Math.min(
          previewSourceRowsRef.current.linked.length,
          rows.length,
        );
        const linkedIndices = Array.from(
          { length: linkedCount },
          (_, i) => i,
        );
        const relatedIndices = Array.from(
          { length: Math.max(0, rows.length - linkedCount) },
          (_, i) => linkedCount + i,
        );
        const pool = pickSpreadIndicesLinkedThenRelated(
          rows,
          textIndexSet,
          linkedIndices,
          relatedIndices,
          viewportSpread,
        );
        return { poolIndices: pool, patch: { type: "preview", rows } };
      }
      const selectionForSpread: TaxonomyFilterSelection =
        pr && !pfs
          ? taxonomySelectionFromContentRow(pr)
          : spreadSelectionRef.current;
      const raw = pickSpreadIndicesFromRows(
        cat,
        catalogTextIndexSetRef.current,
        selectionForSpread,
        filterMatchModeRef.current,
        viewportSpread,
      );
      const k = Math.min(raw.length, nPool);
      const catalogIndices = raw.slice(0, k);
      return {
        poolIndices: Array.from({ length: k }, (_, i) => i),
        patch: { type: "filter", catalogIndices },
      };
    };

    const computeSpreadOrderedIndices = (): number[] =>
      getSpreadPickResult().poolIndices;

    const effectiveSpreadSig = (): string => {
      const pr = previewRowRef.current;
      const pfs = previewFullScreenRef.current;
      if (!pr || pfs) return spreadSignatureRef.current;
      const { linked, related } = previewSourceRowsRef.current;
      if (linked.length > 0 || related.length > 0) {
        return `pv:${pr.id}:L${linked.map((r) => r.id).join(",")}/R${related
          .map((r) => r.id)
          .join(",")}`;
      }
      const t = [
        ...pr.focusAreas,
        "\u0000",
        ...pr.activityTypes,
        "\u0000",
        ...pr.formats,
        "\u0000",
        ...pr.networks,
        "\u0000",
        ...pr.artists,
      ].join("\t");
      return `pv:${pr.id}:row:${t}`;
    };

    const computeSpreadActive = (orderedLen: number): boolean => {
      const s = spreadSelectionRef.current;
      const filterSpreadActive =
        s.focus.size > 0 ||
        s.activity.size > 0 ||
        s.artists.size > 0 ||
        s.formats.size > 0 ||
        s.networks.size > 0;
      const previewDocked =
        previewRowRef.current != null && !previewFullScreenRef.current;
      /**
       * Mobile (`max-lg`): taxonomy matches are shown in `MobileFilteredThumbnailGrid`; skip the spread
       * packer for filters only. Preview-linked spread still uses `previewDocked` on all viewports.
       */
      const filterSpreadOnCanvas =
        filterSpreadActive && !isMaxLgRef.current;
      return orderedLen > 0 && (filterSpreadOnCanvas || previewDocked);
    };

    const beginSpreadEnter = (now: number): boolean => {
      postLeaveContentRevealRef.current = null;
      const sysInner = systemRef.current;
      if (!sysInner || swarmSizeRef.current === 0) return false;

      const { poolIndices: orderedPick, patch: spreadPatch } =
        getSpreadPickResult();
      if (orderedPick.length === 0) return false;

      flushSync(() => {
        setSpreadDisplayPatchRef.current(spreadPatch);
      });

      const phaseBefore = spreadLayoutPhaseRef.current;
      const previousEnterSig = spreadEnterSignatureRef.current;
      const nextEnterSig = effectiveSpreadSig();
      /**
       * In-place: both filter and preview use a fresh salted `computeSpreadTargets` pack (no merge).
       * Regroup lerp in `enter` still runs; merge was the source of bad cross-tile shuffling.
       */
      const sameSpreadKind =
        (previousEnterSig ?? "").startsWith("pv:") ===
        nextEnterSig.startsWith("pv:");
      spreadInPlaceRespreadRef.current =
        (phaseBefore === "hold" || phaseBefore === "enter") && sameSpreadKind;

      if (hoverEnterDelayTimerRef.current !== null) {
        clearTimeout(hoverEnterDelayTimerRef.current);
        hoverEnterDelayTimerRef.current = null;
      }
      hoverPhaseRef.current = null;
      hoverAnimT0Ref.current = 0;
      hoverSlotRef.current = null;
      hoverPinRef.current = null;
      setHoveredIndex(null);

      spreadEnterSignatureRef.current = nextEnterSig;

      idleBlurRampT0Ref.current = null;
      idleBlurRampIndicesRef.current = null;
      idleSnapshotRef.current = sysInner.particles.map(cloneParticle);
      const cfg = sysInner.cfg;
      if (!spreadInPlaceRespreadRef.current || idleNodeWidthRef.current === null) {
        const idleW: number[] = new Array(sysInner.particles.length);
        for (let ii = 0; ii < sysInner.particles.length; ii++) {
          const el = nodeRefs.current[ii];
          const ow = el?.offsetWidth ?? 0;
          const pt = sysInner.particles[ii];
          const fallbackW = pt?.isText
            ? getThumbnailTextVariantOuterSize(thumbnailSize).width
            : thumbnailFramePx;
          idleW[ii] = ow > 0 ? ow : fallbackW;
        }
        idleNodeWidthRef.current = idleW;
      }

      const beforeSpreadSel = selectedIndicesRef.current.slice();

      let sel = orderedPick.slice();
      const f = sel.length;
      const pb = placementBoundsRef.current;
      const packSalt = ++spreadLayoutSaltRef.current;
      const filteredTargets = computeSpreadTargets(
        pb.w,
        pb.h,
        cfg.zNear,
        f,
        "lg",
        packSalt,
      );
      const fCount = Math.min(f, filteredTargets.length);
      sel = sel.slice(0, fCount);
      const nextTargets = filteredTargets.slice(0, fCount);
      spreadTargetsRef.current = nextTargets;
      spreadPrevSelectedRef.current = new Set(beforeSpreadSel);
      selectedIndicesRef.current = sel;
      setSelectedFilterIndices(sel);
      setSpreadChromeActive(true);
      filterT0Ref.current = now;
      spreadLayoutPhaseRef.current = "enter";
      spreadLayoutPlacementWhRef.current = { w: pb.w, h: pb.h };
      return true;
    };

    const tick = (now: number) => {
      const dt = clamp((now - lastTime) / 1000, 0.001, 0.05);
      lastTime = now;
      const globalTime = now / 1000;
      const speed = clamp(speedFactor || 1, 0.1, 4);

      sys.cfg = configRef.current;
      const c = sys.cfg;
      const zRange = c.zNear - c.zFar;

      const ordered = computeSpreadOrderedIndices();
      const spreadActive = computeSpreadActive(ordered.length);
      const sig = effectiveSpreadSig();

      const phaseNow = spreadLayoutPhaseRef.current;

      const spreadListMatchesOrdered =
        ordered.length === selectedIndicesRef.current.length &&
        ordered.every((v, i) => selectedIndicesRef.current[i] === v);

      /** Swap filter selection while spread is active: animate straight to new targets (no leave → idle). */
      const shouldRespreadInPlace =
        (phaseNow === "hold" || phaseNow === "enter") &&
        spreadActive &&
        ordered.length > 0 &&
        spreadEnterSignatureRef.current !== null &&
        sig !== spreadEnterSignatureRef.current;

      /** Viewport / placement shrinks or grows: capped pick list changed — reflow spread count. */
      const shouldRespreadForViewport =
        (phaseNow === "hold" || phaseNow === "enter") &&
        spreadActive &&
        ordered.length > 0 &&
        spreadEnterSignatureRef.current !== null &&
        !spreadListMatchesOrdered;

      /** Same index list and signature, but sim box w/h changed (e.g. fixed preview opened) — rebuild targets. */
      const layoutWh = spreadLayoutPlacementWhRef.current;
      const pbNow = placementBoundsRef.current;
      const shouldRespreadForPlacementBounds =
        (phaseNow === "hold" || phaseNow === "enter") &&
        spreadActive &&
        ordered.length > 0 &&
        spreadEnterSignatureRef.current !== null &&
        layoutWh !== null &&
        (Math.abs(layoutWh.w - pbNow.w) > PLACEMENT_RESPREAD_EPS ||
          Math.abs(layoutWh.h - pbNow.h) > PLACEMENT_RESPREAD_EPS);

      if (
        (shouldRespreadInPlace ||
          shouldRespreadForViewport ||
          shouldRespreadForPlacementBounds) &&
        systemRef.current
      ) {
        beginSpreadEnter(now);
      }

      const shouldLeaveSpread =
        (phaseNow === "hold" || phaseNow === "enter") &&
        (!spreadActive || ordered.length === 0);

      if (
        shouldLeaveSpread &&
        (phaseNow === "hold" || phaseNow === "enter") &&
        systemRef.current
      ) {
        const sysLeave = systemRef.current;
        leaveFromRef.current = sysLeave.particles.map((p) => ({ ...p.pos }));
        leaveScaleFromRef.current = sysLeave.particles.map((p) => p.scale);
        filterT0Ref.current = now;
        spreadLayoutPhaseRef.current = "leave";
      }

      const shouldSpreadEnter =
        spreadLayoutPhaseRef.current === "idle" &&
        spreadActive &&
        swarmSizeRef.current > 0 &&
        ordered.length > 0 &&
        (spreadEnterSignatureRef.current === null ||
          sig !== spreadEnterSignatureRef.current);

      if (shouldSpreadEnter && systemRef.current) {
        beginSpreadEnter(now);
      } else if (spreadActive && ordered.length === 0) {
        spreadEnterSignatureRef.current = sig;
      }

      const phase = spreadLayoutPhaseRef.current;
      const snap = idleSnapshotRef.current;
      const targets = spreadTargetsRef.current;
      const selIdx = selectedIndicesRef.current;

      let lifeFreeze: LifeFreezeOptions | undefined;
      if (previewRowRef.current != null) {
        lifeFreeze = { all: true };
      } else if (phase !== "idle") {
        lifeFreeze = { all: true };
      } else {
        const hs = hoverSlotRef.current;
        if (hs !== null) {
          lifeFreeze = { slots: new Set([hs]) };
        }
      }

      if (phase === "idle") {
        const skipIdleStep = idlePhysicsSkipFramesRef.current > 0;
        if (skipIdleStep) {
          idlePhysicsSkipFramesRef.current -= 1;
        } else {
          sys.step(dt, speed, globalTime, lifeFreeze);
        }
      } else {
        sys.step(dt, speed, globalTime, lifeFreeze);
      }

      const hiPin = hoverSlotRef.current;
      if (
        spreadLayoutPhaseRef.current === "idle" &&
        hiPin !== null &&
        !spreadChromeActiveRef.current
      ) {
        const pin = hoverPinRef.current;
        if (pin && pin.slot === hiPin) {
          const ph = sys.particles[hiPin];
          if (ph) {
            ph.pos = { ...pin.pos };
            ph.vel = v3(0, 0, 0);
          }
        }
      }

      const spreadAnimActive =
        phase === "enter" && snap && targets.length > 0;
      if (spreadAnimActive) {
        const elapsed = now - filterT0Ref.current;
        const u = Math.min(1, elapsed / REGROUP_MS);
        const e = smoothstep01(u);
        for (let j = 0; j < selIdx.length; j++) {
          const i = selIdx[j]!;
          const p = sys.particles[i];
          if (!p || j >= targets.length) continue;
          const start = snap[i]!.pos;
          const tgt = targets[j]!;
          p.pos = lerp3(start, tgt, e);
          p.vel = v3(0, 0, 0);
          p.opacity = clamp(snap[i]!.opacity + (1 - snap[i]!.opacity) * e, 0, 1);
        }
        const prevSpreadSel = spreadPrevSelectedRef.current;
        if (prevSpreadSel.size > 0) {
          const selSet = new Set(selIdx);
          for (const i of prevSpreadSel) {
            if (selSet.has(i)) continue;
            const p = sys.particles[i];
            const s0 = snap[i];
            if (!p || !s0) continue;
            const ideal = particleOrbitIdealPos(p, c, globalTime);
            p.pos = lerp3(s0.pos, ideal, e);
            p.vel = v3(0, 0, 0);
          }
        }
        if (u >= 1) {
          for (let j = 0; j < selIdx.length; j++) {
            const i = selIdx[j]!;
            const p = sys.particles[i];
            if (!p || j >= targets.length) continue;
            p.pos = { ...targets[j]! };
          }
          spreadLayoutPhaseRef.current = "hold";
          spreadInPlaceRespreadRef.current = false;
        }
      } else if (phase === "hold" && snap && targets.length > 0) {
        for (let j = 0; j < selIdx.length; j++) {
          const i = selIdx[j]!;
          const p = sys.particles[i];
          if (!p || j >= targets.length) continue;
          p.pos = { ...targets[j]! };
          p.vel = v3(0, 0, 0);
          p.opacity = 1;
        }
      } else if (phase === "leave" && snap) {
        const elapsed = now - filterT0Ref.current;
        const u = Math.min(1, elapsed / REGROUP_MS);
        const e = smoothstep01(u);
        const leaveFrom = leaveFromRef.current;
        const leaveScaleFrom = leaveScaleFromRef.current;
        for (let j = 0; j < selIdx.length; j++) {
          const i = selIdx[j]!;
          const p = sys.particles[i];
          const s = snap[i];
          if (!p || !s) continue;
          const startPos = leaveFrom[i] ?? s.pos;
          p.pos = lerp3(startPos, s.pos, e);
          const s0 = leaveScaleFrom[i] ?? s.scale;
          p.scale = s0 + (s.scale - s0) * e;
          p.vel = v3(0, 0, 0);
          p.opacity = clamp((1 - e) + e * s.opacity, 0, 1);
        }
        if (u >= 1) {
          for (let j = 0; j < selIdx.length; j++) {
            const i = selIdx[j]!;
            const p = sys.particles[i];
            const s = snap[i];
            if (!p || !s) continue;
            Object.assign(p, cloneParticle(s));
          }
          leaveCompleteAfterRenderRef.current = true;
        }
      }

      const wordsByRow = textWordsByRowRef.current;

      const applyParticleDomStyles = (
        passPh: SpreadLayoutPhase,
        styleNow: number,
      ) => {
        const snapForScale = idleSnapshotRef.current;
        const idleWidths = idleNodeWidthRef.current;
        let enterScaleT = 1;
        let leaveScaleT = 1;
        let dimEnterT = 0;
        let dimLeaveT = 0;
        if (passPh === "enter" && snapForScale) {
          const elapsedEnter = styleNow - filterT0Ref.current;
          if (spreadInPlaceRespreadRef.current) {
            enterScaleT = 1;
          } else {
            const uEnter = Math.min(1, elapsedEnter / REGROUP_MS);
            enterScaleT = smoothstep01(uEnter);
          }
          const uDim = Math.min(1, elapsedEnter / FILTER_DIM_MS);
          dimEnterT = smoothstep01(uDim);
        }
        if (passPh === "leave" && snapForScale) {
          const elapsedLeave = styleNow - filterT0Ref.current;
          const uLeave = Math.min(1, elapsedLeave / REGROUP_MS);
          leaveScaleT = smoothstep01(uLeave);
          const uDimL = Math.min(1, elapsedLeave / FILTER_DIM_MS);
          dimLeaveT = smoothstep01(uDimL);
        }

        const styleGlobalTime = styleNow / 1000;

        for (let i = 0; i < sys.particles.length; i++) {
          const p = sys.particles[i];
          const node = nodeRefs.current[i];
          if (!node) continue;

          const filteredSpreadActive =
            passPh !== "idle" && selectedIndicesRef.current.includes(i);
          const hoverCardActive =
            passPh === "idle" &&
            !spreadChromeActiveRef.current &&
            hoverSlotRef.current === i;
          const cardActive = filteredSpreadActive || hoverCardActive;
          const spreadLayoutBg =
            passPh !== "idle" && !selectedIndicesRef.current.includes(i);
          const hoverIdleDimmed =
            passPh === "idle" &&
            !spreadChromeActiveRef.current &&
            hoverSlotRef.current !== null &&
            hoverSlotRef.current !== i;
          /** 0 = full brightness, 1 = full dim — fades in during enter, out during leave. */
          let bgDimT = 0;
          if (spreadLayoutBg) {
            if (passPh === "enter") {
              const prevSel = spreadPrevSelectedRef.current;
              const inNewSpread = selectedIndicesRef.current.includes(i);
              const demoted = prevSel.has(i) && !inNewSpread;
              const firstSpreadFromIdle = prevSel.size === 0;
              bgDimT =
                firstSpreadFromIdle || demoted ? dimEnterT : 1;
            } else if (passPh === "hold") bgDimT = 1;
            else if (passPh === "leave") bgDimT = 1 - dimLeaveT;
          } else if (hoverIdleDimmed) {
            const hPv = hoverPhaseRef.current;
            if (hPv === "in") {
              const elapsed = styleNow - hoverAnimT0Ref.current;
              bgDimT = smoothstep01(
                Math.min(1, elapsed / HOVER_CARD_MS),
              );
            } else if (hPv === "hold") {
              bgDimT = 1;
            } else if (hPv === "out") {
              const elapsed = styleNow - hoverAnimT0Ref.current;
              const u = smoothstep01(Math.min(1, elapsed / HOVER_CARD_MS));
              bgDimT = 1 - u;
            }
          }

          const perspScale =
            c.perspective / (c.perspective - p.pos.z);
          const apparentIdle = Math.max(0, p.scale * perspScale);
          let finalScale: number;
          if (cardActive) {
            const idleW =
              idleWidths?.[i] ?? thumbnailFramePx;
            let hoverU = 1;
            if (hoverCardActive && passPh === "idle") {
              const hPv = hoverPhaseRef.current;
              if (hPv === "in") {
                const e = styleNow - hoverAnimT0Ref.current;
                hoverU = smoothstep01(Math.min(1, e / HOVER_CARD_MS));
              } else if (hPv === "hold") {
                hoverU = 1;
              } else if (hPv === "out") {
                const e = styleNow - hoverAnimT0Ref.current;
                hoverU = 1 - smoothstep01(Math.min(1, e / HOVER_CARD_MS));
              }
            }
            const lw =
              node.offsetWidth > 0
                ? node.offsetWidth
                : passPh === "hold"
                  ? filteredLgOuter.width
                  : passPh === "enter"
                    ? thumbnailFramePx +
                      (filteredLgOuter.width - thumbnailFramePx) * enterScaleT
                    : filteredLgOuter.width +
                      (thumbnailFramePx - filteredLgOuter.width) * leaveScaleT;
            if (passPh === "hold") {
              finalScale = scaleForTargetVisualWidth(
                filteredLgOuter.width,
                lw,
              );
            } else if (passPh === "enter" && snapForScale) {
              const s = snapForScale[i];
              if (s) {
                const a0 = apparentScaleFromParticle(s, c.perspective);
                const idleVisualW = idleW * a0;
                const endVisualW = filteredLgOuter.width;
                const visualW =
                  idleVisualW + (endVisualW - idleVisualW) * enterScaleT;
                finalScale = scaleForTargetVisualWidth(visualW, lw);
              } else {
                finalScale = scaleForTargetVisualWidth(
                  filteredLgOuter.width,
                  lw,
                );
              }
            } else if (passPh === "leave" && snapForScale) {
              finalScale = scaleForTargetVisualWidth(
                idleW * apparentIdle,
                lw,
              );
            } else if (hoverCardActive && passPh === "idle") {
              const idleVisualW = idleW * apparentIdle;
              const endVisualW = filteredLgOuter.width;
              const visualW =
                idleVisualW + (endVisualW - idleVisualW) * hoverU;
              finalScale = scaleForTargetVisualWidth(visualW, lw);
            } else {
              finalScale = scaleForTargetVisualWidth(
                filteredLgOuter.width,
                lw,
              );
            }
          } else {
            const refPx =
              idleWidths?.[i] ??
              (p.isText
                ? getThumbnailTextVariantOuterSize(thumbnailSize).width
                : thumbnailFramePx);
            // Idle wrapper width is fixed in CSS (sm frame / text outer). Measuring
            // offsetWidth can differ per tile (subpixel, font, layout timing) after
            // lg→sm swap — only "spread" tiles swap, which matches "only some" pops.
            const lwIdle = refPx;
            const prevSel = spreadPrevSelectedRef.current;
            const demotedCard =
              passPh === "enter" &&
              prevSel.has(i) &&
              !selectedIndicesRef.current.includes(i);
            if (demotedCard && snapForScale) {
              const uDem = Math.min(
                1,
                (styleNow - filterT0Ref.current) / REGROUP_MS,
              );
              const demoteE = smoothstep01(uDem);
              const idleVisualW = refPx * apparentIdle;
              const cardOuterW = filteredLgOuter.width;
              const visualW =
                cardOuterW * (1 - demoteE) + idleVisualW * demoteE;
              const lwBlend = cardOuterW * (1 - demoteE) + lwIdle * demoteE;
              finalScale = scaleForTargetVisualWidth(visualW, lwBlend);
            } else {
              finalScale = scaleForTargetVisualWidth(
                refPx * apparentIdle,
                lwIdle,
              );
            }
          }
          const zIndex = Math.round(
            ((p.pos.z - c.zFar) / zRange) * 1000
          );

          const psFar = c.perspective / (c.perspective - c.zFar);
          const psNear = c.perspective / (c.perspective - c.zNear);
          const apparentMin = c.baseScaleMin * psFar;
          const apparentMax = c.baseScaleMax * psNear * 1.12;
          const span = Math.max(1e-4, apparentMax - apparentMin);
          const sizeT = clamp((finalScale - apparentMin) / span, 0, 1);
          const gate = Math.max(1e-4, c.blurFarGate);
          const farBlend = clamp((gate - sizeT) / gate, 0, 1);
          let blurPx = c.blurMax * farBlend * farBlend;
          if (
            IDLE_DEPTH_BLUR_DISABLED ||
            cardActive ||
            spreadLayoutBg ||
            hoverIdleDimmed
          ) {
            blurPx = 0;
          }
          else {
            const t0 = idleBlurRampT0Ref.current;
            const rampSet = idleBlurRampIndicesRef.current;
            if (t0 != null && rampSet?.has(i)) {
              const BLUR_RAMP_MS = 120;
              const e = styleNow - t0;
              if (e < BLUR_RAMP_MS) {
                blurPx *= smoothstep01(e / BLUR_RAMP_MS);
              } else {
                idleBlurRampT0Ref.current = null;
                idleBlurRampIndicesRef.current = null;
              }
            }
          }

          const dimOpacityMul =
            1 + (FILTER_BG_OPACITY_MUL - 1) * bgDimT;
          let outOpacity = clamp(p.opacity * dimOpacityMul, 0, 1);
          if (passPh === "leave" && cardActive) {
            const dr = displayContentRowsRef.current[i];
            const sr = swarmRowsRef.current[i];
            if (dr && sr && dr.id !== sr.id) {
              const uL = Math.min(
                1,
                (styleNow - filterT0Ref.current) / REGROUP_MS,
              );
              const uExit = smoothstep01(
                Math.max(
                  0,
                  Math.min(
                    1,
                    (uL - PATCHED_ROW_EXIT_FADE_START_U) /
                      (1 - PATCHED_ROW_EXIT_FADE_START_U),
                  ),
                ),
              );
              outOpacity *= 1 - uExit;
            }
          } else if (passPh === "idle") {
            const prc = postLeaveContentRevealRef.current;
            if (prc?.slots.has(i)) {
              const tr =
                (styleNow - prc.t0) / POST_LEAVE_SWARM_REVEAL_MS;
              outOpacity *= smoothstep01(Math.min(1, tr));
            }
          }

          /** Hovered card stays at full alpha (depth/sim can make `p.opacity` < 1 for other tiles). */
          if (hoverCardActive) {
            outOpacity = 1;
          }

          const filterParts: string[] = [];
          if (blurPx >= 0.03) {
            filterParts.push(`blur(${blurPx.toFixed(2)}px)`);
          }
          if (bgDimT > 0) {
            filterParts.push(
              `grayscale(${(FILTER_BG_GRAYSCALE_MAX * bgDimT).toFixed(3)})`,
            );
            filterParts.push(
              `saturate(${(1 - FILTER_BG_DESAT_MUL * bgDimT).toFixed(3)})`,
            );
          }

          node.style.transform = `translate3d(${p.pos.x.toFixed(1)}px, ${p.pos.y.toFixed(1)}px, 0px) scale(${finalScale.toFixed(4)})`;
          node.style.opacity = outOpacity.toFixed(3);
          node.style.zIndex = String(
            zIndex +
              (cardActive
                ? 2000
                : spreadLayoutBg || hoverIdleDimmed
                  ? 1000
                  : 0),
          );
          node.style.filter = filterParts.length ? filterParts.join(" ") : "none";

          if (p.isText) {
            if (cardActive) {
              const img = imgRefs.current[i];
              const row = displayContentRowsRef.current[i];
              if (img && row) {
                syncImgToContentRow(img, row);
              }
            } else {
              const textEl = textRefs.current[i];
              if (textEl) {
                const row = displayContentRowsRef.current[i];
                const useFull = idleTextFullTitleRef.current;
                const rowWords = wordsByRow[i];
                const chunk = useFull
                  ? (row?.shortTitle ?? "")
                  : (rowWords?.[p.textChunkIndex] ?? rowWords?.[0] ?? "");
                if (chunk !== "") {
                  const scrambled = scrambleWord(
                    chunk,
                    p.seed,
                    styleGlobalTime,
                  );
                  if (textEl.textContent !== scrambled) {
                    textEl.textContent = scrambled;
                  }
                  const idxKey = useFull ? "full" : String(p.textChunkIndex);
                  if (textEl.dataset.idx !== idxKey) {
                    textEl.dataset.idx = idxKey;
                  }
                }
              }
            }
          } else {
            const img = imgRefs.current[i];
            const row = displayContentRowsRef.current[i];
            if (img && row) {
              syncImgToContentRow(img, row);
            }
          }
        }
        const prcDone = postLeaveContentRevealRef.current;
        if (
          prcDone &&
          passPh === "idle" &&
          styleNow - prcDone.t0 >= POST_LEAVE_SWARM_REVEAL_MS
        ) {
          postLeaveContentRevealRef.current = null;
        }
      };

      const ph = spreadLayoutPhaseRef.current;
      const finishingLeave = leaveCompleteAfterRenderRef.current;

      if (finishingLeave) {
        leaveCompleteAfterRenderRef.current = false;
        const snapDone = idleSnapshotRef.current;
        const selLeave = [...selectedIndicesRef.current];
        const revealSlots = new Set<number>();
        for (const i of selLeave) {
          const dr = displayContentRowsRef.current[i];
          const sr = swarmRowsRef.current[i];
          if (dr && sr && dr.id !== sr.id) revealSlots.add(i);
        }
        if (revealSlots.size > 0) {
          postLeaveContentRevealRef.current = {
            t0: performance.now(),
            slots: revealSlots,
          };
        } else {
          postLeaveContentRevealRef.current = null;
        }
        if (snapDone && sys) {
          for (const si of selLeave) {
            const s = snapDone[si];
            if (s) sys.particles[si] = cloneParticle(s);
          }
        }
        idleSnapshotRef.current = null;
        spreadTargetsRef.current = [];
        selectedIndicesRef.current = [];
        flushSync(() => {
          setSpreadDisplayPatchRef.current(null);
          setSelectedFilterIndices([]);
          setSpreadChromeActive(false);
        });
        spreadLayoutPhaseRef.current = "idle";
        spreadInPlaceRespreadRef.current = false;
        spreadLayoutPlacementWhRef.current = null;
        spreadEnterSignatureRef.current = null;
        idleBlurRampIndicesRef.current = new Set(selLeave);
        idleBlurRampT0Ref.current = performance.now();
        idlePhysicsSkipFramesRef.current = 4;
        applyParticleDomStyles("idle", performance.now());
      } else {
        if (
          hoverPhaseRef.current === "in" &&
          now - hoverAnimT0Ref.current >= HOVER_CARD_MS
        ) {
          hoverPhaseRef.current = "hold";
        }
        applyParticleDomStyles(ph, now);
        if (
          hoverPhaseRef.current === "out" &&
          now - hoverAnimT0Ref.current >= HOVER_CARD_MS
        ) {
          hoverPhaseRef.current = null;
          hoverSlotRef.current = null;
          hoverPinRef.current = null;
          setHoveredIndex(null);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    swarmRows.length,
    contentCatalog.length,
    speedFactor,
    placementBounds.w,
    placementBounds.h,
    textIndexSet,
    thumbnailFramePx,
    thumbnailSize,
    filteredLgOuter.width,
    filterMatchMode,
    textWordsByRow,
    selectedFormats,
    selectedNetworks,
  ]);

  return (
    <section
      className={`fixed inset-0 z-30 overflow-hidden ${rootClassName ?? ""}`}
      style={{ perspective: `${config.perspective}px` }}
      aria-label="3D image particle simulation"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const t = e.target;
        if (t instanceof Element) {
          if (t.closest("[data-canvas-tile]")) return;
          /**
           * Portaled preview (`createPortal(…, document.body)`) still bubbles in the **React** tree
           * to this section; a primary button hit must not run `resetToIdle`.
           */
          if (t.closest("[data-fae-content-preview]")) return;
        }
        clearIdleHoverState();
        resetToIdle();
      }}
    >
      <div
        className="absolute transition-[left,top,width,height] duration-500 ease-in-out motion-reduce:duration-0 motion-reduce:transition-none max-lg:transition-none max-lg:duration-0"
        style={{
          left: placementBounds.cx,
          top: placementBounds.cy,
          width: placementBounds.w,
          height: placementBounds.h,
          transform: "translate(-50%, -50%)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        {displayContentRows.map((row, i) => {
          const isText = textIndexSet.has(i);
          const showFilteredCard =
            selectedFilterSet.has(i) && spreadChromeActive;
          const showHoverCard = hoveredIndex === i && !spreadChromeActive;
          const showChromeCard = showFilteredCard || showHoverCard;
          const spreadDimmed = spreadChromeActive && !showFilteredCard;
          /** Preview: a tile in the active filter spread, or any output tile while idle (orbit). */
          const opensPreviewOnClick = showFilteredCard || !spreadChromeActive;

          if (isText) {
            const rowWords = textWordsByRow[i] ?? [];
            const widx = pickIdleTextWordIndex(i, rowWords.length);
            const chunk = idleTextFullTitle
              ? row.shortTitle
              : (rowWords[widx] ??
                row.shortTitle.split(/\s+/)[0] ??
                "TEXT");

            return (
              <div
                key={`swarm-tile-text-${i}`}
                data-canvas-tile
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className={`absolute left-1/2 top-1/2 will-change-[transform,opacity,filter] ${
                  opensPreviewOnClick ? "cursor-pointer " : ""
                }${spreadDimmed ? "pointer-events-none" : "pointer-events-auto"}`}
                onPointerEnter={() => {
                  handleTilePointerEnter(i);
                  if (opensPreviewOnClick) {
                    prefetchOutputDetailOnHover(row.id);
                  }
                }}
                onPointerLeave={() => {
                  handleTilePointerLeave(i);
                }}
                onClick={
                  opensPreviewOnClick
                    ? (e) => {
                        e.stopPropagation();
                        handleTilePreviewClick(row, i);
                      }
                    : undefined
                }
                style={{
                  // transform/opacity are driven only by the RAF loop — putting them
                  // here caused React to reset scale(0) on re-renders that touch layout chrome.
                  ...(showChromeCard
                    ? {
                        marginLeft: `${-filteredLgOuter.width / 2}px`,
                        marginTop: `${-filteredLgOuter.height / 2}px`,
                      }
                    : {
                        width: `${textIdleOuter.width}px`,
                        height: `${textIdleOuter.height}px`,
                        marginLeft: `${-textIdleOuter.width / 2}px`,
                        marginTop: `${-textIdleOuter.height / 2}px`,
                      }),
                }}
              >
                {showChromeCard ? (
                  <Thumbnail
                    variant="full"
                    size="lg"
                    label={row.shortTitle}
                    imageSrc={row.imageUrl}
                    imageAlt={row.shortTitle}
                    labelRef={(el) => {
                      textRefs.current[i] = el;
                    }}
                    imageRef={(el) => {
                      imgRefs.current[i] = el;
                    }}
                    accessibilityLabel={row.shortTitle}
                  />
                ) : (
                  <Thumbnail
                    variant="text"
                    size={thumbnailSize}
                    label={chunk}
                    labelRef={(el) => {
                      textRefs.current[i] = el;
                    }}
                    accessibilityLabel={chunk}
                  />
                )}
              </div>
            );
          }

          return (
            <div
              key={`swarm-tile-${i}`}
              data-canvas-tile
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className={`absolute left-1/2 top-1/2 will-change-[transform,opacity,filter] ${
                opensPreviewOnClick ? "cursor-pointer " : ""
              }${spreadDimmed ? "pointer-events-none" : "pointer-events-auto"}`}
              onPointerEnter={() => {
                handleTilePointerEnter(i);
                if (opensPreviewOnClick) {
                  prefetchOutputDetailOnHover(row.id);
                }
              }}
              onPointerLeave={() => {
                handleTilePointerLeave(i);
              }}
              onClick={
                opensPreviewOnClick
                  ? (e) => {
                      e.stopPropagation();
                      handleTilePreviewClick(row, i);
                    }
                  : undefined
              }
              style={
                showChromeCard
                  ? {
                      marginLeft: `${-filteredLgOuter.width / 2}px`,
                      marginTop: `${-filteredLgOuter.height / 2}px`,
                    }
                  : {
                      width: `${thumbnailFramePx}px`,
                      height: `${thumbnailFramePx}px`,
                      marginLeft: `${-thumbnailFramePx / 2}px`,
                      marginTop: `${-thumbnailFramePx / 2}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }
              }
            >
              <div
                style={
                  showChromeCard
                    ? undefined
                    : {
                        transform: `scale(${idleOrbitThumbScale})`,
                        transformOrigin: "center center",
                        willChange: "transform",
                      }
                }
              >
                <Thumbnail
                  variant="full"
                  size="lg"
                  showLabelChip={showChromeCard}
                  label={row.shortTitle}
                  imageSrc={row.imageUrl}
                  imageAlt={row.shortTitle}
                  imageRef={(el) => {
                    imgRefs.current[i] = el;
                  }}
                />
              </div>
            </div>
          );
        })}
        </div>
      </div>
      {previewRow
        ? createPortal(
            <PreviewView
              row={previewRow}
              fullScreen={previewFullScreen}
              onFullScreenChange={setPreviewFullScreen}
            />,
            document.body,
          )
        : null}
      {placementDebug ? (
        <PlacementBoundsDebugOverlay
          bounds={placementBounds}
          stats={placementDebugStats}
        />
      ) : null}
    </section>
  );
}
