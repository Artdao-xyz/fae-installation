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

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  theta: number;
  phi: number;
  thetaVel: number;
  phiVel: number;
  baseRadius: number;
  wobbleAmp: number;
  wobblePhase: number;
  springK: number;
  damping: number;
  sizeScale: number;
};

const SCENE_PERSPECTIVE_PX = 1200;
const DEPTH_NEAR_Z = 360;
const DEPTH_FAR_Z = -520;
const PARTICLE_SIZE_MIN_SCALE = 0.62;
const PARTICLE_SIZE_MAX_SCALE = 1.36;

function seededUnit(seed: number) {
  const value = Math.sin(seed * 9999.91) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createParticle(index: number, viewportWidth: number, viewportHeight: number): Particle {
  const minViewport = Math.min(viewportWidth, viewportHeight);
  const radiusBase = minViewport * (0.19 + seededUnit(index + 13.1) * 0.23);

  return {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    theta: seededUnit(index + 31.7) * Math.PI * 2,
    phi: (seededUnit(index + 37.9) - 0.5) * Math.PI * 0.72,
    thetaVel: (0.14 + seededUnit(index + 43.3) * 0.36) * (seededUnit(index + 47.1) > 0.25 ? 1 : -1),
    phiVel: (0.06 + seededUnit(index + 53.2) * 0.14) * (seededUnit(index + 59.4) > 0.5 ? 1 : -1),
    baseRadius: radiusBase,
    wobbleAmp: 24 + seededUnit(index + 61.3) * 64,
    wobblePhase: seededUnit(index + 67.7) * Math.PI * 2,
    springK: 2.8 + seededUnit(index + 71.9) * 3.4,
    damping: 1.7 + seededUnit(index + 79.2) * 2.2,
    sizeScale: PARTICLE_SIZE_MIN_SCALE + seededUnit(index + 83.8) * (PARTICLE_SIZE_MAX_SCALE - PARTICLE_SIZE_MIN_SCALE),
  };
}

export function ImageWall({
  mode,
  imageLimit,
  fetchedWidth,
  fetchedHeight,
  displayedWidth,
  displayedHeight,
  speedFactor,
  onStatsChange,
}: ImageWallProps) {
  const [contentRows, setContentRows] = useState<ContentFixtureRow[]>([]);
  const [contentTotal, setContentTotal] = useState<number>(0);
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });

  const particleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const particlesRef = useRef<Particle[]>([]);

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
    const startedAt = performance.now();

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

      if (handled >= contentRows.length) {
        setLoadDurationMs(Math.round(performance.now() - startedAt));
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
    if (contentRows.length === 0) {
      particlesRef.current = [];
      return;
    }

    particlesRef.current = contentRows.map((_, index) =>
      createParticle(index, viewport.width, viewport.height)
    );
  }, [contentRows, viewport.height, viewport.width]);

  useEffect(() => {
    if (contentRows.length === 0) {
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = clamp((now - lastTime) / 1000, 0.001, 0.05);
      lastTime = now;
      const t = now / 1000;
      const speed = clamp(speedFactor || 1, 0.2, 3.5);

      for (let index = 0; index < particlesRef.current.length; index += 1) {
        const p = particlesRef.current[index];
        const node = particleRefs.current[index];
        if (!p || !node) {
          continue;
        }

        // Organic, non-constant target motion in spherical coordinates.
        p.theta += p.thetaVel * dt * speed * (1 + 0.35 * Math.sin(t * 0.91 + p.wobblePhase));
        p.phi += p.phiVel * dt * speed * (1 + 0.28 * Math.sin(t * 1.27 + p.wobblePhase * 0.7));

        const breath = Math.sin(t * 0.67 + p.wobblePhase) * p.wobbleAmp;
        const radius = p.baseRadius + breath;

        const tx =
          Math.cos(p.theta) * radius +
          Math.sin(t * 1.13 + p.wobblePhase * 1.7) * (p.wobbleAmp * 0.44);
        const ty =
          Math.sin(p.phi) * (viewport.height * 0.28) +
          Math.sin(t * 0.93 + p.wobblePhase * 1.3) * (p.wobbleAmp * 0.38);
        const tz =
          Math.sin(p.theta * 0.87 + p.wobblePhase) * (viewport.width * 0.18) +
          Math.cos(t * 0.73 + p.wobblePhase * 0.9) * (p.wobbleAmp * 1.6);

        // Spring-damped integration gives acceleration/deceleration naturally.
        const ax = (tx - p.x) * p.springK - p.vx * p.damping;
        const ay = (ty - p.y) * p.springK - p.vy * p.damping;
        const az = (tz - p.z) * p.springK - p.vz * p.damping;

        p.vx += ax * dt;
        p.vy += ay * dt;
        p.vz += az * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        const zClamped = clamp(p.z, DEPTH_FAR_Z, DEPTH_NEAR_Z);
        const perspectiveScale = SCENE_PERSPECTIVE_PX / (SCENE_PERSPECTIVE_PX - zClamped);
        const naturalScale = p.sizeScale * perspectiveScale;
        const opacity = 0.42 + ((zClamped - DEPTH_FAR_Z) / (DEPTH_NEAR_Z - DEPTH_FAR_Z)) * 0.58;
        const zIndex = Math.round((zClamped - DEPTH_FAR_Z) / (DEPTH_NEAR_Z - DEPTH_FAR_Z) * 1000);

        node.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${zClamped.toFixed(2)}px) scale(${naturalScale.toFixed(4)})`;
        node.style.opacity = opacity.toFixed(3);
        node.style.zIndex = String(zIndex);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [contentRows.length, speedFactor, viewport.height, viewport.width]);

  return (
    <section
      className="fixed inset-0 overflow-hidden [perspective:1200px] [transform-style:preserve-3d]"
      aria-label="3D image particle system"
    >
      <div className="relative h-screen w-screen [transform-style:preserve-3d]">
        {contentRows.map((row, index) => (
          <div
            key={row.id}
            ref={(node) => {
              particleRefs.current[index] = node;
            }}
            className="absolute left-1/2 top-1/2 will-change-transform [transform-style:preserve-3d]"
            style={{
              width: `${displayedWidth}px`,
              height: `${displayedHeight}px`,
              marginLeft: `${-displayedWidth / 2}px`,
              marginTop: `${-displayedHeight / 2}px`,
              opacity: 0.4,
              zIndex: 0,
              transform: "translate3d(0px, 0px, 0px) scale(0.25)",
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden [border-radius:10px]"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.28)",
              }}
            >
              <img
                src={row.imageUrl}
                alt={row.title}
                title={row.title}
                width={fetchedWidth}
                height={fetchedHeight}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                draggable={false}
                style={{
                  filter: "drop-shadow(0 6px 14px rgba(0, 0, 0, 0.22))",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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

const MORPH_LOOP_DURATION_MIN_MS = 10000;
const MORPH_LOOP_DURATION_VAR_MS = 0;
const ORBIT_DURATION_MIN_MS = 18000;
const ORBIT_DURATION_VAR_MS = 12000;
const INTRO_EXPLODE_DURATION_MS = 1250;
const INTRO_EXPLODE_DURATION_VAR_MS = 420;
const INTRO_STAGGER_MAX_MS = 520;
const VIEWPORT_PADDING_RATIO = 0.0;
const ELLIPSE_TILT_DEG = -18;
const ELLIPSE_ASPECT_X = 1.16;
const ELLIPSE_ASPECT_Y = 0.82;
const DEPTH_MAX_Z = 320;
const DEPTH_MIN_Z = -240;
const DENSITY_CLUSTER_BIAS = 0.36;
const DENSITY_CLUSTER_SPREAD = 0.62;
const DENSITY_CLUSTER_CENTERS = [-2.15, 0.35, 2.25] as const;
const DENSITY_CLUSTER_WEIGHTS = [0.4, 0.35, 0.25] as const;
const TILE_SEPARATION_GAP_PX = 16;
const TILE_RELAXATION_STEPS = 8;
const ORBIT_DRIFT_DURATION_MIN_MS = 6800;
const ORBIT_DRIFT_DURATION_VAR_MS = 5200;
const NATURAL_SCALE_DURATION_MIN_MS = 7600;
const NATURAL_SCALE_DURATION_VAR_MS = 4400;

type ScatterFragment = {
  id: string;
  text: string;
  startDxPx: number;
  startDyPx: number;
  endDxPx: number;
  endDyPx: number;
  exitDxPx: number;
  exitDyPx: number;
  fontSizePx: number;
  maxOpacity: number;
  delayMs: number;
};

type OrbitPlacement = {
  tileWidth: number;
  tileHeight: number;
  orbitRadius: number;
  orbitStartDeg: number;
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
  title: string,
  seed: number,
  tileWidth: number,
  tileHeight: number
): ScatterFragment[] {
  const normalizedTitle = title.replace(/\s+/g, " ").trim() || "UNTITLED";
  const titleCharsNoSpace = normalizedTitle.replace(/\s+/g, "");

  if (titleCharsNoSpace.length === 0) {
    return [];
  }

  const wrapWords = (source: string, maxChars: number) => {
    const words = source.split(" ");
    const out: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxChars) {
        line = candidate;
        continue;
      }

      if (line) {
        out.push(line);
        line = word;
      } else {
        let cursor = word;
        while (cursor.length > maxChars) {
          out.push(cursor.slice(0, maxChars));
          cursor = cursor.slice(maxChars);
        }
        line = cursor;
      }
    }
    if (line) {
      out.push(line);
    }
    return out;
  };

  let fontSizePx = Math.min(12, Math.max(6, Math.floor(tileHeight / 6)));
  let lines: string[] = [];
  while (fontSizePx >= 5) {
    const charAdvance = Math.max(4, Math.round(fontSizePx * 0.62));
    const maxCharsPerLine = Math.max(6, Math.floor((tileWidth - 10) / charAdvance));
    const candidateLines = wrapWords(normalizedTitle, maxCharsPerLine);
    const lineHeight = Math.max(fontSizePx + 1, Math.round(fontSizePx * 1.22));
    const totalHeight = candidateLines.length * lineHeight;
    if (totalHeight <= tileHeight - 8) {
      lines = candidateLines;
      break;
    }
    fontSizePx -= 1;
  }

  if (lines.length === 0) {
    const charAdvance = Math.max(4, Math.round(fontSizePx * 0.62));
    const maxCharsPerLine = Math.max(6, Math.floor((tileWidth - 10) / charAdvance));
    lines = wrapWords(normalizedTitle, maxCharsPerLine);
  }

  const charAdvance = Math.max(5, Math.round(fontSizePx * 0.5));
  const lineHeight = Math.max(fontSizePx + 1, Math.round(fontSizePx * 1.22));
  const totalTextHeight = lines.length * lineHeight;
  const topBase = (tileHeight - totalTextHeight) / 2 + lineHeight * 0.52;

  const fragments: ScatterFragment[] = [];
  let letterCursor = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const lineWidth = line.length * charAdvance;
    const lineStart = (tileWidth - lineWidth) / 2;

    for (let charIndex = 0; charIndex < line.length; charIndex += 1) {
      const lineChar = line[charIndex];
      if (lineChar === " ") {
        continue;
      }

      // Always use the target character for this final slot.
      // Only the starting position is scrambled, so the ending word is always correct.
      const textChar = lineChar;
      const endX = lineStart + charIndex * charAdvance + charAdvance / 2;
      const endY = topBase + lineIndex * lineHeight;
      const startX = seededUnit(seed + letterCursor * 1.19) * Math.max(12, tileWidth - 12) + 6;
      const startY = seededUnit(seed + letterCursor * 2.41) * Math.max(12, tileHeight - 12) + 6;
      const exitX = seededUnit(seed + letterCursor * 3.67) * Math.max(12, tileWidth - 12) + 6;
      const exitY = seededUnit(seed + letterCursor * 4.93) * Math.max(12, tileHeight - 12) + 6;
      const maxOpacity = 1;
      const delayMs = Math.floor(seededUnit(seed + letterCursor * 7.39) * 180);

      fragments.push({
        id: `${seed}-${letterCursor}`,
        text: textChar,
        startDxPx: startX - tileWidth / 2,
        startDyPx: startY - tileHeight / 2,
        endDxPx: endX - tileWidth / 2,
        endDyPx: endY - tileHeight / 2,
        exitDxPx: exitX - tileWidth / 2,
        exitDyPx: exitY - tileHeight / 2,
        fontSizePx,
        maxOpacity,
        delayMs,
      });
      letterCursor += 1;
    }
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

  const orbitPlacements = useMemo<OrbitPlacement[]>(() => {
    const minDimension = Math.min(viewport.width, viewport.height);
    const radialPaddingPx = minDimension * VIEWPORT_PADDING_RATIO;
    const tiltRad = (ELLIPSE_TILT_DEG * Math.PI) / 180;

    const entries = contentRows.map((_, index) => {
      const sizeScale = 0.68 + seededUnit(index + 101.9) * 0.82;
      const aspectJitter = 0.9 + seededUnit(index + 109.1) * 0.22;
      const tileWidth = Math.round(displayedWidth * sizeScale);
      const tileHeight = Math.round(displayedHeight * sizeScale * aspectJitter);

      const baseRadius = Math.max(
        90,
        minDimension / 2 - radialPaddingPx - Math.max(tileWidth, tileHeight) / 2
      );
      const ellipseRadiusX = baseRadius * ELLIPSE_ASPECT_X;
      const ellipseRadiusY = baseRadius * ELLIPSE_ASPECT_Y;
      const ringRadius = 0.78 + (seededUnit(index + 7.13) - 0.5) * 0.72;

      const useCluster = seededUnit(index + 311.7) < DENSITY_CLUSTER_BIAS;
      const angle = useCluster
        ? (() => {
            const clusterId = weightedIndex(seededUnit(index + 329.1), DENSITY_CLUSTER_WEIGHTS);
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

      return {
        index,
        tileWidth,
        tileHeight,
        x: localX * Math.cos(tiltRad) - localY * Math.sin(tiltRad),
        y: localX * Math.sin(tiltRad) + localY * Math.cos(tiltRad),
      };
    });

    const maxOrbitFor = (tileWidth: number, tileHeight: number) =>
      Math.max(24, Math.min(viewport.width - tileWidth, viewport.height - tileHeight) / 2 - 12);

    for (let step = 0; step < TILE_RELAXATION_STEPS; step += 1) {
      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const a = entries[i];
          const b = entries[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.0001;
          const minDistance =
            ((Math.max(a.tileWidth, a.tileHeight) + Math.max(b.tileWidth, b.tileHeight)) * 0.5) * 0.82 +
            TILE_SEPARATION_GAP_PX;

          if (distance >= minDistance) {
            continue;
          }

          const push = (minDistance - distance) * 0.5;
          const ux = dx / distance;
          const uy = dy / distance;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }

      for (const entry of entries) {
        const radius = Math.hypot(entry.x, entry.y) || 0.0001;
        const maxOrbit = maxOrbitFor(entry.tileWidth, entry.tileHeight);
        if (radius > maxOrbit) {
          const ratio = maxOrbit / radius;
          entry.x *= ratio;
          entry.y *= ratio;
        }
      }
    }

    return entries.map((entry) => ({
      tileWidth: entry.tileWidth,
      tileHeight: entry.tileHeight,
      orbitRadius: Math.max(24, Math.hypot(entry.x, entry.y)),
      orbitStartDeg: (Math.atan2(entry.y, entry.x) * 180) / Math.PI,
    }));
  }, [contentRows, displayedHeight, displayedWidth, viewport.height, viewport.width]);

  return (
    <>
      <section
        className="fixed inset-0 overflow-hidden"
        aria-label="Title to image morph wall"
      >
        <div className="relative h-screen w-screen">
        {contentRows.map((row, index) => {
          const placement = orbitPlacements[index];
          if (!placement) {
            return null;
          }
          const { tileWidth, tileHeight, orbitRadius, orbitStartDeg } = placement;
          const depthUnit = seededUnit(index + 401.3);
          const zDepth = DEPTH_MIN_Z + depthUnit * (DEPTH_MAX_Z - DEPTH_MIN_Z);
          const depthAlpha = 0.72 + depthUnit * 0.28;
          const isDarkTextCard = seededUnit(index + 151.3) > 0.47;
          const morphLoopDurationMs =
            MORPH_LOOP_DURATION_MIN_MS +
            Math.floor(seededUnit(index + 233.9) * MORPH_LOOP_DURATION_VAR_MS);
          const morphLoopDelayMs = -Math.floor(seededUnit(index + 211.7) * morphLoopDurationMs);
          const orbitDurationMs =
            ORBIT_DURATION_MIN_MS + Math.floor(seededUnit(index + 631.9) * ORBIT_DURATION_VAR_MS);
          const introStaggerMs = Math.floor(seededUnit(index + 701.7) * INTRO_STAGGER_MAX_MS);
          const introDurationMs =
            INTRO_EXPLODE_DURATION_MS +
            Math.floor(seededUnit(index + 709.9) * INTRO_EXPLODE_DURATION_VAR_MS);
          const orbitStartDelayMs = introStaggerMs + introDurationMs;
          const orbitStartRad = (orbitStartDeg * Math.PI) / 180;
          const introCurveRadius = 10 + seededUnit(index + 719.3) * 22;
          const introCurveX = Math.cos(orbitStartRad + Math.PI / 2) * introCurveRadius;
          const introCurveY = Math.sin(orbitStartRad + Math.PI / 2) * introCurveRadius;
          const orbitDriftDurationMs =
            ORBIT_DRIFT_DURATION_MIN_MS +
            Math.floor(seededUnit(index + 727.1) * ORBIT_DRIFT_DURATION_VAR_MS);
          const orbitDriftDelayMs = -Math.floor(seededUnit(index + 733.7) * orbitDriftDurationMs);
          const orbitDriftX = (seededUnit(index + 739.9) - 0.5) * 16;
          const orbitDriftY = (seededUnit(index + 743.3) - 0.5) * 16;
          const orbitRadiusBreath = 0.03 + seededUnit(index + 751.1) * 0.05;
          const naturalScaleDurationMs =
            NATURAL_SCALE_DURATION_MIN_MS +
            Math.floor(seededUnit(index + 757.9) * NATURAL_SCALE_DURATION_VAR_MS);
          const naturalScaleDelayMs = -Math.floor(seededUnit(index + 761.3) * naturalScaleDurationMs);
          const naturalScaleMin = 0.94 + seededUnit(index + 769.7) * 0.04;
          const naturalScaleMax = 1.01 + seededUnit(index + 773.9) * 0.05;
          const scatterFragments = makeScatterFragments(
            row.title,
            index + 53,
            tileWidth,
            tileHeight
          );

          return (
            <div key={row.id} className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]">
              <div
                className="absolute left-0 top-0 [transform-style:preserve-3d]"
                style={
                  {
                    "--intro-from-x": `${(-Math.cos(orbitStartRad) * orbitRadius).toFixed(2)}px`,
                    "--intro-from-y": `${(-Math.sin(orbitStartRad) * orbitRadius).toFixed(2)}px`,
                    "--intro-curve-x": `${introCurveX.toFixed(2)}px`,
                    "--intro-curve-y": `${introCurveY.toFixed(2)}px`,
                    animation: `imageWallIntroExplode ${introDurationMs}ms cubic-bezier(0.18, 0.9, 0.24, 1) both`,
                    animationDelay: `${introStaggerMs}ms`,
                  } as CSSProperties
                }
              >
                <div
                  className="absolute left-0 top-0 [transform-style:preserve-3d]"
                  style={
                    {
                    "--orbit-start": `${orbitStartDeg.toFixed(3)}deg`,
                    "--orbit-radius": `${orbitRadius.toFixed(2)}px`,
                    "--orbit-r-breath": orbitRadiusBreath.toFixed(3),
                    animation: `imageWallOrbitClockwiseOrganic ${orbitDurationMs}ms linear infinite`,
                    animationDelay: `${orbitStartDelayMs}ms`,
                    animationFillMode: "both",
                  } as CSSProperties
                }
              >
                <div
                  className="absolute left-0 top-0 [transform-style:preserve-3d]"
                  style={
                    {
                      animation: `imageWallOrbitCounter ${orbitDurationMs}ms linear infinite`,
                      animationDelay: `${orbitStartDelayMs}ms`,
                      animationFillMode: "both",
                    } as CSSProperties
                  }
                >
                  <div
                    className="absolute left-0 top-0 [transform-style:preserve-3d]"
                    style={
                      {
                        "--orbit-dx": `${orbitDriftX.toFixed(2)}px`,
                        "--orbit-dy": `${orbitDriftY.toFixed(2)}px`,
                        animation: `imageWallOrbitDrift ${orbitDriftDurationMs}ms cubic-bezier(0.33, 1, 0.68, 1) infinite alternate`,
                        animationDelay: `${orbitDriftDelayMs}ms`,
                      } as CSSProperties
                    }
                  >
                    <div
                      className="absolute bg-transparent text-left"
                      style={{
                        width: `${tileWidth}px`,
                        height: `${tileHeight}px`,
                        marginLeft: `${-tileWidth / 2}px`,
                        marginTop: `${-tileHeight / 2}px`,
                        zIndex: Math.round(depthUnit * 100),
                        opacity: depthAlpha,
                        transform: `translate3d(0, 0, ${zDepth.toFixed(2)}px)`,
                      }}
                    >
                    <div
                      className="absolute inset-0"
                      style={
                        {
                          "--natural-scale-min": naturalScaleMin.toFixed(3),
                          "--natural-scale-max": naturalScaleMax.toFixed(3),
                          animation: `imageWallCardScaleCycle ${morphLoopDurationMs}ms linear infinite, imageWallNaturalScale ${naturalScaleDurationMs}ms ease-in-out infinite`,
                          animationDelay: `${morphLoopDelayMs}ms, ${naturalScaleDelayMs}ms`,
                        } as CSSProperties
                      }
                    >
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center p-2 font-mono text-[0.66rem] leading-tight transition-all motion-reduce:transition-none"
                        style={{
                          animation: `imageWallTextCycle ${morphLoopDurationMs}ms linear infinite`,
                          animationDelay: `${morphLoopDelayMs}ms`,
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}
                      >
                        <div className="relative h-full w-full">
                          {scatterFragments.map((fragment) => {
                            return (
                              <span
                                key={fragment.id}
                                className="absolute whitespace-nowrap rounded-[2px]"
                                style={
                                  {
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(${fragment.startDxPx.toFixed(2)}px, ${fragment.startDyPx.toFixed(2)}px)`,
                                    fontSize: `${fragment.fontSizePx}px`,
                                    opacity: 0,
                                    color: isDarkTextCard ? "#ffffff" : "#111111",
                                    backgroundColor: isDarkTextCard ? "#000000" : "transparent",
                                    padding: "0px",
                                    fontFamily: "var(--font-geist-mono), monospace",
                                    animation: `imageWallTextRearrange ${morphLoopDurationMs}ms linear infinite`,
                                    animationDelay: `${morphLoopDelayMs + fragment.delayMs}ms`,
                                    "--tx0": `${fragment.startDxPx.toFixed(2)}px`,
                                    "--ty0": `${fragment.startDyPx.toFixed(2)}px`,
                                    "--tx1": `${fragment.endDxPx.toFixed(2)}px`,
                                    "--ty1": `${fragment.endDyPx.toFixed(2)}px`,
                                    "--tx2": `${fragment.exitDxPx.toFixed(2)}px`,
                                    "--ty2": `${fragment.exitDyPx.toFixed(2)}px`,
                                    "--frag-opacity": `${fragment.maxOpacity.toFixed(3)}`,
                                  } as CSSProperties
                                }
                              >
                                {fragment.text}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className="absolute inset-0 overflow-hidden [border-radius:4px]"
                        style={{
                          border: "1px solid rgba(255, 255, 255, 0.22)",
                          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <img
                          src={row.imageUrl}
                          alt={row.title}
                          title={row.title}
                          width={fetchedWidth}
                          height={fetchedHeight}
                          className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-all motion-reduce:transition-none"
                          style={{
                            animation: `imageWallImageCycle ${morphLoopDurationMs}ms linear infinite`,
                            animationDelay: `${morphLoopDelayMs}ms`,
                          filter: "drop-shadow(0 8px 14px rgba(0, 0, 0, 0.24)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18))",
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          );
        })}
        </div>
      </section>

      <style jsx global>{`
        @keyframes imageWallIntroExplode {
          0% {
            transform: translate3d(var(--intro-from-x), var(--intro-from-y), 0);
            opacity: 0.2;
          }
          58% {
            transform: translate3d(
              calc(var(--intro-from-x) * 0.16 + var(--intro-curve-x)),
              calc(var(--intro-from-y) * 0.16 + var(--intro-curve-y)),
              0
            );
            opacity: 1;
          }
          84% {
            transform: translate3d(
              calc(var(--intro-from-x) * 0.04 + var(--intro-curve-x) * 0.2),
              calc(var(--intro-from-y) * 0.04 + var(--intro-curve-y) * 0.2),
              0
            );
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
        }

        @keyframes imageWallCardScaleCycle {
          0% {
            transform: scale(0.12);
          }
          18% {
            transform: scale(1.2);
          }
          38% {
            transform: scale(1.2);
          }
          48% {
            transform: scale(0.12);
          }
          52% {
            transform: scale(0.12);
          }
          68% {
            transform: scale(1.2);
          }
          88% {
            transform: scale(1.2);
          }
          98% {
            transform: scale(0.12);
          }
          100% {
            transform: scale(0.12);
          }
        }

        @keyframes imageWallOrbitClockwiseOrganic {
          0% {
            transform: rotate(var(--orbit-start)) translateX(var(--orbit-radius));
          }
          18% {
            transform: rotate(calc(var(--orbit-start) + 0.13turn))
              translateX(calc(var(--orbit-radius) * (1 + var(--orbit-r-breath))));
          }
          43% {
            transform: rotate(calc(var(--orbit-start) + 0.34turn))
              translateX(calc(var(--orbit-radius) * (1 - var(--orbit-r-breath) * 0.8)));
          }
          71% {
            transform: rotate(calc(var(--orbit-start) + 0.67turn))
              translateX(calc(var(--orbit-radius) * (1 + var(--orbit-r-breath) * 0.45)));
          }
          100% {
            transform: rotate(calc(var(--orbit-start) + 1turn)) translateX(var(--orbit-radius));
          }
        }

        @keyframes imageWallOrbitDrift {
          0% {
            transform: translate3d(calc(var(--orbit-dx) * -0.65), calc(var(--orbit-dy) * 0.4), 0);
          }
          35% {
            transform: translate3d(calc(var(--orbit-dx) * 0.35), calc(var(--orbit-dy) * -0.55), 0);
          }
          100% {
            transform: translate3d(var(--orbit-dx), var(--orbit-dy), 0);
          }
        }

        @keyframes imageWallNaturalScale {
          0% {
            scale: var(--natural-scale-min);
          }
          55% {
            scale: var(--natural-scale-max);
          }
          100% {
            scale: var(--natural-scale-min);
          }
        }

        @keyframes imageWallOrbitCounter {
          0% {
            transform: rotate(calc(var(--orbit-start) * -1));
          }
          100% {
            transform: rotate(calc((var(--orbit-start) + 1turn) * -1));
          }
        }

        @keyframes imageWallTextCycle {
          0% {
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          18% {
            opacity: 1;
          }
          38% {
            opacity: 1;
          }
          48% {
            opacity: 1;
          }
          52%,
          100% {
            opacity: 0;
          }
        }

        @keyframes imageWallTextRearrange {
          0% {
            opacity: 0;
            transform: translate(var(--tx0), var(--ty0));
          }
          4% {
            opacity: var(--frag-opacity);
            transform: translate(var(--tx0), var(--ty0));
          }
          18% {
            opacity: var(--frag-opacity);
            transform: translate(var(--tx1), var(--ty1));
          }
          38% {
            opacity: var(--frag-opacity);
            transform: translate(var(--tx1), var(--ty1));
          }
          48% {
            opacity: var(--frag-opacity);
            transform: translate(var(--tx2), var(--ty2));
          }
          52% {
            opacity: 0;
            transform: translate(var(--tx2), var(--ty2));
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx0), var(--ty0));
          }
        }

        @keyframes imageWallImageCycle {
          0%,
          48% {
            opacity: 0;
          }
          52% {
            opacity: 1;
          }
          68% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          98% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
