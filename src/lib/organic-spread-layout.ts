export type OrganicSpreadRect = { left: number; top: number };

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function centersOverlapRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cw: number,
  ch: number,
  gap: number,
): boolean {
  return Math.abs(ax - bx) < cw + gap && Math.abs(ay - by) < ch + gap;
}

function phyllotaxisSeed(
  n: number,
  cx: number,
  cy: number,
  aMax: number,
  bMax: number,
  margin: number,
): { px: number; py: number }[] {
  const ae = aMax * margin;
  const be = bMax * margin;
  const denom = Math.sqrt(Math.max(1, n) - 0.5);
  const out: { px: number; py: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i + 0.5;
    const r = Math.sqrt(t) / denom;
    const theta = i * GOLDEN_ANGLE;
    out.push({
      px: cx + ae * r * Math.cos(theta),
      py: cy + be * r * Math.sin(theta),
    });
  }
  return out;
}

function separateOverlaps(
  pts: { px: number; py: number }[],
  cw: number,
  ch: number,
  gap: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  maxIterations: number,
): void {
  const needX = cw + gap;
  const needY = ch + gap;
  const n = pts.length;

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pts[i]!;
        const b = pts[j]!;
        if (!centersOverlapRect(a.px, a.py, b.px, b.py, cw, ch, gap)) {
          continue;
        }

        let dx = b.px - a.px;
        let dy = b.py - a.py;
        let len = Math.hypot(dx, dy);
        if (len < 1e-5) {
          const ang = (i * 97 + j * 53 + iter * 11) * GOLDEN_ANGLE;
          dx = Math.cos(ang);
          dy = Math.sin(ang);
          len = 1;
        }
        const ux = dx / len;
        const uy = dy / len;

        const adx = Math.abs(b.px - a.px);
        const ady = Math.abs(b.py - a.py);
        const penX = needX - adx;
        const penY = needY - ady;
        const step =
          0.52 *
          (penX > 0 && penY > 0
            ? Math.min(penX, penY)
            : Math.max(penX, penY));

        moved = true;
        a.px -= ux * step * 0.5;
        a.py -= uy * step * 0.5;
        b.px += ux * step * 0.5;
        b.py += uy * step * 0.5;
      }
    }
    for (const p of pts) {
      p.px = clamp(p.px, minX, maxX);
      p.py = clamp(p.py, minY, maxY);
    }
    if (!moved && iter > 3) break;
  }
}

const SEPARATE_ITER = 64;

const OVERLAP_PAD = 2;

/**
 * Pushes full-card **center** points in viewport space (0,0 = top-left) so rects
 * (cw+gap)×(ch+gap) do not overlap, then clamps to the safe padding rect.
 * Used after spread jitter; same model as phyllotaxis + {@link separateOverlaps}.
 */
export function relaxViewportCardCenters(
  centers: { px: number; py: number }[],
  vw: number,
  vh: number,
  cw: number,
  ch: number,
  gap: number,
): void {
  if (centers.length === 0) return;
  const minX = cw / 2 + OVERLAP_PAD;
  const maxX = vw - cw / 2 - OVERLAP_PAD;
  const minY = ch / 2 + OVERLAP_PAD;
  const maxY = vh - ch / 2 - OVERLAP_PAD;
  separateOverlaps(
    centers,
    cw,
    ch,
    gap,
    minX,
    maxX,
    minY,
    maxY,
    SEPARATE_ITER,
  );
}
/**
 * Looser phyllotaxis fill when there are many tiles (room to waste; feels less like a tight lattice).
 */
function phyllMarginForCount(n: number): number {
  return 0.68 + Math.min(0.14, Math.max(0, n - 10) * 0.004);
}

/**
 * Deterministic nudge on each center **before** overlap separation so the physics step
 * starts from a less regular point set (post-hoc pixel jitter alone was too weak).
 */
function applyPhyllotaxisSeedJitter(
  centers: { px: number; py: number }[],
  vw: number,
  vh: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  cw: number,
  ch: number,
  gap: number,
): void {
  const cell = Math.min(cw + gap, ch + gap);
  const amp = cell * 0.2;
  const salt =
    (Math.round(vw) * 2654435761) ^ (Math.round(vh) * 1597334677);
  for (let i = 0; i < centers.length; i++) {
    const h0 = (Math.imul(i, 0x7feb352d) + salt) | 0;
    const a = (Math.imul(h0 ^ (h0 >>> 16), 0x85ebca6b) >>> 0) / 0x100000000;
    const h1 = (Math.imul(i * 0x1e3d, 0x5bd1e995) + (salt * 0x2f1b)) | 0;
    const b = (Math.imul(h1 ^ (h1 >>> 15), 0xc2b2ae35) >>> 0) / 0x100000000;
    const ux = a * 2 - 1;
    const vy = b * 2 - 1;
    const c = centers[i]!;
    c.px += ux * amp;
    c.py += vy * amp;
    c.px = clamp(c.px, minX, maxX);
    c.py = clamp(c.py, minY, maxY);
  }
}

export type OrganicSpreadOptions = {
  viewportWidth: number;
  viewportHeight: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  count: number;
};

export function computeOrganicSpreadLayout(
  options: OrganicSpreadOptions,
): { positions: OrganicSpreadRect[]; placed: number } {
  const {
    viewportWidth: vw,
    viewportHeight: vh,
    cardWidth: cw,
    cardHeight: ch,
    gap,
    count: requested,
  } = options;

  const n = Math.max(0, Math.floor(requested));
  if (n === 0 || vw <= 0 || vh <= 0 || cw <= 0 || ch <= 0) {
    return { positions: [], placed: 0 };
  }

  const pad = 2;
  const cx = vw / 2;
  const cy = vh / 2;
  const aMax = Math.max(4, vw / 2 - cw / 2 - pad);
  const bMax = Math.max(4, vh / 2 - ch / 2 - pad);

  const minX = cw / 2 + pad;
  const maxX = vw - cw / 2 - pad;
  const minY = ch / 2 + pad;
  const maxY = vh - ch / 2 - pad;

  const phyllMargin = phyllMarginForCount(n);

  const centers = phyllotaxisSeed(n, cx, cy, aMax, bMax, phyllMargin);
  for (const c of centers) {
    c.px = clamp(c.px, minX, maxX);
    c.py = clamp(c.py, minY, maxY);
  }

  applyPhyllotaxisSeedJitter(
    centers,
    vw,
    vh,
    minX,
    maxX,
    minY,
    maxY,
    cw,
    ch,
    gap,
  );

  separateOverlaps(
    centers,
    cw,
    ch,
    gap,
    minX,
    maxX,
    minY,
    maxY,
    SEPARATE_ITER,
  );

  const positions: OrganicSpreadRect[] = centers.map(({ px, py }) => ({
    left: px - cw / 2,
    top: py - ch / 2,
  }));

  return { positions, placed: positions.length };
}
