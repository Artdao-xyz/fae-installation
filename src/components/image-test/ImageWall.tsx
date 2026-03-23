"use client";

import { useEffect, useRef, useState } from "react";
import { listContent } from "@/lib/content-repository";
import type { ContentFixtureRow } from "@/data/content-fixture";

type Mode = "optimized" | "snappy";

export type ImageWallStats = {
  loadedCount: number;
  errorCount: number;
  loadDurationMs: number | null;
  contentRowsCount: number;
  contentTotal: number;
  fetchDurationMs: number | null;
  fetchError: string | null;
  totalImages: number;
  loadDone: boolean;
};

type ImageWallProps = {
  mode: Mode;
  imageLimit?: number;
  fetchedWidth: number;
  fetchedHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  speedFactor: number;
  onStatsChange: (stats: ImageWallStats) => void;
};

const MORPH_DURATION_MS = 500;
const AUTO_REVEAL_DELAY_MS = 650;
const MAX_SCATTER_FRAGMENTS = 9;
const VIEWPORT_PADDING_RATIO = 0.0;
const ENABLE_MORPH_ANIMATION = true;
const MAX_STAGGER_DELAY_MS = 900;
const TEXT_CASCADE_STEP_MS = 46;
const ELLIPSE_TILT_DEG = -18;
const ELLIPSE_ASPECT_X = 1.16;
const ELLIPSE_ASPECT_Y = 0.82;
const EDGE_INSET_PX = 0;
const DEPTH_MAX_Z = 320;
const DEPTH_MIN_Z = -240;
const DENSITY_CLUSTER_BIAS = 0.36;
const DENSITY_CLUSTER_SPREAD = 0.62;
const DENSITY_CLUSTER_CENTERS = [-2.15, 0.35, 2.25] as const;
const DENSITY_CLUSTER_WEIGHTS = [0.4, 0.35, 0.25] as const;

type ScatterFragment = {
  id: string;
  text: string;
  leftPx: number;
  topPx: number;
  fontSizePx: number;
  opacity: number;
};

function seededUnit(seed: number) {
  const value = Math.sin(seed * 9999.91) * 43758.5453;
  return value - Math.floor(value);
}

function scrambleTitle(title: string, seed: number) {
  const chars = title.replace(/\s+/g, "").split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededUnit(seed + i * 1.73) * (i + 1));
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join("").slice(0, 40);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(angle: number) {
  let normalized = angle;
  while (normalized <= -Math.PI) {
    normalized += Math.PI * 2;
  }
  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }
  return normalized;
}

function weightedIndex(unitValue: number, weights: readonly number[]) {
  let cursor = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (unitValue <= cursor) {
      return index;
    }
  }
  return weights.length - 1;
}

function makeScatterFragments(
  scrambled: string,
  seed: number,
  tileWidth: number,
  tileHeight: number
): ScatterFragment[] {
  if (!scrambled) {
    return [];
  }

  const fragmentCount = Math.min(MAX_SCATTER_FRAGMENTS, Math.max(4, Math.ceil(scrambled.length / 4)));
  const chunkSize = Math.max(1, Math.ceil(scrambled.length / fragmentCount));
  const fragments: ScatterFragment[] = [];

  for (let index = 0; index < fragmentCount; index += 1) {
    const start = index * chunkSize;
    const text = scrambled.slice(start, start + chunkSize);
    if (!text) {
      continue;
    }

    const leftPx = Math.floor(seededUnit(seed + index * 1.19) * Math.max(1, tileWidth - 30) + 6);
    const topPx = Math.floor(seededUnit(seed + index * 2.41) * Math.max(1, tileHeight - 20) + 4);
    const fontSizePx = 8 + Math.floor(seededUnit(seed + index * 5.03) * 5);
    const opacity = 0.45 + seededUnit(seed + index * 6.17) * 0.5;

    fragments.push({
      id: `${seed}-${index}`,
      text,
      leftPx,
      topPx,
      fontSizePx,
      opacity,
    });
  }

  return fragments;
}

export function ImageWall({
  mode,
  imageLimit,
  fetchedWidth,
  fetchedHeight,
  displayedWidth,
  displayedHeight,
  speedFactor: _speedFactor,
  onStatsChange,
}: ImageWallProps) {
  const [contentRows, setContentRows] = useState<ContentFixtureRow[]>([]);
  const [contentTotal, setContentTotal] = useState<number>(0);
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [textCascadeOn, setTextCascadeOn] = useState(false);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const loadStartAtRef = useRef<number | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFetchError(null);
    setFetchDurationMs(null);

    const loadContent = async () => {
      try {
        const response = await listContent({
          limit: imageLimit,
          offset: 0,
          latencyMs: mode === "optimized" ? 180 : 80,
        });

        if (cancelled) {
          return;
        }

        setContentRows(response.rows);
        setContentTotal(response.total);
        setFetchDurationMs(response.durationMs);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFetchError(error instanceof Error ? error.message : "Unknown data error");
        setContentRows([]);
        setContentTotal(0);
      }
    };

    void loadContent();
    return () => {
      cancelled = true;
    };
  }, [imageLimit, mode]);

  useEffect(() => {
    setRevealedIds(new Set());
    setLoadedCount(0);
    setErrorCount(0);
    setLoadDurationMs(null);

    if (contentRows.length === 0) {
      return;
    }

    let cancelled = false;
    let loaded = 0;
    let errors = 0;
    let handled = 0;
    loadStartAtRef.current = performance.now();

    const markHandled = (hasError: boolean) => {
      if (cancelled) {
        return;
      }

      handled += 1;
      if (hasError) {
        errors += 1;
      } else {
        loaded += 1;
      }

      setLoadedCount(loaded);
      setErrorCount(errors);

      if (handled >= contentRows.length && loadStartAtRef.current !== null) {
        setLoadDurationMs(Math.round(performance.now() - loadStartAtRef.current));
      }
    };

    for (const row of contentRows) {
      const preload = new window.Image();
      let settled = false;

      const settleOnce = (hasError: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        preload.onload = null;
        preload.onerror = null;
        markHandled(hasError);
      };

      preload.onload = () => settleOnce(false);
      preload.onerror = () => settleOnce(true);
      preload.src = row.imageUrl;

      if (preload.complete) {
        settleOnce(preload.naturalWidth === 0);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [contentRows]);

  const totalImages = contentRows.length;
  const handledCount = loadedCount + errorCount;
  const loadDone = totalImages > 0 && handledCount >= totalImages;

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
    contentRows.length,
    contentTotal,
    errorCount,
    fetchDurationMs,
    fetchError,
    loadDone,
    loadDurationMs,
    loadedCount,
    onStatsChange,
    totalImages,
  ]);

  useEffect(() => {
    setTextCascadeOn(false);

    if (contentRows.length === 0) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      setTextCascadeOn(true);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [contentRows]);

  useEffect(() => {
    if (!ENABLE_MORPH_ANIMATION) {
      setRevealedIds(new Set());
      return;
    }

    setRevealedIds(new Set());

    if (contentRows.length === 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setRevealedIds(new Set(contentRows.map((_, index) => index)));
    }, AUTO_REVEAL_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [contentRows]);

  return (
    <section className="fixed inset-0 overflow-hidden" aria-label="Title to image morph wall">
      <div className="relative h-screen w-screen">
        {contentRows.map((row, index) => {
          const isRevealed = ENABLE_MORPH_ANIMATION && revealedIds.has(index);
          const sizeScale = 0.68 + seededUnit(index + 101.9) * 0.82;
          const aspectJitter = 0.9 + seededUnit(index + 109.1) * 0.22;
          const tileWidth = Math.round(displayedWidth * sizeScale);
          const tileHeight = Math.round(displayedHeight * sizeScale * aspectJitter);
          const centerX = viewport.width / 2;
          const centerY = viewport.height / 2;
          const minDimension = Math.min(viewport.width, viewport.height);
          const radialPaddingPx = minDimension * VIEWPORT_PADDING_RATIO;
          const baseRadius = Math.max(
            90,
            minDimension / 2 - radialPaddingPx - Math.max(tileWidth, tileHeight) / 2
          );
          const ellipseRadiusX = baseRadius * ELLIPSE_ASPECT_X;
          const ellipseRadiusY = baseRadius * ELLIPSE_ASPECT_Y;
          const tiltRad = (ELLIPSE_TILT_DEG * Math.PI) / 180;
          const ringRadius = 0.78 + (seededUnit(index + 7.13) - 0.5) * 0.72;
          const useCluster = seededUnit(index + 311.7) < DENSITY_CLUSTER_BIAS;
          const angle = useCluster
            ? (() => {
                const clusterId = weightedIndex(
                  seededUnit(index + 329.1),
                  DENSITY_CLUSTER_WEIGHTS
                );
                const center = DENSITY_CLUSTER_CENTERS[clusterId];
                const n1 = seededUnit(index + 347.9);
                const n2 = seededUnit(index + 359.3);
                const localOffset = (n1 + n2 - 1) * DENSITY_CLUSTER_SPREAD * 1.7;
                return normalizeAngle(center + localOffset);
              })()
            : normalizeAngle(index * 2.3999632297 + seededUnit(index + 13.37) * 0.9);
          const jitterX = (seededUnit(index + 19.17) - 0.5) * 52;
          const jitterY = (seededUnit(index + 23.91) - 0.5) * 52;
          const localX = Math.cos(angle) * ellipseRadiusX * ringRadius + jitterX;
          const localY = Math.sin(angle) * ellipseRadiusY * ringRadius + jitterY;
          const rotatedX = localX * Math.cos(tiltRad) - localY * Math.sin(tiltRad);
          const rotatedY = localX * Math.sin(tiltRad) + localY * Math.cos(tiltRad);
          const rawX = centerX + rotatedX - tileWidth / 2;
          const rawY = centerY + rotatedY - tileHeight / 2;
          const leftPx = clamp(rawX, EDGE_INSET_PX, viewport.width - tileWidth - EDGE_INSET_PX);
          const topPx = clamp(rawY, EDGE_INSET_PX, viewport.height - tileHeight - EDGE_INSET_PX);
          const depthUnit = seededUnit(index + 401.3);
          const zDepth = DEPTH_MIN_Z + depthUnit * (DEPTH_MAX_Z - DEPTH_MIN_Z);
          const depthAlpha = 0.72 + depthUnit * 0.28;
          const scrambledTitle = scrambleTitle(row.title, index + 41);
          const isDarkTextCard = seededUnit(index + 151.3) > 0.47;
          const transitionDelayMs = Math.floor(seededUnit(index + 211.7) * MAX_STAGGER_DELAY_MS);
          const transitionDurationMs =
            MORPH_DURATION_MS + Math.floor(seededUnit(index + 233.9) * 180) - 90;
          const scatterFragments = makeScatterFragments(
            scrambledTitle,
            index + 53,
            tileWidth,
            tileHeight
          );

          return (
            <div
              key={row.id}
              className="absolute overflow-hidden bg-transparent text-left [border-radius:2px]"
              style={{
                width: `${tileWidth}px`,
                height: `${tileHeight}px`,
                left: `${leftPx}px`,
                top: `${topPx}px`,
                zIndex: Math.round(depthUnit * 100),
                opacity: depthAlpha,
                transform: `translate3d(0, 0, ${zDepth.toFixed(2)}px)`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center p-2 font-mono text-[0.66rem] leading-tight transition-all motion-reduce:transition-none"
                style={{
                  transitionDuration: ENABLE_MORPH_ANIMATION ? `${transitionDurationMs}ms` : "0ms",
                  transitionDelay: ENABLE_MORPH_ANIMATION ? `${transitionDelayMs}ms` : "0ms",
                  opacity: isRevealed ? 0 : 1,
                  transform: isRevealed ? "scale(0.94)" : "scale(1)",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                <div className="relative h-full w-full">
                  {scatterFragments.map((fragment, fragmentIndex) => {
                    const fragmentCascadeDelayMs =
                      Math.floor(seededUnit(index + 271.1) * 220) +
                      fragmentIndex * TEXT_CASCADE_STEP_MS;

                    return (
                      <span
                        key={fragment.id}
                        className="absolute whitespace-nowrap rounded-[2px]"
                        style={{
                          left: `${fragment.leftPx}px`,
                          top: `${fragment.topPx}px`,
                          transform: textCascadeOn
                            ? "translate(-50%, -50%)"
                            : "translate(-50%, -38%)",
                          fontSize: `${fragment.fontSizePx}px`,
                          opacity: textCascadeOn ? fragment.opacity : 0,
                          color: isDarkTextCard ? "#ffffff" : "#111111",
                          backgroundColor: isDarkTextCard ? "rgba(0, 0, 0, 0.86)" : "transparent",
                          padding: isDarkTextCard ? "1px 3px" : "0px",
                          fontFamily: "var(--font-geist-mono), monospace",
                          transitionProperty: "opacity, transform",
                          transitionDuration: "380ms",
                          transitionDelay: `${fragmentCascadeDelayMs}ms`,
                          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        {fragment.text}
                      </span>
                    );
                  })}
                </div>
              </div>

              <img
                src={row.imageUrl}
                alt={row.title}
                title={row.title}
                width={fetchedWidth}
                height={fetchedHeight}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-all motion-reduce:transition-none"
                style={{
                  transitionDuration: ENABLE_MORPH_ANIMATION ? `${transitionDurationMs}ms` : "0ms",
                  transitionDelay: ENABLE_MORPH_ANIMATION ? `${transitionDelayMs}ms` : "0ms",
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? "scale(1)" : "scale(0.52)",
                }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
