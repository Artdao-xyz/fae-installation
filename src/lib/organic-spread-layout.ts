/**
 * Viewport spread: non-overlapping equal rectangles, packed from the center
 * outward on an ellipse matching the viewport aspect. Candidates are placed on
 * expanding rings; greedy selection preserves center-first order (slot 0 = innermost).
 */

export type OrganicSpreadRect = { left: number; top: number };

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Ramanujan II approximation of ellipse perimeter (semi-axes a, b). */
function ellipsePerimeter(a: number, b: number): number {
  const ae = Math.abs(a);
  const be = Math.abs(b);
  if (ae < 1e-6 && be < 1e-6) return 0;
  const h = ((ae - be) ** 2) / ((ae + be) ** 2);
  return (
    Math.PI * (ae + be) * (1 + (3 * h) / (10 + Math.sqrt(Math.max(0, 4 - 3 * h))))
  );
}

/** Axis-aligned equal-size rects: gap is minimum edge–edge clearance. */
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

function ellipticalNorm(
  px: number,
  py: number,
  cx: number,
  cy: number,
  aMax: number,
  bMax: number,
): number {
  return Math.hypot((px - cx) / aMax, (py - cy) / bMax);
}

type Cand = { px: number; py: number; d: number };

function buildRingCandidates(
  vw: number,
  vh: number,
  cw: number,
  ch: number,
  gap: number,
  rhoStep: number,
  maxRings: number,
): Cand[] {
  const pad = 2;
  const cx = vw / 2;
  const cy = vh / 2;
  const aMax = Math.max(4, vw / 2 - cw / 2 - pad);
  const bMax = Math.max(4, vh / 2 - ch / 2 - pad);

  const candidates: Cand[] = [{ px: cx, py: cy, d: 0 }];

  const slotPitch = cw + gap;

  for (let ring = 1; ring <= maxRings; ring++) {
    let rho = ring * rhoStep;
    if (rho > 0.992) rho = 0.992;

    const ae = aMax * rho;
    const be = bMax * rho;
    const perim = ellipsePerimeter(ae, be);
    let slots = Math.max(3, Math.floor(perim / slotPitch));
    if (rho < 0.14) {
      slots = Math.min(8, Math.max(slots, 3 + ring));
    }

    for (let s = 0; s < slots; s++) {
      const base = (2 * Math.PI * s) / slots;
      const jitter = (hash01(ring * 1009 + s * 173) - 0.5) * 0.4;
      const theta = base + jitter;

      const rhoWobble =
        1 + (hash01(ring * 577 + s * 419) - 0.5) * 0.07;
      let px = cx + aMax * rho * Math.cos(theta) * rhoWobble;
      let py = cy + bMax * rho * Math.sin(theta) * rhoWobble;

      px = clamp(px, cw / 2 + pad, vw - cw / 2 - pad);
      py = clamp(py, ch / 2 + pad, vh - ch / 2 - pad);

      const d = ellipticalNorm(px, py, cx, cy, aMax, bMax);
      candidates.push({ px, py, d });
    }
  }

  candidates.sort((a, b) => {
    if (a.d !== b.d) return a.d - b.d;
    if (a.px !== b.px) return a.px - b.px;
    return a.py - b.py;
  });

  return candidates;
}

function greedyCenterFirst(
  candidates: Cand[],
  n: number,
  cw: number,
  ch: number,
  gapPx: number,
): { px: number; py: number }[] {
  const chosen: { px: number; py: number }[] = [];
  const dedupeEps = 0.45;

  for (const c of candidates) {
    if (chosen.length >= n) break;

    if (
      chosen.some(
        (q) =>
          Math.abs(c.px - q.px) < dedupeEps &&
          Math.abs(c.py - q.py) < dedupeEps,
      )
    ) {
      continue;
    }

    if (
      chosen.some((q) =>
        centersOverlapRect(c.px, c.py, q.px, q.py, cw, ch, gapPx),
      )
    ) {
      continue;
    }

    chosen.push({ px: c.px, py: c.py });
  }

  return chosen;
}

export type OrganicSpreadOptions = {
  viewportWidth: number;
  viewportHeight: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  count: number;
};

/**
 * Returns up to `count` top-left positions. Slot order is center → edge.
 */
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

  let candidates = buildRingCandidates(vw, vh, cw, ch, gap, 0.034, 240);
  let chosen = greedyCenterFirst(candidates, n, cw, ch, gap);

  if (chosen.length < n) {
    const extra = buildRingCandidates(vw, vh, cw, ch, gap, 0.018, 420);
    candidates = extra;
    chosen = greedyCenterFirst(candidates, n, cw, ch, gap);
  }

  if (chosen.length < n) {
    chosen = greedyCenterFirst(
      buildRingCandidates(vw, vh, cw, ch, gap, 0.034, 240),
      n,
      cw,
      ch,
      gap * 0.62,
    );
  }

  const positions: OrganicSpreadRect[] = chosen.map(({ px, py }) => ({
    left: px - cw / 2,
    top: py - ch / 2,
  }));

  return { positions, placed: positions.length };
}
