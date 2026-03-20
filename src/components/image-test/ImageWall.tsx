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
const AUTO_REVEAL_DELAY_MS = 1000;
const MAX_SCATTER_FRAGMENTS = 9;

type ScatterFragment = {
  id: string;
  text: string;
  leftPx: number;
  topPx: number;
  rotateDeg: number;
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
    const rotateDeg = (seededUnit(seed + index * 3.71) - 0.5) * 28;
    const fontSizePx = 8 + Math.floor(seededUnit(seed + index * 5.03) * 5);
    const opacity = 0.45 + seededUnit(seed + index * 6.17) * 0.5;

    fragments.push({
      id: `${seed}-${index}`,
      text,
      leftPx,
      topPx,
      rotateDeg,
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
  const loadStartAtRef = useRef<number | null>(null);

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
          const isRevealed = revealedIds.has(index);
          const leftFactor = seededUnit(index + 11).toFixed(5);
          const topFactor = seededUnit(index + 17).toFixed(5);
          const rotate = (seededUnit(index + 29) - 0.5) * 18;
          const scrambledTitle = scrambleTitle(row.title, index + 41);
          const scatterFragments = makeScatterFragments(
            scrambledTitle,
            index + 53,
            displayedWidth,
            displayedHeight
          );

          return (
            <div
              key={row.id}
              className="absolute overflow-hidden bg-transparent text-left [border-radius:2px]"
              style={{
                width: `${displayedWidth}px`,
                height: `${displayedHeight}px`,
                left: `calc(${leftFactor} * (100vw - ${displayedWidth + 16}px) + 8px)`,
                top: `calc(${topFactor} * (100vh - ${displayedHeight + 16}px) + 8px)`,
                transform: `rotate(${rotate.toFixed(2)}deg)`,
              }}
            >
              <div
                className={`pointer-events-none absolute inset-0 flex items-center justify-center p-2 font-mono text-[0.66rem] leading-tight text-[#eaf4ff] transition-all motion-reduce:transition-none`}
                style={{
                  transitionDuration: `${MORPH_DURATION_MS}ms`,
                  opacity: isRevealed ? 0 : 1,
                  transform: isRevealed ? "scale(0.94)" : "scale(1)",
                }}
              >
                <div className="relative h-full w-full">
                  {scatterFragments.map((fragment) => (
                    <span
                      key={fragment.id}
                      className="absolute whitespace-nowrap"
                      style={{
                        left: `${fragment.leftPx}px`,
                        top: `${fragment.topPx}px`,
                        transform: `translate(-50%, -50%) rotate(${fragment.rotateDeg.toFixed(2)}deg)`,
                        fontSize: `${fragment.fontSizePx}px`,
                        opacity: fragment.opacity,
                      }}
                    >
                      {fragment.text}
                    </span>
                  ))}
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
                  transitionDuration: `${MORPH_DURATION_MS}ms`,
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? "scale(1)" : "scale(1.04)",
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
