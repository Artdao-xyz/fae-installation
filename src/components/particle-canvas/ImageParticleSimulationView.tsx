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
import { getFilterSubpanelColumnWidthPx } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { getMarginGuideInsetPx } from "@/lib/margin-guide";
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
} from "./particle-system";
import {
  computeSpreadTargets,
  pickSpreadIndicesFromRows,
  REGROUP_MS,
  FILTER_DIM_MS,
  HOVER_CARD_MS,
  HOVER_ENTER_DELAY_MS,
  FILTER_BG_OPACITY_MUL,
  type FilterMatchMode,
  type SpreadLayoutPhase,
} from "./image-particle-spread";
import { scaleForTargetVisualWidth } from "./image-particle-scale";
import { extractWordsFromTitle, scrambleWord } from "./image-particle-scramble";
import type {
  ImageParticleSimulationMode,
  ImageParticleSimulationStats,
} from "./image-particle-types";

const ROW_IMAGE_ATTR = "data-row-image";

/** Imperative sync so slot `i` always shows `row`’s URL (avoids stale src when React reuses `<img>`). */
function syncImgToContentRow(
  img: HTMLImageElement,
  row: ContentRow,
): void {
  if (
    img.dataset.idx !== row.id ||
    img.getAttribute(ROW_IMAGE_ATTR) !== row.imageUrl
  ) {
    img.src = row.imageUrl;
    img.alt = row.shortTitle;
    img.title = row.shortTitle;
    img.dataset.idx = row.id;
    img.setAttribute(ROW_IMAGE_ATTR, row.imageUrl);
  }
}

type PlacementBounds = { cx: number; cy: number; w: number; h: number };

function approxEqualPlacementBounds(a: PlacementBounds, b: PlacementBounds) {
  const eps = 0.5;
  return (
    Math.abs(a.cx - b.cx) <= eps &&
    Math.abs(a.cy - b.cy) <= eps &&
    Math.abs(a.w - b.w) <= eps &&
    Math.abs(a.h - b.h) <= eps
  );
}

export type ImageParticleSimulationViewProps = {
  mode: ImageParticleSimulationMode;
  imageLimit?: number;
  fetchedWidth: number;
  fetchedHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  speedFactor: number;
  onStatsChange?: (stats: ImageParticleSimulationStats) => void;
  config: SimConfig;
  /** Idle text tiles: full `shortTitle` vs one keyword (default full title). Leva can override in dev. */
  idleTextFullTitle?: boolean;
  /**
   * When set, idle orbit + spread packing use this element’s screen rect (clipped on the
   * right when the preview panel is open to match its fixed width). Omit to use the full window.
   */
  placementContainerRef?: RefObject<HTMLElement | null>;
  /**
   * How spread rows are chosen from Focus + Activity selections.
   * Default `union` (OR / cumulative). Leva can set `intersection` (AND) to compare.
   */
  filterMatchMode?: FilterMatchMode;
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
}: ImageParticleSimulationViewProps) {
  const filterMatchMode = filterMatchModeProp ?? "union";
  const filterMatchModeRef = useRef(filterMatchMode);
  filterMatchModeRef.current = filterMatchMode;

  const {
    selectedFocusAreas,
    selectedActivityTypes,
    filtersPanelOpen,
    filterSubpanelsOpen,
    setFiltersFromContentRow,
    registerContentPreviewOpener,
    contentCatalog,
    contentCatalogError,
    contentCatalogTotal,
    contentCatalogFetchMs,
  } = useFilterSelection();

  const idleTextFullTitleRef = useRef(idleTextFullTitle);
  idleTextFullTitleRef.current = idleTextFullTitle;

  const spreadSelectionRef = useRef({
    focus: selectedFocusAreas,
    activity: selectedActivityTypes,
  });
  spreadSelectionRef.current = {
    focus: selectedFocusAreas,
    activity: selectedActivityTypes,
  };

  const spreadSig = useMemo(
    () =>
      [...selectedFocusAreas].sort().join("\0") +
      "|" +
      [...selectedActivityTypes].sort().join("\0"),
    [selectedFocusAreas, selectedActivityTypes],
  );
  const spreadSignatureRef = useRef("");
  spreadSignatureRef.current = spreadSig;

  const [previewRow, setPreviewRow] = useState<ContentRow | null>(null);
  const [previewFullScreen, setPreviewFullScreen] = useState(false);
  const previewRowRef = useRef<ContentRow | null>(null);
  previewRowRef.current = previewRow;

  const closePreview = useCallback(() => {
    setPreviewRow(null);
  }, []);

  const handleFilteredThumbnailClick = useCallback(
    (row: ContentRow) => {
      setFiltersFromContentRow(row);
      setPreviewRow(row);
    },
    [setFiltersFromContentRow],
  );

  useEffect(() => {
    registerContentPreviewOpener(handleFilteredThumbnailClick);
    return () => registerContentPreviewOpener(null);
  }, [registerContentPreviewOpener, handleFilteredThumbnailClick]);

  useEffect(() => {
    setPreviewFullScreen(false);
  }, [previewRow?.id]);

  /** Catalog rows are slim (no `Text` / `Resources`); hydrate full output for preview. */
  useEffect(() => {
    const id = previewRow?.id;
    if (!id) return;
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(
          `/api/strapi/outputs/${encodeURIComponent(id)}`,
          { signal: ac.signal, credentials: "same-origin" },
        );
        if (!res.ok) return;
        const body: unknown = await res.json();
        if (
          ac.signal.aborted ||
          !body ||
          typeof body !== "object" ||
          !("row" in body)
        ) {
          return;
        }
        const row = (body as { row: ContentRow }).row;
        setPreviewRow((prev) => (prev?.id === id ? { ...prev, ...row } : prev));
      } catch {
        /* aborted or network */
      }
    })();
    return () => ac.abort();
  }, [previewRow?.id]);

  const spreadEnterSignatureRef = useRef<string | null>(null);

  // ---- State ----
  const [contentRows, setContentRows] = useState<ContentRow[]>([]);
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

  const clearHoverEnterDelay = useCallback(() => {
    if (hoverEnterDelayTimerRef.current !== null) {
      clearTimeout(hoverEnterDelayTimerRef.current);
      hoverEnterDelayTimerRef.current = null;
    }
  }, []);

  const handleTilePointerEnter = useCallback(
    (index: number) => {
      if (spreadChromeActive) return;
      clearHoverEnterDelay();
      const sys = systemRef.current;
      const p = sys?.particles[index];
      if (!p) return;
      hoverEnterDelayTimerRef.current = setTimeout(() => {
        hoverEnterDelayTimerRef.current = null;
        if (spreadChromeActiveRef.current) return;
        const sysInner = systemRef.current;
        const pt = sysInner?.particles[index];
        if (!pt) return;
        const t = performance.now();
        hoverPhaseRef.current = "in";
        hoverAnimT0Ref.current = t;
        hoverSlotRef.current = index;
        hoverPinRef.current = { slot: index, pos: { ...pt.pos } };
        setHoveredIndex(index);
      }, HOVER_ENTER_DELAY_MS);
    },
    [clearHoverEnterDelay, spreadChromeActive],
  );

  const handleTilePointerLeave = useCallback(
    (index: number) => {
      clearHoverEnterDelay();
      if (hoverSlotRef.current !== index) return;
      hoverPhaseRef.current = "out";
      hoverAnimT0Ref.current = performance.now();
    },
    [clearHoverEnterDelay],
  );

  useEffect(() => {
    if (!spreadChromeActive) return;
    clearHoverEnterDelay();
    hoverPhaseRef.current = null;
    hoverAnimT0Ref.current = 0;
    hoverSlotRef.current = null;
    hoverPinRef.current = null;
    setHoveredIndex(null);
  }, [spreadChromeActive, clearHoverEnterDelay]);

  useEffect(() => {
    return () => clearHoverEnterDelay();
  }, [clearHoverEnterDelay]);

  const idleSnapshotRef = useRef<Particle[] | null>(null);
  /** Inner spread slots — filter-matching tiles (center-first). */
  const spreadTargetsRef = useRef<Vec3[]>([]);
  const selectedIndicesRef = useRef<number[]>([]);
  const filterT0Ref = useRef(0);
  const spreadLayoutPhaseRef = useRef<SpreadLayoutPhase>("idle");
  /** True during enter after swapping filters in place — skip scale/dim ramp (already at full card). */
  const spreadInPlaceRespreadRef = useRef(false);
  const leaveFromRef = useRef<Vec3[]>([]);
  const leaveScaleFromRef = useRef<number[]>([]);
  /** Per-index `offsetWidth` at filter-on (idle DOM), for scale continuity vs thumbnailFramePx guess. */
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
    () => contentRows.map((r) => extractWordsFromTitle(r.title)),
    [contentRows],
  );

  const textIndexSet = useMemo(() => {
    const count = contentRows.length;
    if (count === 0) return new Set<number>();
    const set = new Set<number>();
    const textCount = Math.max(1, Math.floor(count * TEXT_PARTICLE_RATIO));
    const step = Math.floor(count / textCount);
    for (let t = 0; t < textCount; t++) {
      const idx =
        (t * step +
          Math.floor(seededRand(t + 777.3) * step * 0.4)) %
        count;
      set.add(idx);
    }
    return set;
  }, [contentRows.length]);

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

  const textIdleOuter = useMemo(
    () => getThumbnailTextVariantOuterSize(thumbnailSize),
    [thumbnailSize],
  );

  const selectedFilterSet = useMemo(
    () => new Set(selectedFilterIndices),
    [selectedFilterIndices],
  );

  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const textRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const systemRef = useRef<ParticleSystem | null>(null);
  const configRef = useRef<SimConfig>(config);
  configRef.current = config;
  const textWordsByRowRef = useRef(textWordsByRow);
  textWordsByRowRef.current = textWordsByRow;

  // ---- Placement (main column below hero; minus preview drawer when open) ----
  useLayoutEffect(() => {
    /** Width reserved on the right: margin guide inset + docked preview panel (matches `PreviewView`). */
    const previewRightReservationPx = () => {
      if (!previewRow) return 0;
      if (previewFullScreen) return 0;
      const vw = window.innerWidth;
      const inset = getMarginGuideInsetPx();
      const panelW = getFilterSubpanelColumnWidthPx(vw);
      return inset + panelW;
    };

    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const reservedRight = previewRightReservationPx();
      const rightLimit = vw - reservedRight;

      /**
       * Filter panel closed: match fixed hero — orbit uses full viewport width (minus preview
       * reservation) centered on screen. Panel open: use main column rect (sidebar toggles width).
       */
      if (!filtersPanelOpen) {
        const w = Math.max(64, vw - reservedRight);
        const next: PlacementBounds = {
          cx: vw / 2,
          cy: vh / 2,
          w,
          h: vh,
        };
        setPlacementBounds((prev) =>
          approxEqualPlacementBounds(prev, next) ? prev : next,
        );
        return;
      }

      const el = placementContainerRef?.current;
      if (!el) {
        const w = Math.max(64, rightLimit);
        const next: PlacementBounds = {
          cx: vw / 2,
          cy: vh / 2,
          w,
          h: vh,
        };
        setPlacementBounds((prev) =>
          approxEqualPlacementBounds(prev, next) ? prev : next,
        );
        return;
      }
      const r = el.getBoundingClientRect();
      const left = r.left;
      const top = r.top;
      const right = Math.min(r.right, rightLimit);
      let width = Math.max(64, right - left);
      const height = Math.max(64, r.bottom - top);
      let cx = left + width / 2;
      /** Keep orbit center + width as if domain subpanels were closed (only extra column shifts main). */
      if (filterSubpanelsOpen) {
        const subW = getFilterSubpanelColumnWidthPx(vw);
        cx -= subW / 2;
        width += subW;
      }
      const next: PlacementBounds = {
        cx,
        cy: top + height / 2,
        w: width,
        h: height,
      };
      setPlacementBounds((prev) =>
        approxEqualPlacementBounds(prev, next) ? prev : next,
      );
    };

    measure();
    const el = placementContainerRef?.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [
    placementContainerRef,
    previewRow,
    previewFullScreen,
    filtersPanelOpen,
    filterSubpanelsOpen,
  ]);

  // ---- Catalog from Strapi (single shared fetch in FilterSelectionProvider) ----
  useEffect(() => {
    setFetchError(contentCatalogError);
    setFetchDurationMs(contentCatalogFetchMs);
    const capped =
      imageLimit !== undefined && imageLimit > 0
        ? contentCatalog.slice(0, imageLimit)
        : [...contentCatalog];
    setContentRows(capped);
    setContentTotal(contentCatalogTotal);
  }, [
    contentCatalog,
    contentCatalogError,
    contentCatalogFetchMs,
    contentCatalogTotal,
    imageLimit,
  ]);

  // ---- Preload images ----
  useEffect(() => {
    setLoadedCount(0);
    setErrorCount(0);
    setLoadDurationMs(null);
    if (contentRows.length === 0) return;

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
      if (handled >= contentRows.length)
        setLoadDurationMs(Math.round(performance.now() - start));
    };

    for (const row of contentRows) {
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
      img.src = row.imageUrl;
      if (img.complete) settle(img.naturalWidth === 0);
    }

    return () => {
      cancelled = true;
    };
  }, [contentRows]);

  // ---- Stats ----
  const totalImages = contentRows.length;
  const loadDone =
    totalImages > 0 && loadedCount + errorCount >= totalImages;

  useEffect(() => {
    onStatsChange?.({
      loadedCount,
      errorCount,
      loadDurationMs,
      contentRowsCount: contentRows.length,
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
    contentRows.length,
    contentTotal,
    fetchDurationMs,
    fetchError,
    totalImages,
    loadDone,
    onStatsChange,
  ]);

  // ---- Init system (respawn only when row count / text words change) ----
  useEffect(() => {
    if (contentRows.length === 0) {
      systemRef.current = null;
      return;
    }
    const sys = new ParticleSystem();
    sys.cfg = { ...configRef.current };
    sys.init(
      contentRows.length,
      textWordsByRowRef.current,
      placementBounds.w,
      placementBounds.h,
    );

    systemRef.current = sys;
  }, [contentRows, textWordsByRow]);

  // ---- Viewport for physics: resize without respawning (sidebar / subpanels / window) ----
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys || contentRows.length === 0) return;
    sys.resize(placementBounds.w, placementBounds.h);
  }, [placementBounds.w, placementBounds.h, contentRows.length]);

  // ---- Animation loop ----
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys || contentRows.length === 0) return;

    let rafId = 0;
    let lastTime = performance.now();

    const beginSpreadEnter = (now: number): boolean => {
      const sysInner = systemRef.current;
      if (!sysInner || contentRows.length === 0) return false;

      const selPick = spreadSelectionRef.current;
      const orderedPick = pickSpreadIndicesFromRows(
        contentRows,
        textIndexSet,
        selPick.focus,
        selPick.activity,
        filterMatchModeRef.current,
      );
      if (orderedPick.length === 0) return false;

      const phaseBefore = spreadLayoutPhaseRef.current;
      spreadInPlaceRespreadRef.current =
        phaseBefore === "hold" || phaseBefore === "enter";

      if (hoverEnterDelayTimerRef.current !== null) {
        clearTimeout(hoverEnterDelayTimerRef.current);
        hoverEnterDelayTimerRef.current = null;
      }
      hoverPhaseRef.current = null;
      hoverAnimT0Ref.current = 0;
      hoverSlotRef.current = null;
      hoverPinRef.current = null;
      setHoveredIndex(null);

      const sigNow = spreadSignatureRef.current;
      spreadEnterSignatureRef.current = sigNow;

      idleBlurRampT0Ref.current = null;
      idleBlurRampIndicesRef.current = null;
      idleSnapshotRef.current = sysInner.particles.map(cloneParticle);
      const cfg = sysInner.cfg;
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

      let sel = orderedPick.slice();
      const f = sel.length;
      const filteredTargets = computeSpreadTargets(
        placementBounds.w,
        placementBounds.h,
        cfg.zNear,
        f,
        "lg",
      );
      const fCount = Math.min(f, filteredTargets.length);
      sel = sel.slice(0, fCount);
      spreadTargetsRef.current = filteredTargets.slice(0, fCount);
      selectedIndicesRef.current = sel;
      setSelectedFilterIndices(sel);
      setSpreadChromeActive(true);
      filterT0Ref.current = now;
      spreadLayoutPhaseRef.current = "enter";
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

      const sel = spreadSelectionRef.current;
      const spreadActive = sel.focus.size > 0 || sel.activity.size > 0;
      const sig = spreadSignatureRef.current;

      const ordered = pickSpreadIndicesFromRows(
        contentRows,
        textIndexSet,
        sel.focus,
        sel.activity,
        filterMatchModeRef.current,
      );

      const phaseNow = spreadLayoutPhaseRef.current;

      /** Swap filter selection while spread is active: animate straight to new targets (no leave → idle). */
      const shouldRespreadInPlace =
        (phaseNow === "hold" || phaseNow === "enter") &&
        spreadActive &&
        ordered.length > 0 &&
        spreadEnterSignatureRef.current !== null &&
        sig !== spreadEnterSignatureRef.current;

      if (shouldRespreadInPlace && systemRef.current) {
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
        contentRows.length > 0 &&
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
          if (spreadInPlaceRespreadRef.current) {
            enterScaleT = 1;
            dimEnterT = 1;
          } else {
            const elapsedEnter = styleNow - filterT0Ref.current;
            const uEnter = Math.min(1, elapsedEnter / REGROUP_MS);
            enterScaleT = smoothstep01(uEnter);
            const uDim = Math.min(1, elapsedEnter / FILTER_DIM_MS);
            dimEnterT = smoothstep01(uDim);
          }
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
              bgDimT = spreadInPlaceRespreadRef.current ? 1 : dimEnterT;
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
            finalScale = scaleForTargetVisualWidth(
              refPx * apparentIdle,
              lwIdle,
            );
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
          if (cardActive || spreadLayoutBg || hoverIdleDimmed) blurPx = 0;
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
          const outOpacity = clamp(p.opacity * dimOpacityMul, 0, 1);

          const filterParts: string[] = [];
          if (blurPx >= 0.03) {
            filterParts.push(`blur(${blurPx.toFixed(2)}px)`);
          }
          if (bgDimT > 0) {
            filterParts.push(`grayscale(${(0.5 * bgDimT).toFixed(3)})`);
            filterParts.push(
              `saturate(${(1 - 0.45 * bgDimT).toFixed(3)})`,
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
              const row = contentRows[i];
              if (img && row) {
                syncImgToContentRow(img, row);
              }
            } else {
              const textEl = textRefs.current[i];
              if (textEl) {
                const row = contentRows[i];
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
            const row = contentRows[i];
            if (img && row) {
              syncImgToContentRow(img, row);
            }
          }
        }
      };

      const ph = spreadLayoutPhaseRef.current;
      const finishingLeave = leaveCompleteAfterRenderRef.current;

      if (finishingLeave) {
        leaveCompleteAfterRenderRef.current = false;
        const snapDone = idleSnapshotRef.current;
        const selLeave = [...selectedIndicesRef.current];
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
          setSelectedFilterIndices([]);
          setSpreadChromeActive(false);
        });
        spreadLayoutPhaseRef.current = "idle";
        spreadInPlaceRespreadRef.current = false;
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
    contentRows,
    speedFactor,
    placementBounds.w,
    placementBounds.h,
    textIndexSet,
    thumbnailFramePx,
    thumbnailSize,
    filteredLgOuter.width,
    filterMatchMode,
  ]);

  return (
    <section
      className="fixed inset-0 z-0 overflow-hidden"
      style={{ perspective: `${config.perspective}px` }}
      aria-label="3D image particle simulation"
    >
      <div
        className="absolute"
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
        {contentRows.map((row, i) => {
          const isText = textIndexSet.has(i);
          const showFilteredCard =
            selectedFilterSet.has(i) && spreadChromeActive;
          const showHoverCard = hoveredIndex === i && !spreadChromeActive;
          const showChromeCard = showFilteredCard || showHoverCard;
          const spreadDimmed = spreadChromeActive && !showFilteredCard;
          /** Preview opens only from a tile in the active filter spread (not in idle hover). */
          const opensPreviewOnClick = showFilteredCard;

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
                key={`text-${row.id}`}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className={`absolute left-1/2 top-1/2 will-change-[transform,opacity,filter] ${
                  opensPreviewOnClick ? "cursor-pointer " : ""
                }${spreadDimmed ? "pointer-events-none" : "pointer-events-auto"}`}
                onPointerEnter={() => handleTilePointerEnter(i)}
                onPointerLeave={() => handleTilePointerLeave(i)}
                onClick={
                  opensPreviewOnClick
                    ? (e) => {
                        e.stopPropagation();
                        handleFilteredThumbnailClick(row);
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
              key={row.id}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className={`absolute left-1/2 top-1/2 will-change-[transform,opacity,filter] ${
                opensPreviewOnClick ? "cursor-pointer " : ""
              }${spreadDimmed ? "pointer-events-none" : "pointer-events-auto"}`}
              onPointerEnter={() => handleTilePointerEnter(i)}
              onPointerLeave={() => handleTilePointerLeave(i)}
              onClick={
                opensPreviewOnClick
                  ? (e) => {
                      e.stopPropagation();
                      handleFilteredThumbnailClick(row);
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
                    }
              }
            >
              {showChromeCard ? (
                <Thumbnail
                  variant="full"
                  size="lg"
                  label={row.shortTitle}
                  imageSrc={row.imageUrl}
                  imageAlt={row.shortTitle}
                  imageRef={(el) => {
                    imgRefs.current[i] = el;
                  }}
                />
              ) : (
                <Thumbnail
                  variant="image"
                  size={thumbnailSize}
                  label={row.shortTitle}
                  imageSrc={row.imageUrl}
                  imageAlt={row.shortTitle}
                  imageRef={(el) => {
                    imgRefs.current[i] = el;
                  }}
                />
              )}
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
              onClose={closePreview}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
