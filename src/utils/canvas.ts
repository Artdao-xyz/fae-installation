export type PositionedItem = { x: number; y: number; width: number; height: number };

export const doRectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean => {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
};

export const expandRectForGap = (r: { x: number; y: number; w: number; h: number }, gap: number) => ({
  x: r.x - gap / 2,
  y: r.y - gap / 2,
  w: r.w + gap,
  h: r.h + gap,
});

// Box-Muller transform to sample from standard normal distribution N(0,1)
export const randn = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

export const sampleBiasedPoint = (
  canvasWidth: number,
  canvasHeight: number,
  itemWidth: number,
  itemHeight: number
) => {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const sigmaX = canvasWidth / 5;
  const sigmaY = canvasHeight / 5;
  for (let i = 0; i < 20; i++) {
    const x = Math.round(cx + randn() * sigmaX - itemWidth / 2);
    const y = Math.round(cy + randn() * sigmaY - itemHeight / 2);
    if (x >= 0 && y >= 0 && x + itemWidth <= canvasWidth && y + itemHeight <= canvasHeight) {
      return { x, y };
    }
  }
  const x = Math.min(Math.max(0, Math.round(cx - itemWidth / 2)), Math.max(0, canvasWidth - itemWidth));
  const y = Math.min(Math.max(0, Math.round(cy - itemHeight / 2)), Math.max(0, canvasHeight - itemHeight));
  return { x, y };
};

export const generateNonOverlappingPositions = (
  canvasWidth: number,
  canvasHeight: number,
  numItems: number,
  getItemSizeAt: (i: number) => { width: number; height: number },
  gap: number,
): PositionedItem[] => {
  const placed: PositionedItem[] = [];
  const MAX_ATTEMPTS = 1000;
  for (let i = 0; i < numItems; i++) {
    let attempts = 0;
    let placedThis = false;
    const { width: itemWidth, height: itemHeight } = getItemSizeAt(i);
    while (attempts < MAX_ATTEMPTS && !placedThis) {
      const candidate = sampleBiasedPoint(canvasWidth, canvasHeight, itemWidth, itemHeight);
      const collides = placed.some(p => {
        const a = expandRectForGap({ x: p.x, y: p.y, w: p.width, h: p.height }, gap);
        const b = expandRectForGap({ x: candidate.x, y: candidate.y, w: itemWidth, h: itemHeight }, gap);
        return doRectsOverlap(a, b);
      });
      if (!collides) {
        placed.push({ x: candidate.x, y: candidate.y, width: itemWidth, height: itemHeight });
        placedThis = true;
      }
      attempts++;
    }
    if (!placedThis) {
      const cols = Math.max(1, Math.floor(canvasWidth / itemWidth));
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = Math.min(col * itemWidth, Math.max(0, canvasWidth - itemWidth));
      const y = Math.min(row * itemHeight, Math.max(0, canvasHeight - itemHeight));
      placed.push({ x, y, width: itemWidth, height: itemHeight });
    }
  }
  return placed;
};

export const generateRandomWalkerPositions = (
  canvasWidth: number,
  canvasHeight: number,
  numItems: number,
  getItemSizeAt: (i: number) => { width: number; height: number },
  gap: number,
): PositionedItem[] => {
  const placed: PositionedItem[] = [];
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  };

  // seed center
  const firstSize = getItemSizeAt(0);
  const center = sampleBiasedPoint(canvasWidth, canvasHeight, firstSize.width, firstSize.height);
  placed.push({ x: center.x, y: center.y, width: firstSize.width, height: firstSize.height });

  const directions: Array<'right' | 'left' | 'down' | 'up'> = ['right', 'left', 'down', 'up'];
  let safety = numItems * 100;
  while (placed.length < numItems && safety-- > 0) {
    const seed = placed[Math.floor(Math.random() * placed.length)];
    const dirs = shuffle(directions);
    let placedThis = false;
    for (const dir of dirs) {
      const nextIndex = placed.length;
      const { width: iw, height: ih } = getItemSizeAt(nextIndex);
      const orthoMax = Math.max(0, Math.max(seed.height, ih) - 1);
      const orthoOffset = orthoMax > 0 ? Math.round(Math.random() * (2 * orthoMax) - orthoMax) : 0;
      let x = seed.x;
      let y = seed.y;
      if (dir === 'right') {
        x = seed.x + seed.width + gap;
        y = seed.y + orthoOffset;
      } else if (dir === 'left') {
        x = seed.x - (iw + gap);
        y = seed.y + orthoOffset;
      } else if (dir === 'down') {
        x = seed.x + orthoOffset;
        y = seed.y + seed.height + gap;
      } else if (dir === 'up') {
        x = seed.x + orthoOffset;
        y = seed.y - (ih + gap);
      }
      x = Math.max(0, Math.min(canvasWidth - iw, x));
      y = Math.max(0, Math.min(canvasHeight - ih, y));
      const candidate = { x, y, width: iw, height: ih };
      const collides = placed.some(p => {
        const a = expandRectForGap({ x: p.x, y: p.y, w: p.width, h: p.height }, gap);
        const b = expandRectForGap({ x: candidate.x, y: candidate.y, w: candidate.width, h: candidate.height }, gap);
        return doRectsOverlap(a, b);
      });
      if (!collides) {
        placed.push(candidate);
        placedThis = true;
        break;
      }
    }
    if (!placedThis) {
      const nextIndex = placed.length;
      const sz = getItemSizeAt(nextIndex);
      const fallback = sampleBiasedPoint(canvasWidth, canvasHeight, sz.width, sz.height);
      const collides = placed.some(p => {
        const a = expandRectForGap({ x: p.x, y: p.y, w: p.width, h: p.height }, gap);
        const b = expandRectForGap({ x: fallback.x, y: fallback.y, w: sz.width, h: sz.height }, gap);
        return doRectsOverlap(a, b);
      });
      if (!collides) placed.push({ x: fallback.x, y: fallback.y, width: sz.width, height: sz.height });
    }
  }

  let sprinkleAttempts = numItems * 50;
  while (placed.length < numItems && sprinkleAttempts-- > 0) {
    const nextIndex = placed.length;
    const sz = getItemSizeAt(nextIndex);
    const spot = sampleBiasedPoint(canvasWidth, canvasHeight, sz.width, sz.height);
    const cand = { x: spot.x, y: spot.y, width: sz.width, height: sz.height };
    const collides = placed.some(p => {
      const a = expandRectForGap({ x: p.x, y: p.y, w: p.width, h: p.height }, gap);
      const b = expandRectForGap({ x: cand.x, y: cand.y, w: cand.width, h: cand.height }, gap);
      return doRectsOverlap(a, b);
    });
    if (!collides) placed.push(cand);
  }

  return placed.slice(0, numItems);
};

export type ComputePositionsOptions = {
  count: number;
  gap: number;
  algorithm: 'walker' | 'random';
  getItemSizeAt: (i: number) => { width: number; height: number };
};

export const computePositions = (
  canvasWidth: number,
  canvasHeight: number,
  opts: ComputePositionsOptions,
): PositionedItem[] => {
  const { count, gap, algorithm, getItemSizeAt } = opts;
  if (algorithm === 'walker') {
    return generateRandomWalkerPositions(canvasWidth, canvasHeight, count, getItemSizeAt, gap);
  }
  return generateNonOverlappingPositions(canvasWidth, canvasHeight, count, getItemSizeAt, gap);
};

