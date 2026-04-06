/**
 * Deterministic “blue noise” placement: Bridson-style Poisson disk from the
 * viewport center (even spacing, irregular — not grid, not distance-sorted shells).
 * Fallback: shuffled Halton greedy fill if the disk stalls.
 */

export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function rectsOverlapInflated(a: Rect, b: Rect, gap: number): boolean {
  const g = gap / 2;
  const ax1 = a.left - g;
  const ay1 = a.top - g;
  const ax2 = a.left + a.width + g;
  const ay2 = a.top + a.height + g;
  const bx1 = b.left - g;
  const by1 = b.top - g;
  const bx2 = b.left + b.width + g;
  const by2 = b.top + b.height + g;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function rectFullyInsideViewport(r: Rect, vw: number, vh: number): boolean {
  return r.left >= 0 && r.top >= 0 && r.left + r.width <= vw && r.top + r.height <= vh;
}

function centerToRect(cx: number, cy: number, w: number, h: number): Rect {
  return { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
}

/** Deterministic [0, 1) — not Math.random. */
function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

function hash01_2(a: number, b: number): number {
  return hash01(a * 73856093 + b * 19349663 + a * b * 83492791);
}

function halton(index: number, base: number): number {
  let h = 0;
  let f = 1 / base;
  let i = index;
  while (i > 0) {
    h += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return h;
}

const K_ATTEMPTS = 45;
const MAX_POISSON_ITERS = 400_000;
const HALTON_FALLBACK = 180_000;

export type SpreadLayoutResult = {
  positions: { left: number; top: number }[];
  requested: number;
  placed: number;
};

const MAX_REQUESTED = 500;

/**
 * Minimum center separation for annulus sampling (Bridson); final validity is
 * always the inflated AABB overlap test.
 */
function bridsonRadius(
  cw: number,
  ch: number,
  gap: number,
  spiralScale: number,
): number {
  const t = Math.min(cw, ch);
  return Math.max(4, t * 0.34 + gap * 0.52 + spiralScale * 0.22);
}

type Pt = { x: number; y: number };

function tryPlace(
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  vw: number,
  vh: number,
  gap: number,
  rects: Rect[],
): boolean {
  const rect = centerToRect(cx, cy, cw, ch);
  if (!rectFullyInsideViewport(rect, vw, vh)) return false;
  for (const o of rects) {
    if (rectsOverlapInflated(rect, o, gap)) return false;
  }
  rects.push(rect);
  return true;
}

/**
 * Bridson Poisson disk: start at center, grow by sampling annuli around random
 * active points (deterministic picks + hashes). Produces irregular, even coverage.
 */
function poissonDiskCenters(
  vw: number,
  vh: number,
  cw: number,
  ch: number,
  gap: number,
  spiralScale: number,
  requested: number,
  rects: Rect[],
): Pt[] {
  const cx = vw / 2;
  const cy = vh / 2;
  const rBase = bridsonRadius(cw, ch, gap, spiralScale);

  const samples: Pt[] = [];
  const active: number[] = [];

  if (tryPlace(cx, cy, cw, ch, vw, vh, gap, rects)) {
    samples.push({ x: cx, y: cy });
    active.push(0);
  }

  let it = 0;
  while (
    samples.length < requested &&
    active.length > 0 &&
    it < MAX_POISSON_ITERS
  ) {
    it++;
    const slot = Math.min(
      active.length - 1,
      Math.max(
        0,
        Math.floor(
          hash01_2(it, samples.length + active.length * 17) * active.length,
        ),
      ),
    );
    const parentIdx = active[slot]!;
    const px = samples[parentIdx]!.x;
    const py = samples[parentIdx]!.y;

    let found = false;
    for (let k = 0; k < K_ATTEMPTS; k++) {
      const u1 = hash01_2(it * 1009 + k, parentIdx * 131);
      const u2 = hash01_2(it * 2011 + k * 7, parentIdx * 251);
      const theta = 2 * Math.PI * u1;
      const rad = rBase * Math.sqrt(1 + 3 * u2);
      const qx = px + rad * Math.cos(theta);
      const qy = py + rad * Math.sin(theta);

      if (tryPlace(qx, qy, cw, ch, vw, vh, gap, rects)) {
        samples.push({ x: qx, y: qy });
        active.push(samples.length - 1);
        found = true;
        break;
      }
    }

    if (!found) {
      active.splice(slot, 1);
    }
  }

  return samples;
}

function shuffledHaltonFill(
  vw: number,
  vh: number,
  cw: number,
  ch: number,
  gap: number,
  spiralScale: number,
  requested: number,
  rects: Rect[],
  existing: Pt[],
): Pt[] {
  const halfW = cw / 2;
  const halfH = ch / 2;
  const left = halfW;
  const top = halfH;
  const right = vw - halfW;
  const bottom = vh - halfH;
  const wSpan = right - left;
  const hSpan = bottom - top;
  if (wSpan <= 0 || hSpan <= 0) return existing;

  const wobble = Math.min(20, spiralScale * 0.4 + Math.min(cw, ch) * 0.03);

  const order: number[] = [];
  for (let i = 1; i <= HALTON_FALLBACK; i++) order.push(i);
  order.sort(
    (a, b) => hash01(a * 2654435761 + spiralScale * 100) - hash01(b * 1597334677),
  );

  const out = [...existing];
  for (const i of order) {
    if (out.length >= requested) break;
    let x = left + wSpan * halton(i, 2);
    let y = top + hSpan * halton(i, 3);
    x += wobble * Math.sin(i * 2.718);
    y += wobble * Math.cos(i * 1.414);
    x = Math.min(right, Math.max(left, x));
    y = Math.min(bottom, Math.max(top, y));
    if (tryPlace(x, y, cw, ch, vw, vh, gap, rects)) {
      out.push({ x, y });
    }
  }

  return out;
}

export function computeThumbnailSpreadLayout(options: {
  viewportWidth: number;
  viewportHeight: number;
  cardWidth: number;
  cardHeight: number;
  count: number;
  gap: number;
  spiralScale: number;
}): SpreadLayoutResult {
  const {
    viewportWidth: vw,
    viewportHeight: vh,
    cardWidth: cw,
    cardHeight: ch,
    gap,
    spiralScale,
  } = options;
  const requested = Math.min(
    MAX_REQUESTED,
    Math.max(0, Math.floor(options.count)),
  );

  if (requested === 0 || vw <= 0 || vh <= 0 || cw <= 0 || ch <= 0) {
    return { positions: [], requested, placed: 0 };
  }

  const rects: Rect[] = [];
  let samples = poissonDiskCenters(
    vw,
    vh,
    cw,
    ch,
    gap,
    spiralScale,
    requested,
    rects,
  );

  if (samples.length < requested) {
    samples = shuffledHaltonFill(
      vw,
      vh,
      cw,
      ch,
      gap,
      spiralScale,
      requested,
      rects,
      samples,
    );
  }

  const positions = samples.slice(0, requested).map((p) => {
    const r = centerToRect(p.x, p.y, cw, ch);
    return { left: r.left, top: r.top };
  });

  return {
    positions,
    requested,
    placed: positions.length,
  };
}
