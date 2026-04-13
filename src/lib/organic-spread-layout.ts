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

  const phyllMargin = 0.68;

  const centers = phyllotaxisSeed(n, cx, cy, aMax, bMax, phyllMargin);
  for (const c of centers) {
    c.px = clamp(c.px, minX, maxX);
    c.py = clamp(c.py, minY, maxY);
  }

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
