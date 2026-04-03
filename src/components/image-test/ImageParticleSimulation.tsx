"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useControls, folder } from "leva";
import { listContent } from "@/lib/content-repository";
import type { ContentFixtureRow } from "@/data/content-fixture";
import {
  Thumbnail,
  getThumbnailFramePx,
  type ThumbnailSize,
} from "@/components/ui/thumbnail-full";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

type Mode = "optimized" | "snappy";

export type ImageParticleSimulationStats = {
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

type Props = {
  mode: Mode;
  imageLimit?: number;
  fetchedWidth: number;
  fetchedHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  speedFactor: number;
  onStatsChange: (stats: ImageParticleSimulationStats) => void;
};

// ---------------------------------------------------------------------------
// Vec3
// ---------------------------------------------------------------------------

type Vec3 = { x: number; y: number; z: number };

function v3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}
function v3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function v3Scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
function v3Len(a: Vec3): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}
function v3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

// ---------------------------------------------------------------------------
// Text chunk extraction
// ---------------------------------------------------------------------------

function extractTextChunks(titles: string[]): string[] {
  const chunks: string[] = [];

  for (const title of titles) {
    const words = title
      .split(/\s+/)
      .map((word) => word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
      .filter(Boolean);

    // Keep only full words.
    for (const word of words) {
      chunks.push(word);
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Defaults (also used as leva initial values)
// ---------------------------------------------------------------------------

const TEXT_PARTICLE_RATIO = 0.5;

const DEFAULTS = {
  perspective: 1000,
  zNear: 400,
  zFar: -600,

  drag: 2.0,
  repulsionRadius: 110,
  repulsionStrength: 8000,
  turbulenceStrength: 180,
  turbulenceSpeed: 1.0,

  orbitSpeedMin: 0.25,
  orbitSpeedMax: 0.6,
  orbitRadialSpring: 0.8,
  orbitTangentialForce: 380,
  orbitZAmplitude: 0.4,
  orbitZSpeedMin: 0.3,
  orbitZSpeedMax: 0.7,
  orbitTiltDeg: -15,
  orbitRadiusSpread: 0.15,
  viewportPadding: 60,
  viewportWallStrength: 3.0,

  lifeSpeedMin: 0.08,
  lifeSpeedMax: 0.22,
  birthPhase: 0.06,
  deathPhaseStart: 0.92,

  /** Max CSS blur (px) for the farthest/smallest tiles (see blurFarGate). */
  blurMax: 3.25,
  /**
   * Normalized on-screen size `sizeT` (0 = smallest): blur ramps in below this.
   * ~0.33 ≈ middle ground — only noticeably far/small tiles blur; foreground stays clean.
   */
  blurFarGate: 0.33,

  baseScaleMin: 0.6,
  baseScaleMax: 1.4,
};

type SimConfig = typeof DEFAULTS;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRand(seed: number): number {
  const v = Math.sin(seed * 9999.91) * 43758.5453;
  return v - Math.floor(v);
}

function noise3d(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.17 + y * 2.31 + z * 0.79) * 0.35 +
    Math.sin(x * 0.71 - y * 1.83 + z * 1.52) * 0.35 +
    Math.sin(x * 2.03 + y * 0.67 - z * 1.19) * 0.3
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const SCRAMBLE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?`~\\\"\\\\¡¿§¶¢£¥©®™†‡•…∞≈≠±÷√∑∏∆ΩΨЖЯ中々";
const SCRAMBLE_BASE_PERIOD_SEC = 4.2;
const SCRAMBLE_PERIOD_VARIANCE_SEC = 3.0;

function scrambleWord(word: string, seed: number, time: number): string {
  if (!word) return word;
  const period =
    SCRAMBLE_BASE_PERIOD_SEC +
    seededRand(seed * 0.73) * SCRAMBLE_PERIOD_VARIANCE_SEC;
  const phase = seededRand(seed * 1.91) * Math.PI * 2;

  // Pulse between calm and scramble states over time.
  const wave = Math.max(0, Math.sin((time / period) * Math.PI * 2 + phase));
  const intensity = Math.pow(wave, 3.2);
  if (intensity < 0.18) return word;

  const timeStep = Math.floor(time * 12);

  let output = "";
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (!/[a-zA-Z0-9]/.test(char)) {
      output += char;
      continue;
    }

    // Random character positions get scrambled, no directional reveal.
    const slotRand = seededRand(seed * 17.3 + i * 11.7 + timeStep * 3.1);
    if (slotRand < intensity * 0.95) {
      const rand = seededRand(seed * 23.9 + i * 19.1 + timeStep * 5.7);
      const randomChar =
        SCRAMBLE_ALPHABET[Math.floor(rand * SCRAMBLE_ALPHABET.length)];
      output += randomChar;
    } else {
      output += char;
    }
  }

  return output;
}

// ---------------------------------------------------------------------------
// Particle
// ---------------------------------------------------------------------------

type Particle = {
  pos: Vec3;
  vel: Vec3;
  acc: Vec3;

  life: number;
  lifeSpeed: number;

  orbitAngle: number;
  orbitSpeed: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  orbitZPhase: number;
  orbitZSpeed: number;

  scale: number;
  baseScale: number;
  opacity: number;

  isText: boolean;
  imageIndex: number;
  textChunkIndex: number;
  seed: number;
};

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------

class ParticleSystem {
  particles: Particle[] = [];
  private imageCount = 0;
  private textChunkCount = 0;
  private nextImageCursor = 0;
  private nextTextCursor = 0;
  private viewW = 1440;
  private viewH = 900;
  private textIndices = new Set<number>();
  cfg: SimConfig = { ...DEFAULTS };

  init(
    count: number,
    imageCount: number,
    textChunkCount: number,
    viewW: number,
    viewH: number
  ) {
    this.imageCount = imageCount;
    this.textChunkCount = textChunkCount;
    this.nextImageCursor = 0;
    this.nextTextCursor = 0;
    this.viewW = viewW;
    this.viewH = viewH;
    this.particles = [];

    this.textIndices = new Set<number>();
    const textCount = Math.max(1, Math.floor(count * TEXT_PARTICLE_RATIO));
    const step = Math.floor(count / textCount);
    for (let t = 0; t < textCount; t++) {
      const idx = (t * step + Math.floor(seededRand(t + 777.3) * step * 0.4)) % count;
      this.textIndices.add(idx);
    }

    for (let i = 0; i < count; i++) {
      const isText = this.textIndices.has(i);
      const p = this.spawn(i, isText);
      p.life = seededRand(i + 500.3) * 0.7;
      this.particles.push(p);
    }
  }

  resize(viewW: number, viewH: number) {
    this.viewW = viewW;
    this.viewH = viewH;
  }

  private pickNextImage(): number {
    const idx = this.nextImageCursor % this.imageCount;
    this.nextImageCursor++;
    return idx;
  }

  private pickNextTextChunk(): number {
    if (this.textChunkCount === 0) return 0;
    const idx = this.nextTextCursor % this.textChunkCount;
    this.nextTextCursor++;
    return idx;
  }

  private spawn(seed: number, isText: boolean): Particle {
    const c = this.cfg;
    const r = (offset: number) => seededRand(seed + offset);

    const baseRadiusX = this.viewW * 0.38;
    const baseRadiusY = this.viewH * 0.32;
    const spread = c.orbitRadiusSpread;
    const orbitRadiusX = baseRadiusX * (1 + (r(2.1) - 0.5) * spread * 2);
    const orbitRadiusY = baseRadiusY * (1 + (r(2.7) - 0.5) * spread * 2);

    const orbitAngle = r(1.1) * Math.PI * 2;
    const orbitSpeed =
      -(c.orbitSpeedMin + r(1.5) * (c.orbitSpeedMax - c.orbitSpeedMin));

    const zRange = c.zNear - c.zFar;
    const tiltRad = (c.orbitTiltDeg * Math.PI) / 180;

    const rawX = Math.cos(orbitAngle) * orbitRadiusX;
    const rawY = Math.sin(orbitAngle) * orbitRadiusY;
    const spawnX = rawX * Math.cos(tiltRad) - rawY * Math.sin(tiltRad);
    const spawnY = rawX * Math.sin(tiltRad) + rawY * Math.cos(tiltRad);
    const spawnZ = c.zFar + zRange * r(4.1);

    const tangentX =
      -Math.sin(orbitAngle) * Math.abs(orbitSpeed) * c.orbitTangentialForce * 0.3;
    const tangentY =
      Math.cos(orbitAngle) * Math.abs(orbitSpeed) * c.orbitTangentialForce * 0.3;
    const tTangentX = tangentX * Math.cos(tiltRad) - tangentY * Math.sin(tiltRad);
    const tTangentY = tangentX * Math.sin(tiltRad) + tangentY * Math.cos(tiltRad);

    return {
      pos: v3(spawnX, spawnY, spawnZ),
      vel: v3(
        tTangentX + (r(6.1) - 0.5) * 40,
        tTangentY + (r(6.5) - 0.5) * 40,
        (r(6.9) - 0.5) * 30
      ),
      acc: v3(),
      life: 0,
      lifeSpeed:
        c.lifeSpeedMin + r(7.3) * (c.lifeSpeedMax - c.lifeSpeedMin),
      orbitAngle,
      orbitSpeed,
      orbitRadiusX,
      orbitRadiusY,
      orbitZPhase: r(3.3) * Math.PI * 2,
      orbitZSpeed:
        c.orbitZSpeedMin + r(3.9) * (c.orbitZSpeedMax - c.orbitZSpeedMin),
      scale: 0,
      baseScale: isText
        ? 1.0
        : c.baseScaleMin + r(8.1) * (c.baseScaleMax - c.baseScaleMin),
      opacity: 0,
      isText,
      imageIndex: isText ? -1 : this.pickNextImage(),
      textChunkIndex: isText ? this.pickNextTextChunk() : -1,
      seed,
    };
  }

  step(dt: number, speed: number, globalTime: number) {
    const c = this.cfg;
    const zRange = c.zNear - c.zFar;
    const effectiveDt = Math.min(dt, 0.05) * speed;
    const particles = this.particles;

    const tiltRad = (c.orbitTiltDeg * Math.PI) / 180;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);
    const halfW = this.viewW / 2 - c.viewportPadding;
    const halfH = this.viewH / 2 - c.viewportPadding;
    const wallK = c.viewportWallStrength;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.acc = v3();

      p.orbitAngle += p.orbitSpeed * effectiveDt;

      const rawTX = Math.cos(p.orbitAngle) * p.orbitRadiusX;
      const rawTY = Math.sin(p.orbitAngle) * p.orbitRadiusY;
      const targetX = rawTX * cosT - rawTY * sinT;
      const targetY = rawTX * sinT + rawTY * cosT;
      const targetZ =
        Math.sin(p.orbitZPhase + globalTime * p.orbitZSpeed) *
        zRange *
        c.orbitZAmplitude;

      const rawTanX =
        -Math.sin(p.orbitAngle) *
        Math.abs(p.orbitSpeed) *
        c.orbitTangentialForce;
      const rawTanY =
        Math.cos(p.orbitAngle) *
        Math.abs(p.orbitSpeed) *
        c.orbitTangentialForce;
      const tanX = rawTanX * cosT - rawTanY * sinT;
      const tanY = rawTanX * sinT + rawTanY * cosT;
      p.acc = v3Add(p.acc, v3(tanX * 0.4, tanY * 0.4, 0));

      const toTarget = v3Sub(v3(targetX, targetY, targetZ), p.pos);
      p.acc = v3Add(p.acc, v3Scale(toTarget, c.orbitRadialSpring));

      p.acc = v3Add(p.acc, v3Scale(p.vel, -c.drag));

      // Soft viewport walls
      if (p.pos.x > halfW) p.acc.x -= (p.pos.x - halfW) * wallK;
      if (p.pos.x < -halfW) p.acc.x -= (p.pos.x + halfW) * wallK;
      if (p.pos.y > halfH) p.acc.y -= (p.pos.y - halfH) * wallK;
      if (p.pos.y < -halfH) p.acc.y -= (p.pos.y + halfH) * wallK;

      const t = globalTime * c.turbulenceSpeed;
      const nx = noise3d(
        p.pos.x * 0.003 + t,
        p.pos.y * 0.003,
        p.pos.z * 0.003
      );
      const ny = noise3d(
        p.pos.x * 0.003,
        p.pos.y * 0.003 + t,
        p.pos.z * 0.003 + 1.7
      );
      const nz = noise3d(
        p.pos.x * 0.003 + 3.1,
        p.pos.y * 0.003,
        p.pos.z * 0.003 + t
      );
      p.acc = v3Add(
        p.acc,
        v3Scale(v3(nx, ny, nz), c.turbulenceStrength)
      );
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const diff = v3Sub(a.pos, b.pos);
        const dist = v3Len(diff);
        if (dist < c.repulsionRadius && dist > 0.01) {
          const force = c.repulsionStrength / (dist * dist);
          const push = v3Scale(diff, force / dist);
          a.acc = v3Add(a.acc, push);
          b.acc = v3Add(b.acc, v3Scale(push, -1));
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.vel = v3Add(p.vel, v3Scale(p.acc, effectiveDt));
      p.pos = v3Add(p.pos, v3Scale(p.vel, effectiveDt));
      p.pos.z = Math.max(c.zFar, Math.min(c.zNear, p.pos.z));

      p.life += p.lifeSpeed * effectiveDt;

      let lifeFactor: number;
      if (p.life < c.birthPhase) {
        const u = p.life / c.birthPhase;
        lifeFactor = u * u;
      } else if (p.life > c.deathPhaseStart) {
        const u =
          1 -
          (p.life - c.deathPhaseStart) / (1 - c.deathPhaseStart);
        lifeFactor = Math.max(0, u * u);
      } else {
        lifeFactor = 1;
      }

      const breathe =
        1 + Math.sin(globalTime * 2.1 + p.seed * 7.7) * 0.08;
      p.scale = p.baseScale * lifeFactor * breathe;

      p.opacity = lifeFactor;

      if (p.life >= 1) {
        const respawned = this.spawn(
          p.seed + globalTime * 100 + i,
          p.isText
        );
        if (p.isText) {
          respawned.textChunkIndex = this.pickNextTextChunk();
        } else {
          respawned.imageIndex = this.pickNextImage();
        }
        particles[i] = respawned;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function ImageParticleSimulation({
  mode,
  imageLimit,
  fetchedWidth,
  fetchedHeight,
  displayedWidth,
  displayedHeight,
  speedFactor,
  onStatsChange,
}: Props) {
  // ---- Leva controls ----
  const config = useControls({
    "Depth": folder({
      perspective: { value: DEFAULTS.perspective, min: 400, max: 2000, step: 50 },
      zNear: { value: DEFAULTS.zNear, min: 0, max: 800, step: 25 },
      zFar: { value: DEFAULTS.zFar, min: -1200, max: 0, step: 25 },
    }),
    "Orbit": folder({
      orbitSpeedMin: { value: DEFAULTS.orbitSpeedMin, min: 0.02, max: 1.0, step: 0.02 },
      orbitSpeedMax: { value: DEFAULTS.orbitSpeedMax, min: 0.05, max: 1.5, step: 0.02 },
      orbitRadialSpring: { value: DEFAULTS.orbitRadialSpring, min: 0.05, max: 3, step: 0.05 },
      orbitTangentialForce: { value: DEFAULTS.orbitTangentialForce, min: 50, max: 800, step: 10 },
      orbitZAmplitude: { value: DEFAULTS.orbitZAmplitude, min: 0, max: 1, step: 0.05 },
      orbitZSpeedMin: { value: DEFAULTS.orbitZSpeedMin, min: 0.05, max: 2, step: 0.05 },
      orbitZSpeedMax: { value: DEFAULTS.orbitZSpeedMax, min: 0.1, max: 3, step: 0.05 },
      orbitTiltDeg: { value: DEFAULTS.orbitTiltDeg, min: -45, max: 45, step: 1 },
      orbitRadiusSpread: { value: DEFAULTS.orbitRadiusSpread, min: 0, max: 0.6, step: 0.02 },
    }),
    "Bounds": folder({
      viewportPadding: { value: DEFAULTS.viewportPadding, min: 0, max: 200, step: 5 },
      viewportWallStrength: { value: DEFAULTS.viewportWallStrength, min: 0.5, max: 10, step: 0.5 },
    }),
    "Forces": folder({
      drag: { value: DEFAULTS.drag, min: 0.1, max: 5, step: 0.1 },
      turbulenceStrength: { value: DEFAULTS.turbulenceStrength, min: 0, max: 600, step: 10 },
      turbulenceSpeed: { value: DEFAULTS.turbulenceSpeed, min: 0.1, max: 4, step: 0.1 },
      repulsionRadius: { value: DEFAULTS.repulsionRadius, min: 20, max: 300, step: 5 },
      repulsionStrength: { value: DEFAULTS.repulsionStrength, min: 500, max: 20000, step: 500 },
    }),
    "Lifecycle": folder({
      lifeSpeedMin: { value: DEFAULTS.lifeSpeedMin, min: 0.01, max: 0.5, step: 0.01 },
      lifeSpeedMax: { value: DEFAULTS.lifeSpeedMax, min: 0.02, max: 1, step: 0.01 },
      birthPhase: { value: DEFAULTS.birthPhase, min: 0.01, max: 0.3, step: 0.01 },
      deathPhaseStart: { value: DEFAULTS.deathPhaseStart, min: 0.5, max: 0.99, step: 0.01 },
    }),
    "Visual": folder({
      blurMax: { value: DEFAULTS.blurMax, min: 0, max: 12, step: 0.25 },
      blurFarGate: {
        value: DEFAULTS.blurFarGate,
        min: 0.08,
        max: 0.55,
        step: 0.01,
      },
      baseScaleMin: { value: DEFAULTS.baseScaleMin, min: 0.2, max: 2, step: 0.1 },
      baseScaleMax: { value: DEFAULTS.baseScaleMax, min: 0.3, max: 3, step: 0.1 },
    }),
  });

  // ---- State ----
  const [contentRows, setContentRows] = useState<ContentFixtureRow[]>([]);
  const [contentTotal, setContentTotal] = useState(0);
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });

  const textChunks = useMemo(
    () => extractTextChunks(contentRows.map((r) => r.title)),
    [contentRows]
  );

  const thumbnailSize = useMemo<ThumbnailSize>(() => {
    const d = Math.min(displayedWidth, displayedHeight);
    return d <= 80 ? "sm" : d <= 130 ? "md" : "lg";
  }, [displayedWidth, displayedHeight]);

  const thumbnailFramePx = useMemo(
    () => getThumbnailFramePx(thumbnailSize),
    [thumbnailSize]
  );

  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const textRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const systemRef = useRef<ParticleSystem | null>(null);
  const configRef = useRef<SimConfig>(config);
  configRef.current = config;
  const textChunksRef = useRef(textChunks);
  textChunksRef.current = textChunks;

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
      contentRows.length,
      textChunksRef.current.length,
      viewport.width,
      viewport.height
    );

    systemRef.current = sys;
  }, [contentRows, viewport.width, viewport.height]);

  // ---- Animation loop ----
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys || contentRows.length === 0) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = clamp((now - lastTime) / 1000, 0.001, 0.05);
      lastTime = now;
      const globalTime = now / 1000;
      const speed = clamp(speedFactor || 1, 0.1, 4);

      sys.cfg = configRef.current;
      sys.step(dt, speed, globalTime);

      const c = sys.cfg;
      const zRange = c.zNear - c.zFar;

      const chunks = textChunksRef.current;

      for (let i = 0; i < sys.particles.length; i++) {
        const p = sys.particles[i];
        const node = nodeRefs.current[i];
        if (!node) continue;

        const perspScale =
          c.perspective / (c.perspective - p.pos.z);
        const finalScale = Math.max(0, p.scale * perspScale);
        const zIndex = Math.round(
          ((p.pos.z - c.zFar) / zRange) * 1000
        );

        // Blur from on-screen size: gated ramp (sizeT above blurFarGate → no blur).
        // Quadratic farBlend = visible mid-distance haze; cubic was too subtle.
        const psFar = c.perspective / (c.perspective - c.zFar);
        const psNear = c.perspective / (c.perspective - c.zNear);
        const apparentMin = c.baseScaleMin * psFar;
        const apparentMax = c.baseScaleMax * psNear * 1.12;
        const span = Math.max(1e-4, apparentMax - apparentMin);
        const sizeT = clamp((finalScale - apparentMin) / span, 0, 1);
        const gate = Math.max(1e-4, c.blurFarGate);
        const farBlend = clamp((gate - sizeT) / gate, 0, 1);
        const blurPx = c.blurMax * farBlend * farBlend;

        node.style.transform = `translate3d(${p.pos.x.toFixed(1)}px, ${p.pos.y.toFixed(1)}px, 0px) scale(${finalScale.toFixed(4)})`;
        node.style.opacity = clamp(p.opacity, 0, 1).toFixed(3);
        node.style.zIndex = String(zIndex);
        node.style.filter =
          blurPx < 0.03 ? "none" : `blur(${blurPx.toFixed(2)}px)`;

        if (p.isText) {
          const textEl = textRefs.current[i];
          if (textEl) {
            const chunk = chunks[p.textChunkIndex];
            if (chunk != null) {
              const targetWord = chunk;
              const scrambled = scrambleWord(targetWord, p.seed, globalTime);
              if (textEl.textContent !== scrambled) {
                textEl.textContent = scrambled;
              }
              if (textEl.dataset.idx !== String(p.textChunkIndex)) {
                textEl.dataset.idx = String(p.textChunkIndex);
              }
            }
          }
        } else {
          const img = imgRefs.current[i];
          if (img && img.dataset.idx !== String(p.imageIndex)) {
            const row = contentRows[p.imageIndex];
            if (row) {
              img.src = row.imageUrl;
              img.alt = row.title;
              img.title = row.title;
              img.dataset.idx = String(p.imageIndex);
            }
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [contentRows, speedFactor]);

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

          if (isText) {
            const isDark = seededRand(i + 30.7) > 0.5;
            const chunk =
              textChunks[i % textChunks.length] ??
              row.title.split(/\s+/)[0] ??
              "TEXT";

            return (
              <div
                key={`text-${row.id}`}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className="absolute left-1/2 top-1/2 will-change-[transform,opacity,filter]"
                style={{
                  opacity: 0,
                  transform: "translate3d(0,0,0) scale(0)",
                }}
              >
                <Thumbnail
                  variant="text"
                  size={thumbnailSize}
                  label={chunk}
                  chipTone={isDark ? "dark" : "light"}
                  labelRef={(el) => {
                    textRefs.current[i] = el;
                  }}
                  accessibilityLabel={chunk}
                />
              </div>
            );
          }

          return (
            <div
              key={row.id}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 will-change-[transform,opacity,filter]"
              style={{
                width: `${thumbnailFramePx}px`,
                height: `${thumbnailFramePx}px`,
                marginLeft: `${-thumbnailFramePx / 2}px`,
                marginTop: `${-thumbnailFramePx / 2}px`,
                opacity: 0,
                transform: "translate3d(0,0,0) scale(0)",
              }}
            >
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
