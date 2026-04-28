// ---------------------------------------------------------------------------
// Vec3
// ---------------------------------------------------------------------------

export type Vec3 = { x: number; y: number; z: number };

export function v3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}
export function v3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
export function v3Scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
export function v3Len(a: Vec3): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}
export function v3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

// ---------------------------------------------------------------------------
// Defaults for `ImageParticleSimulationView` config
// ---------------------------------------------------------------------------

export const DEFAULTS = {
  perspective: 600,
  zNear: 75,
  zFar: -100,

  drag: 1.4,
  repulsionRadius: 100,
  repulsionStrength: 6500,
  turbulenceStrength: 130,
  turbulenceSpeed: 1.0,

  orbitSpeedMin: 0.15,
  orbitSpeedMax: 0.26,
  orbitRadialSpring: 0.3,
  orbitTangentialForce: 160,
  orbitZAmplitude: 0.13,
  orbitZSpeedMin: 0.35,
  orbitZSpeedMax: 0.45,
  orbitTiltDeg: -30,
  /** Larger = wider radial band (inner/outer orbit radii differ more). */
  orbitRadiusSpread: 0.1,
  viewportPadding: 80,
  viewportWallStrength: 3.5,

  lifeSpeedMin: 0.03,
  lifeSpeedMax: 0.2,
  /** Normalized life window [0, birthPhase) for fade-in; fade-out uses the same length at end of life. */
  birthPhase: 0.19,

  blurMax: 6.0,
  blurFarGate: 0.11,

  baseScaleMin: 0.72,
  baseScaleMax: 1.32,
};

export type SimConfig = typeof DEFAULTS;

/** Pause life progression and respawn for `step` (e.g. hover, spread, preview overlay). */
export type LifeFreezeOptions = {
  all?: boolean;
  slots?: ReadonlySet<number>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function seededRand(seed: number): number {
  const v = Math.sin(seed * 9999.91) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Index into `wordsByRow[rowIndex]` for idle text tiles (matches `ParticleSystem` spawn).
 * `salt` 0 keeps first paint aligned with React; non-zero varies word on particle respawn.
 */
export function pickIdleTextWordIndex(
  rowIndex: number,
  wordsLength: number,
  salt = 0,
): number {
  if (wordsLength <= 0) return 0;
  return (
    Math.floor(
      seededRand(rowIndex * 17.41 + 203.7 + salt * 47.11) * wordsLength,
    ) % wordsLength
  );
}

function noise3d(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.17 + y * 2.31 + z * 0.79) * 0.35 +
    Math.sin(x * 0.71 - y * 1.83 + z * 1.52) * 0.35 +
    Math.sin(x * 2.03 + y * 0.67 - z * 1.19) * 0.3
  );
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** S-curve 0..1 with zero derivative at endpoints. */
export function smoothstep01(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return v3(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t,
  );
}

// ---------------------------------------------------------------------------
// Particle
// ---------------------------------------------------------------------------

export type Particle = {
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
  /** Content row index for image tiles (slot `i` → row `i`); `-1` for text tiles. */
  imageIndex: number;
  textChunkIndex: number;
  seed: number;
};

export function cloneParticle(p: Particle): Particle {
  return {
    ...p,
    pos: { ...p.pos },
    vel: { ...p.vel },
    acc: { ...p.acc },
  };
}

export function apparentScaleFromParticle(
  p: Particle,
  perspective: number,
): number {
  const denom = Math.max(1e-3, perspective - p.pos.z);
  return Math.max(0, p.scale * (perspective / denom));
}

/**
 * Ideal orbit anchor for `p` (matches radial spring target inside `ParticleSystem.step`).
 * Used to ease demoted spread tiles back into the swarm without a position snap.
 */
export function particleOrbitIdealPos(
  p: Particle,
  c: SimConfig,
  globalTime: number,
): Vec3 {
  const zRange = c.zNear - c.zFar;
  const tiltRad = (c.orbitTiltDeg * Math.PI) / 180;
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);
  const rawTX = Math.cos(p.orbitAngle) * p.orbitRadiusX;
  const rawTY = Math.sin(p.orbitAngle) * p.orbitRadiusY;
  const targetX = rawTX * cosT - rawTY * sinT;
  const targetY = rawTX * sinT + rawTY * cosT;
  const targetZ =
    Math.sin(p.orbitZPhase + globalTime * p.orbitZSpeed) *
    zRange *
    c.orbitZAmplitude;
  const z = Math.max(c.zFar, Math.min(c.zNear, targetZ));
  return v3(targetX, targetY, z);
}

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------

export class ParticleSystem {
  particles: Particle[] = [];
  /** Per row index: words parsed from that row’s title (text tiles only use these). */
  private wordsByRow: ReadonlyArray<ReadonlyArray<string>> = [];
  private viewW = 1440;
  private viewH = 900;
  private textIndices = new Set<number>();
  cfg: SimConfig = { ...DEFAULTS };

  init(
    count: number,
    wordsByRow: ReadonlyArray<ReadonlyArray<string>>,
    viewW: number,
    viewH: number,
  ) {
    this.wordsByRow = wordsByRow;
    this.viewW = viewW;
    this.viewH = viewH;
    this.particles = [];

    this.textIndices = new Set<number>();
    const textCount = Math.max(1, Math.floor(count * TEXT_PARTICLE_RATIO));
    const step = Math.floor(count / textCount);
    for (let t = 0; t < textCount; t++) {
      const idx =
        (t * step + Math.floor(seededRand(t + 777.3) * step * 0.4)) % count;
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

  updateWordsByRow(wordsByRow: ReadonlyArray<ReadonlyArray<string>>) {
    this.wordsByRow = wordsByRow;
  }

  /**
   * @param rowIndex Slot / content row index (used for per-row title words).
   * @param physicsSeed RNG seed for orbit/life; defaults to `rowIndex`. On respawn pass a new value for variety.
   */
  private spawn(
    rowIndex: number,
    isText: boolean,
    physicsSeed?: number,
    wordSalt = 0,
  ): Particle {
    const c = this.cfg;
    const ps = physicsSeed ?? rowIndex;
    const r = (offset: number) => seededRand(ps + offset);

    const baseRadiusX = this.viewW * 0.44;
    const baseRadiusY = this.viewH * 0.38;
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
        (r(6.9) - 0.5) * 30,
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
        ? 1.2
        : c.baseScaleMin + r(8.1) * (c.baseScaleMax - c.baseScaleMin),
      opacity: 0,
      isText,
      imageIndex: isText ? -1 : rowIndex,
      textChunkIndex: isText
        ? pickIdleTextWordIndex(
            rowIndex,
            this.wordsByRow[rowIndex]?.length ?? 0,
            wordSalt,
          )
        : -1,
      seed: ps,
    };
  }

  step(
    dt: number,
    speed: number,
    globalTime: number,
    lifeFreeze?: LifeFreezeOptions,
  ) {
    const c = this.cfg;
    const freezeAll = lifeFreeze?.all === true;
    const freezeSlots = lifeFreeze?.slots;
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

      if (p.pos.x > halfW) p.acc.x -= (p.pos.x - halfW) * wallK;
      if (p.pos.x < -halfW) p.acc.x -= (p.pos.x + halfW) * wallK;
      if (p.pos.y > halfH) p.acc.y -= (p.pos.y - halfH) * wallK;
      if (p.pos.y < -halfH) p.acc.y -= (p.pos.y + halfH) * wallK;

      const t = globalTime * c.turbulenceSpeed;
      const nx = noise3d(
        p.pos.x * 0.003 + t,
        p.pos.y * 0.003,
        p.pos.z * 0.003,
      );
      const ny = noise3d(
        p.pos.x * 0.003,
        p.pos.y * 0.003 + t,
        p.pos.z * 0.003 + 1.7,
      );
      const nz = noise3d(
        p.pos.x * 0.003 + 3.1,
        p.pos.y * 0.003,
        p.pos.z * 0.003 + t,
      );
      p.acc = v3Add(
        p.acc,
        v3Scale(v3(nx, ny, nz), c.turbulenceStrength),
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

      const freezeLife =
        freezeAll || (freezeSlots?.has(i) ?? false);
      if (!freezeLife) {
        p.life += p.lifeSpeed * effectiveDt;
      }

      let lifeFactor: number;
      const b = c.birthPhase;
      /** End of “full opacity” plateau; fade-out starts after this (same smoothstep curve as fade-in). */
      const deathStart = Math.max(b, 1 - b);

      if (p.life < b) {
        const u = clamp(p.life / b, 0, 1);
        lifeFactor = smoothstep01(u);
      } else if (p.life > deathStart) {
        const u = clamp((p.life - deathStart) / (1 - deathStart), 0, 1);
        lifeFactor = smoothstep01(1 - u);
      } else {
        lifeFactor = 1;
      }

      const breathe =
        1 + Math.sin(globalTime * 2.1 + p.seed * 7.7) * 0.08;
      p.scale = p.baseScale * lifeFactor * breathe;

      p.opacity = lifeFactor;

      if (!freezeLife && p.life >= 1) {
        particles[i] = this.spawn(
          i,
          p.isText,
          p.seed + globalTime * 100 + i,
          Math.floor(globalTime * 1000) + i * 17,
        );
      }
    }
  }
}

/** Share with UI when picking which rows are text tiles vs images. */
export const TEXT_PARTICLE_RATIO = 0.5;
