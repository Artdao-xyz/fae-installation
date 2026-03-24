"use client";

import { useEffect, useRef, useState } from "react";
import { useControls, folder } from "leva";
import { listContent } from "@/lib/content-repository";
import type { ContentFixtureRow } from "@/data/content-fixture";

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
// Defaults (also used as leva initial values)
// ---------------------------------------------------------------------------

const DEFAULTS = {
  perspective: 1000,
  zNear: 400,
  zFar: -600,

  drag: 1.0,
  repulsionRadius: 110,
  repulsionStrength: 8000,
  turbulenceStrength: 280,
  turbulenceSpeed: 1.4,

  orbitSpeedMin: 0.3,
  orbitSpeedMax: 0.8,
  orbitRadialSpring: 0.5,
  orbitTangentialForce: 400,
  orbitZAmplitude: 0.55,
  orbitZSpeedMin: 0.4,
  orbitZSpeedMax: 1.2,

  lifeSpeedMin: 0.08,
  lifeSpeedMax: 0.22,
  birthPhase: 0.06,
  deathPhaseStart: 0.92,

  blurMax: 6,
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
  blur: number;

  imageIndex: number;
  seed: number;
};

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------

class ParticleSystem {
  particles: Particle[] = [];
  private imageCount = 0;
  private nextImageCursor = 0;
  private viewW = 1440;
  private viewH = 900;
  cfg: SimConfig = { ...DEFAULTS };

  init(count: number, imageCount: number, viewW: number, viewH: number) {
    this.imageCount = imageCount;
    this.nextImageCursor = 0;
    this.viewW = viewW;
    this.viewH = viewH;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const p = this.spawn(i);
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

  private spawn(seed: number): Particle {
    const c = this.cfg;
    const r = (offset: number) => seededRand(seed + offset);

    const orbitAngle = r(1.1) * Math.PI * 2;
    const orbitSpeed =
      c.orbitSpeedMin + r(1.5) * (c.orbitSpeedMax - c.orbitSpeedMin);
    const orbitRadiusX = this.viewW * (0.25 + r(2.1) * 0.38);
    const orbitRadiusY = this.viewH * (0.2 + r(2.7) * 0.32);

    const zRange = c.zNear - c.zFar;
    const spawnX = Math.cos(orbitAngle) * orbitRadiusX;
    const spawnY = Math.sin(orbitAngle) * orbitRadiusY;
    const spawnZ = c.zFar + zRange * r(4.1);

    const tangentX =
      -Math.sin(orbitAngle) * orbitSpeed * c.orbitTangentialForce * 0.3;
    const tangentY =
      Math.cos(orbitAngle) * orbitSpeed * c.orbitTangentialForce * 0.3;

    return {
      pos: v3(spawnX, spawnY, spawnZ),
      vel: v3(
        tangentX + (r(6.1) - 0.5) * 90,
        tangentY + (r(6.5) - 0.5) * 90,
        (r(6.9) - 0.5) * 60
      ),
      acc: v3(),
      life: 0,
      lifeSpeed:
        c.lifeSpeedMin + r(7.3) * (c.lifeSpeedMax - c.lifeSpeedMin),
      orbitAngle,
      orbitSpeed: orbitSpeed * (r(1.9) > 0.15 ? -1 : 1),
      orbitRadiusX,
      orbitRadiusY,
      orbitZPhase: r(3.3) * Math.PI * 2,
      orbitZSpeed:
        c.orbitZSpeedMin + r(3.9) * (c.orbitZSpeedMax - c.orbitZSpeedMin),
      scale: 0,
      baseScale: c.baseScaleMin + r(8.1) * (c.baseScaleMax - c.baseScaleMin),
      opacity: 0,
      blur: c.blurMax,
      imageIndex: this.pickNextImage(),
      seed,
    };
  }

  step(dt: number, speed: number, globalTime: number) {
    const c = this.cfg;
    const zRange = c.zNear - c.zFar;
    const effectiveDt = Math.min(dt, 0.05) * speed;
    const particles = this.particles;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.acc = v3();

      p.orbitAngle += p.orbitSpeed * effectiveDt;

      const targetX = Math.cos(p.orbitAngle) * p.orbitRadiusX;
      const targetY = Math.sin(p.orbitAngle) * p.orbitRadiusY;
      const targetZ =
        Math.sin(p.orbitZPhase + globalTime * p.orbitZSpeed) *
        zRange *
        c.orbitZAmplitude;

      const tangentX =
        -Math.sin(p.orbitAngle) *
        Math.abs(p.orbitSpeed) *
        c.orbitTangentialForce;
      const tangentY =
        Math.cos(p.orbitAngle) *
        Math.abs(p.orbitSpeed) *
        c.orbitTangentialForce;
      const dir = p.orbitSpeed < 0 ? -1 : 1;
      p.acc = v3Add(
        p.acc,
        v3(tangentX * dir * 0.4, tangentY * dir * 0.4, 0)
      );

      const toTarget = v3Sub(v3(targetX, targetY, targetZ), p.pos);
      p.acc = v3Add(p.acc, v3Scale(toTarget, c.orbitRadialSpring));

      p.acc = v3Add(p.acc, v3Scale(p.vel, -c.drag));

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

      const depthUnit = (p.pos.z - c.zFar) / zRange;
      p.opacity = lifeFactor * (0.25 + depthUnit * 0.75);
      p.blur = c.blurMax * (1 - depthUnit) * (1 - depthUnit);

      if (p.life >= 1) {
        const respawned = this.spawn(
          p.seed + globalTime * 100 + i
        );
        respawned.imageIndex = this.pickNextImage();
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
      orbitSpeedMin: { value: DEFAULTS.orbitSpeedMin, min: 0.05, max: 1.5, step: 0.05 },
      orbitSpeedMax: { value: DEFAULTS.orbitSpeedMax, min: 0.1, max: 2.0, step: 0.05 },
      orbitRadialSpring: { value: DEFAULTS.orbitRadialSpring, min: 0.05, max: 3, step: 0.05 },
      orbitTangentialForce: { value: DEFAULTS.orbitTangentialForce, min: 50, max: 1000, step: 10 },
      orbitZAmplitude: { value: DEFAULTS.orbitZAmplitude, min: 0, max: 1, step: 0.05 },
      orbitZSpeedMin: { value: DEFAULTS.orbitZSpeedMin, min: 0.05, max: 2, step: 0.05 },
      orbitZSpeedMax: { value: DEFAULTS.orbitZSpeedMax, min: 0.1, max: 3, step: 0.05 },
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
      blurMax: { value: DEFAULTS.blurMax, min: 0, max: 16, step: 0.5 },
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

  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const systemRef = useRef<ParticleSystem | null>(null);
  const configRef = useRef<SimConfig>(config);
  configRef.current = config;

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

      for (let i = 0; i < sys.particles.length; i++) {
        const p = sys.particles[i];
        const node = nodeRefs.current[i];
        const img = imgRefs.current[i];
        if (!node) continue;

        const perspScale =
          c.perspective / (c.perspective - p.pos.z);
        const finalScale = Math.max(0, p.scale * perspScale);
        const zIndex = Math.round(
          ((p.pos.z - c.zFar) / zRange) * 1000
        );

        node.style.transform = `translate3d(${p.pos.x.toFixed(1)}px, ${p.pos.y.toFixed(1)}px, 0px) scale(${finalScale.toFixed(4)})`;
        node.style.opacity = clamp(p.opacity, 0, 1).toFixed(3);
        node.style.zIndex = String(zIndex);
        node.style.filter = `blur(${p.blur.toFixed(1)}px)`;

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

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [contentRows, speedFactor]);

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
        {contentRows.map((row, i) => (
          <div
            key={row.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2 will-change-[transform,opacity,filter]"
            style={{
              width: `${displayedWidth}px`,
              height: `${displayedHeight}px`,
              marginLeft: `${-displayedWidth / 2}px`,
              marginTop: `${-displayedHeight / 2}px`,
              opacity: 0,
              transform: "translate3d(0,0,0) scale(0)",
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-[3px]"
              style={{
                border: "1.5px solid rgba(120,180,255,0.55)",
                boxShadow:
                  "0 0 12px rgba(100,160,255,0.15), 0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <img
                ref={(el) => {
                  imgRefs.current[i] = el;
                }}
                src={row.imageUrl}
                alt={row.title}
                title={row.title}
                data-idx={String(i)}
                width={fetchedWidth}
                height={fetchedHeight}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
