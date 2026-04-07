/** Deterministic pseudo-random in [0, 1) for integer lattice points. */
function lattice01(ix: number, iy: number): number {
  const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Smooth 2D value noise at fractional coordinates (large-scale blobs when input changes slowly). */
export function valueNoise2D(nx: number, ny: number): number {
  const x0 = Math.floor(nx);
  const y0 = Math.floor(ny);
  const tx = smoothstep01(nx - x0);
  const ty = smoothstep01(ny - y0);
  const n00 = lattice01(x0, y0);
  const n10 = lattice01(x0 + 1, y0);
  const n01 = lattice01(x0, y0 + 1);
  const n11 = lattice01(x0 + 1, y0 + 1);
  const ix0 = n00 + tx * (n10 - n00);
  const ix1 = n01 + tx * (n11 - n01);
  return ix0 + ty * (ix1 - ix0);
}
