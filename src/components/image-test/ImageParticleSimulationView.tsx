"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useFilterSelection } from "@/components/ui/filter-menu/FilterSelectionContext";
import { listContent } from "@/lib/content-repository";
import type { ContentFixtureRow } from "@/data/content-fixture";
import {
  Thumbnail,
  getThumbnailFramePx,
  getThumbnailFullCardOuterSize,
  getThumbnailTextVariantOuterSize,
  type ThumbnailSize,
} from "@/components/ui/thumbnail-full";
import {
  ParticleSystem,
  type Particle,
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
  FILTER_BG_OPACITY_MUL,
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
  row: ContentFixtureRow,
): void {
  if (
    img.dataset.idx !== row.id ||
    img.getAttribute(ROW_IMAGE_ATTR) !== row.imageUrl
  ) {
    img.src = row.imageUrl;
    img.alt = row.title;
    img.title = row.title;
    img.dataset.idx = row.id;
    img.setAttribute(ROW_IMAGE_ATTR, row.imageUrl);
  }
}

export type ImageParticleSimulationViewProps = {
  mode: ImageParticleSimulationMode;
  imageLimit?: number;
  fetchedWidth: number;
  fetchedHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  speedFactor: number;
  onStatsChange: (stats: ImageParticleSimulationStats) => void;
  config: SimConfig;
  /** Dev (Leva): idle text tiles show full `title` instead of one keyword. */
  idleTextFullTitle?: boolean;
};

export function ImageParticleSimulationView({
  mode,
  imageLimit,
  fetchedWidth,
  fetchedHeight,
  displayedWidth,
  displayedHeight,
  speedFactor,
  onStatsChange,
  config,
  idleTextFullTitle = false,
}: ImageParticleSimulationViewProps) {
  const { selectedFocusAreas, selectedActivityTypes } = useFilterSelection();

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

  const handleFilteredThumbnailClick = useCallback(
    (row: ContentFixtureRow) => {
      console.log("[filtered-thumbnail]", {
        name: row.title,
        filters: {
          focus: [...selectedFocusAreas],
          activity: [...selectedActivityTypes],
        },
        itemFocusAreas: [...row.focusAreas],
        itemActivityTypes: [...row.activityTypes],
        imageUrl: row.imageUrl,
        content: row.content,
        resources: [...row.resources],
        year: row.year,
        formats: [...row.formats],
        networks: [...row.networks],
      });
    },
    [selectedFocusAreas, selectedActivityTypes],
  );

  const spreadEnterSignatureRef = useRef<string | null>(null);
  const respreadPendingRef = useRef(false);

  // ---- State ----
  const [contentRows, setContentRows] = useState<ContentFixtureRow[]>([]);
  const [contentTotal, setContentTotal] = useState(0);
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  /** True while spread layout chrome applies (enter → hold → leave). */
  const [spreadChromeActive, setSpreadChromeActive] = useState(false);
  const [selectedFilterIndices, setSelectedFilterIndices] = useState<number[]>(
    [],
  );

  const idleSnapshotRef = useRef<Particle[] | null>(null);
  /** Inner spread slots — filter-matching tiles (center-first). */
  const spreadTargetsRef = useRef<Vec3[]>([]);
  /** Outer spread slots — same organic algorithm, parallel assignment (ring after filtered). */
  const spreadBgTargetsRef = useRef<Vec3[]>([]);
  const spreadBgIndicesRef = useRef<number[]>([]);
  const selectedIndicesRef = useRef<number[]>([]);
  const filterT0Ref = useRef(0);
  const spreadLayoutPhaseRef = useRef<SpreadLayoutPhase>("idle");
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

  /** Background spread slots use `sm` card footprint (independent layout from filtered `lg`). */
  const spreadBgSmOuter = useMemo(
    () => getThumbnailFullCardOuterSize("sm"),
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

  // ---- Viewport ----
  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ---- Fetch content ----
  useEffect(() => {
    let cancelled = false;
    setFetchError(null);
    setFetchDurationMs(null);

    (async () => {
      try {
        const res = await listContent({
          limit: imageLimit,
          offset: 0,
          latencyMs: mode === "optimized" ? 180 : 80,
        });
        if (cancelled) return;
        setContentRows(res.rows);
        setContentTotal(res.total);
        setFetchDurationMs(res.durationMs);
      } catch (err) {
        if (cancelled) return;
        setFetchError(
          err instanceof Error ? err.message : "Unknown error"
        );
        setContentRows([]);
        setContentTotal(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageLimit, mode]);

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
    onStatsChange({
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

  // ---- Init system ----
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
      viewport.width,
      viewport.height,
    );

    systemRef.current = sys;
  }, [contentRows, viewport.width, viewport.height, textWordsByRow]);

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
      );
      if (orderedPick.length === 0) return false;

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
      const selSet = new Set(sel);
      const bgOrdered: number[] = [];
      for (let ii = 0; ii < contentRows.length; ii++) {
        if (!selSet.has(ii)) bgOrdered.push(ii);
      }
      const f = sel.length;
      const b = bgOrdered.length;
      const filteredTargets = computeSpreadTargets(
        viewport.width,
        viewport.height,
        cfg.zNear,
        f,
        "lg",
      );
      const bgTargetsRaw = computeSpreadTargets(
        viewport.width,
        viewport.height,
        cfg.zNear,
        b,
        "sm",
      );
      const fCount = Math.min(f, filteredTargets.length);
      const bCount = Math.min(b, bgTargetsRaw.length);
      sel = sel.slice(0, fCount);
      spreadTargetsRef.current = filteredTargets.slice(0, fCount);
      spreadBgTargetsRef.current = bgTargetsRaw.slice(0, bCount);
      spreadBgIndicesRef.current = bgOrdered.slice(0, bCount);
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
      );

      const phaseNow = spreadLayoutPhaseRef.current;

      const shouldLeaveSpread =
        (phaseNow === "hold" || phaseNow === "enter") &&
        (!spreadActive || ordered.length === 0);

      const shouldLeaveForRespread =
        phaseNow === "hold" &&
        spreadActive &&
        ordered.length > 0 &&
        spreadEnterSignatureRef.current !== null &&
        sig !== spreadEnterSignatureRef.current;

      if (
        (shouldLeaveSpread || shouldLeaveForRespread) &&
        (phaseNow === "hold" || phaseNow === "enter") &&
        systemRef.current
      ) {
        if (shouldLeaveForRespread) respreadPendingRef.current = true;
        else respreadPendingRef.current = false;
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
      const bgTargets = spreadBgTargetsRef.current;
      const bgIdx = spreadBgIndicesRef.current;
      const selIdx = selectedIndicesRef.current;

      if (phase === "idle") {
        const skipIdleStep = idlePhysicsSkipFramesRef.current > 0;
        if (skipIdleStep) {
          idlePhysicsSkipFramesRef.current -= 1;
        } else {
          sys.step(dt, speed, globalTime);
        }
      }

      const spreadAnimActive =
        phase === "enter" &&
        snap &&
        (targets.length > 0 || bgTargets.length > 0);
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
        for (let j = 0; j < bgIdx.length; j++) {
          const i = bgIdx[j]!;
          const p = sys.particles[i];
          if (!p || j >= bgTargets.length) continue;
          const s = snap[i]!;
          const tgt = bgTargets[j]!;
          p.pos = lerp3(s.pos, tgt, e);
          p.vel = v3(0, 0, 0);
          p.opacity = s.opacity;
        }
        if (u >= 1) {
          for (let j = 0; j < selIdx.length; j++) {
            const i = selIdx[j]!;
            const p = sys.particles[i];
            if (!p || j >= targets.length) continue;
            p.pos = { ...targets[j]! };
          }
          for (let j = 0; j < bgIdx.length; j++) {
            const i = bgIdx[j]!;
            const p = sys.particles[i];
            if (!p || j >= bgTargets.length) continue;
            p.pos = { ...bgTargets[j]! };
          }
          spreadLayoutPhaseRef.current = "hold";
        }
      } else if (
        phase === "hold" &&
        snap &&
        (targets.length > 0 || bgTargets.length > 0)
      ) {
        for (let j = 0; j < selIdx.length; j++) {
          const i = selIdx[j]!;
          const p = sys.particles[i];
          if (!p || j >= targets.length) continue;
          p.pos = { ...targets[j]! };
          p.vel = v3(0, 0, 0);
          p.opacity = 1;
        }
        for (let j = 0; j < bgIdx.length; j++) {
          const i = bgIdx[j]!;
          const p = sys.particles[i];
          if (!p || j >= bgTargets.length) continue;
          p.pos = { ...bgTargets[j]! };
          p.vel = v3(0, 0, 0);
          const s = snap[i];
          if (s) p.opacity = s.opacity;
        }
      } else if (phase === "leave" && snap) {
        const elapsed = now - filterT0Ref.current;
        const u = Math.min(1, elapsed / REGROUP_MS);
        const e = smoothstep01(u);
        const leaveFrom = leaveFromRef.current;
        const leaveScaleFrom = leaveScaleFromRef.current;
        for (let i = 0; i < sys.particles.length; i++) {
          const p = sys.particles[i];
          const s = snap[i]!;
          const startPos = leaveFrom[i] ?? s.pos;
          p.pos = lerp3(startPos, s.pos, e);
          const s0 = leaveScaleFrom[i] ?? s.scale;
          p.scale = s0 + (s.scale - s0) * e;
          p.vel = v3(0, 0, 0);
          if (selIdx.includes(i)) {
            p.opacity = clamp((1 - e) + e * s.opacity, 0, 1);
          } else {
            p.opacity = clamp(s.opacity * e, 0, 1);
          }
        }
        if (u >= 1) {
          for (let i = 0; i < sys.particles.length; i++) {
            const p = sys.particles[i];
            const s = snap[i]!;
            const restored = cloneParticle(s);
            Object.assign(p, restored);
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
        if (passPh === "enter" && snapForScale) {
          const elapsedEnter = styleNow - filterT0Ref.current;
          const uEnter = Math.min(1, elapsedEnter / REGROUP_MS);
          enterScaleT = smoothstep01(uEnter);
        }
        if (passPh === "leave" && snapForScale) {
          const elapsedLeave = styleNow - filterT0Ref.current;
          const uLeave = Math.min(1, elapsedLeave / REGROUP_MS);
          leaveScaleT = smoothstep01(uLeave);
        }

        const styleGlobalTime = styleNow / 1000;

        for (let i = 0; i < sys.particles.length; i++) {
          const p = sys.particles[i];
          const node = nodeRefs.current[i];
          if (!node) continue;

          const filteredActive =
            passPh !== "idle" && selectedIndicesRef.current.includes(i);
          const spreadLayoutBg =
            passPh !== "idle" && !selectedIndicesRef.current.includes(i);
          const filterDimmedBg =
            (passPh === "enter" || passPh === "hold") &&
            !selectedIndicesRef.current.includes(i);

          const perspScale =
            c.perspective / (c.perspective - p.pos.z);
          const apparentIdle = Math.max(0, p.scale * perspScale);
          let finalScale: number;
          if (filteredActive) {
            const idleW =
              idleWidths?.[i] ?? thumbnailFramePx;
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
            } else {
              finalScale = scaleForTargetVisualWidth(
                filteredLgOuter.width,
                lw,
              );
            }
          } else if (spreadLayoutBg) {
            const idleW =
              idleWidths?.[i] ??
              (p.isText
                ? getThumbnailTextVariantOuterSize(thumbnailSize).width
                : thumbnailFramePx);
            const lw =
              node.offsetWidth > 0
                ? node.offsetWidth
                : passPh === "hold"
                  ? spreadBgSmOuter.width
                  : passPh === "enter"
                    ? idleW +
                      (spreadBgSmOuter.width - idleW) * enterScaleT
                    : spreadBgSmOuter.width +
                      (idleW - spreadBgSmOuter.width) * leaveScaleT;
            if (passPh === "hold") {
              finalScale = scaleForTargetVisualWidth(
                spreadBgSmOuter.width,
                lw,
              );
            } else if (passPh === "enter" && snapForScale) {
              const s = snapForScale[i];
              if (s) {
                const a0 = apparentScaleFromParticle(s, c.perspective);
                const idleVisualW = idleW * a0;
                const endVisualW = spreadBgSmOuter.width;
                const visualW =
                  idleVisualW + (endVisualW - idleVisualW) * enterScaleT;
                finalScale = scaleForTargetVisualWidth(visualW, lw);
              } else {
                finalScale = scaleForTargetVisualWidth(
                  spreadBgSmOuter.width,
                  lw,
                );
              }
            } else if (passPh === "leave" && snapForScale) {
              finalScale = scaleForTargetVisualWidth(
                idleW * apparentIdle,
                lw,
              );
            } else {
              finalScale = scaleForTargetVisualWidth(
                spreadBgSmOuter.width,
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
          if (filteredActive || spreadLayoutBg) blurPx = 0;
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

          let outOpacity = clamp(p.opacity, 0, 1);
          if (filterDimmedBg) {
            outOpacity = clamp(p.opacity * FILTER_BG_OPACITY_MUL, 0, 1);
          }

          const filterParts: string[] = [];
          if (blurPx >= 0.03) {
            filterParts.push(`blur(${blurPx.toFixed(2)}px)`);
          }
          if (filterDimmedBg) {
            filterParts.push("grayscale(0.5)");
            filterParts.push("saturate(0.55)");
          }

          node.style.transform = `translate3d(${p.pos.x.toFixed(1)}px, ${p.pos.y.toFixed(1)}px, 0px) scale(${finalScale.toFixed(4)})`;
          node.style.opacity = outOpacity.toFixed(3);
          node.style.zIndex = String(
            zIndex + (filteredActive ? 2000 : spreadLayoutBg ? 1000 : 0),
          );
          node.style.filter = filterParts.length ? filterParts.join(" ") : "none";

          if (p.isText) {
            if (filteredActive || spreadLayoutBg) {
              const img = imgRefs.current[i];
              const row = contentRows[i];
              if (img && row) {
                syncImgToContentRow(img, row);
              }
            } else if (!filterDimmedBg && !spreadLayoutBg) {
              const textEl = textRefs.current[i];
              if (textEl) {
                const row = contentRows[i];
                const useFull = idleTextFullTitleRef.current;
                const rowWords = wordsByRow[i];
                const chunk = useFull
                  ? (row?.title ?? "")
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
          sys.particles = snapDone.map(cloneParticle);
        }
        idleSnapshotRef.current = null;
        spreadTargetsRef.current = [];
        spreadBgTargetsRef.current = [];
        spreadBgIndicesRef.current = [];
        selectedIndicesRef.current = [];
        flushSync(() => {
          setSelectedFilterIndices([]);
          setSpreadChromeActive(false);
        });
        spreadLayoutPhaseRef.current = "idle";
        let didRespreadEnter = false;
        if (respreadPendingRef.current && systemRef.current) {
          const sel2 = spreadSelectionRef.current;
          const spreadActive2 = sel2.focus.size > 0 || sel2.activity.size > 0;
          const ordered2 = pickSpreadIndicesFromRows(
            contentRows,
            textIndexSet,
            sel2.focus,
            sel2.activity,
          );
          if (spreadActive2 && ordered2.length > 0) {
            respreadPendingRef.current = false;
            beginSpreadEnter(performance.now());
            didRespreadEnter = true;
          } else {
            respreadPendingRef.current = false;
            spreadEnterSignatureRef.current = null;
          }
        } else {
          spreadEnterSignatureRef.current = null;
          respreadPendingRef.current = false;
        }
        idleBlurRampIndicesRef.current = new Set(selLeave);
        idleBlurRampT0Ref.current = performance.now();
        idlePhysicsSkipFramesRef.current = 4;
        applyParticleDomStyles(
          didRespreadEnter ? spreadLayoutPhaseRef.current : "idle",
          performance.now(),
        );
      } else {
        applyParticleDomStyles(ph, now);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    contentRows,
    speedFactor,
    viewport.width,
    viewport.height,
    textIndexSet,
    thumbnailFramePx,
    thumbnailSize,
    filteredLgOuter.width,
    spreadBgSmOuter.width,
    spreadBgSmOuter.height,
  ]);

  return (
    <section
      className="fixed inset-0 overflow-hidden"
      style={{ perspective: `${config.perspective}px` }}
      aria-label="3D image particle simulation"
    >
      <div
        className="relative h-screen w-screen"
        style={{ transformStyle: "preserve-3d" }}
      >
        {contentRows.map((row, i) => {
          const isText = textIndexSet.has(i);
          const showFilteredCard =
            selectedFilterSet.has(i) && spreadChromeActive;
          const spreadDimmed = spreadChromeActive && !showFilteredCard;

          if (isText) {
            const rowWords = textWordsByRow[i] ?? [];
            const widx = pickIdleTextWordIndex(i, rowWords.length);
            const chunk = idleTextFullTitle
              ? row.title
              : (rowWords[widx] ??
                row.title.split(/\s+/)[0] ??
                "TEXT");

            return (
              <div
                key={`text-${row.id}`}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className={`absolute left-1/2 top-1/2 will-change-[transform,opacity,filter] ${
                  showFilteredCard
                    ? "cursor-pointer pointer-events-auto"
                    : ""
                } ${spreadDimmed ? "pointer-events-none" : ""}`}
                onClick={
                  showFilteredCard
                    ? (e) => {
                        e.stopPropagation();
                        handleFilteredThumbnailClick(row);
                      }
                    : undefined
                }
                style={{
                  // transform/opacity are driven only by the RAF loop — putting them
                  // here caused React to reset scale(0) on re-renders that touch layout chrome.
                  ...(showFilteredCard
                    ? {
                        marginLeft: `${-filteredLgOuter.width / 2}px`,
                        marginTop: `${-filteredLgOuter.height / 2}px`,
                      }
                    : spreadDimmed
                      ? {
                          marginLeft: `${-spreadBgSmOuter.width / 2}px`,
                          marginTop: `${-spreadBgSmOuter.height / 2}px`,
                        }
                      : {
                          width: `${textIdleOuter.width}px`,
                          height: `${textIdleOuter.height}px`,
                          marginLeft: `${-textIdleOuter.width / 2}px`,
                          marginTop: `${-textIdleOuter.height / 2}px`,
                        }),
                }}
              >
                {showFilteredCard ? (
                  <Thumbnail
                    variant="full"
                    size="lg"
                    label={row.title}
                    imageSrc={row.imageUrl}
                    imageAlt={row.title}
                    labelRef={(el) => {
                      textRefs.current[i] = el;
                    }}
                    imageRef={(el) => {
                      imgRefs.current[i] = el;
                    }}
                    imageWidth={fetchedWidth}
                    imageHeight={fetchedHeight}
                    accessibilityLabel={row.title}
                  />
                ) : spreadDimmed ? (
                  <Thumbnail
                    variant="full"
                    size="sm"
                    label={row.title}
                    imageSrc={row.imageUrl}
                    imageAlt={row.title}
                    labelRef={(el) => {
                      textRefs.current[i] = el;
                    }}
                    imageRef={(el) => {
                      imgRefs.current[i] = el;
                    }}
                    imageWidth={fetchedWidth}
                    imageHeight={fetchedHeight}
                    accessibilityLabel={row.title}
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
                showFilteredCard
                  ? "cursor-pointer pointer-events-auto"
                  : ""
              } ${spreadDimmed ? "pointer-events-none" : ""}`}
              onClick={
                showFilteredCard
                  ? (e) => {
                      e.stopPropagation();
                      handleFilteredThumbnailClick(row);
                    }
                  : undefined
              }
              style={
                showFilteredCard
                  ? {
                      marginLeft: `${-filteredLgOuter.width / 2}px`,
                      marginTop: `${-filteredLgOuter.height / 2}px`,
                    }
                  : spreadDimmed
                    ? {
                        marginLeft: `${-spreadBgSmOuter.width / 2}px`,
                        marginTop: `${-spreadBgSmOuter.height / 2}px`,
                      }
                    : {
                        width: `${thumbnailFramePx}px`,
                        height: `${thumbnailFramePx}px`,
                        marginLeft: `${-thumbnailFramePx / 2}px`,
                        marginTop: `${-thumbnailFramePx / 2}px`,
                      }
              }
            >
              {showFilteredCard ? (
                <Thumbnail
                  variant="full"
                  size="lg"
                  label={row.title}
                  imageSrc={row.imageUrl}
                  imageAlt={row.title}
                  imageRef={(el) => {
                    imgRefs.current[i] = el;
                  }}
                  imageWidth={fetchedWidth}
                  imageHeight={fetchedHeight}
                />
              ) : spreadDimmed ? (
                <Thumbnail
                  variant="full"
                  size="sm"
                  label={row.title}
                  imageSrc={row.imageUrl}
                  imageAlt={row.title}
                  imageRef={(el) => {
                    imgRefs.current[i] = el;
                  }}
                  imageWidth={fetchedWidth}
                  imageHeight={fetchedHeight}
                />
              ) : (
                <Thumbnail
                  variant="image"
                  size={thumbnailSize}
                  label={row.title}
                  imageSrc={row.imageUrl}
                  imageAlt={row.title}
                  imageRef={(el) => {
                    imgRefs.current[i] = el;
                  }}
                  imageWidth={fetchedWidth}
                  imageHeight={fetchedHeight}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
