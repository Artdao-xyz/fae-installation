/** Conceptual mouse journey — 16×10 viewport grid for path visualization. */
export const PATH_GRID_COLS = 16;
export const PATH_GRID_ROWS = 10;
export const PATH_GRID_SIZE = PATH_GRID_COLS * PATH_GRID_ROWS;

export type SessionPath = {
  /** Visit counts per cell, row-major (length 160). */
  visits: number[];
  /** First sampled cell index, or -1 if none. */
  start: number;
  /** Last sampled cell index, or -1 if none. */
  end: number;
};

export function createEmptyPath(): SessionPath {
  return {
    visits: Array<number>(PATH_GRID_SIZE).fill(0),
    start: -1,
    end: -1,
  };
}

export function clonePath(path: SessionPath): SessionPath {
  return {
    visits: [...path.visits],
    start: path.start,
    end: path.end,
  };
}

export function hasPathActivity(path: SessionPath): boolean {
  if (path.start >= 0) return true;
  return path.visits.some((count) => count > 0);
}

/** Map viewport coordinates to a grid cell index. */
export function cellIndexFromPoint(
  clientX: number,
  clientY: number,
  width = typeof window !== "undefined" ? window.innerWidth : 1,
  height = typeof window !== "undefined" ? window.innerHeight : 1,
): number {
  const col = Math.min(
    PATH_GRID_COLS - 1,
    Math.max(0, Math.floor((clientX / width) * PATH_GRID_COLS)),
  );
  const row = Math.min(
    PATH_GRID_ROWS - 1,
    Math.max(0, Math.floor((clientY / height) * PATH_GRID_ROWS)),
  );
  return row * PATH_GRID_COLS + col;
}

/** Sample a pointer position — bumps visit count in the current cell. */
export function samplePathPoint(
  path: SessionPath,
  clientX: number,
  clientY: number,
  viewport?: { width: number; height: number },
): void {
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  if (width <= 0 || height <= 0) return;

  const idx = cellIndexFromPoint(clientX, clientY, width, height);
  path.visits[idx] = Math.min(255, (path.visits[idx] ?? 0) + 1);
  if (path.start < 0) path.start = idx;
  path.end = idx;
}

function visitsToNibbleBytes(visits: readonly number[]): Uint8Array {
  const bytes = new Uint8Array(PATH_GRID_SIZE / 2);
  for (let i = 0; i < PATH_GRID_SIZE; i++) {
    const n = Math.min(15, visits[i] ?? 0);
    if (i % 2 === 0) bytes[i / 2] = n << 4;
    else bytes[i / 2] |= n;
  }
  return bytes;
}

function nibbleBytesToVisits(bytes: Uint8Array): number[] {
  const visits = Array<number>(PATH_GRID_SIZE).fill(0);
  for (let i = 0; i < PATH_GRID_SIZE; i++) {
    const byte = bytes[Math.floor(i / 2)] ?? 0;
    visits[i] = i % 2 === 0 ? (byte >> 4) & 0xf : byte & 0xf;
  }
  return visits;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(encoded: string): Uint8Array | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const base64 = padded + "=".repeat(padLen);
    const binary = atob(base64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Compact path for QR — dense grid (`m`) or sparse pairs (`pv`), whichever is smaller. */
export function encodePathField(path: SessionPath): {
  st: number;
  en: number;
  m?: string;
  pv?: number[][];
} | null {
  if (!hasPathActivity(path)) return null;

  const dense = {
    m: bytesToBase64Url(visitsToNibbleBytes(path.visits)),
    st: path.start,
    en: path.end,
  };
  const sparse = encodeSparsePath(path);

  return JSON.stringify(sparse).length < JSON.stringify(dense).length
    ? sparse
    : dense;
}

function encodeSparsePath(path: SessionPath): {
  pv: number[][];
  st: number;
  en: number;
} {
  const pv: number[][] = [];
  for (let idx = 0; idx < PATH_GRID_SIZE; idx++) {
    const count = path.visits[idx] ?? 0;
    if (count > 0) pv.push([idx, Math.min(15, count)]);
  }
  return { pv, st: path.start, en: path.end };
}

function visitsFromSparsePairs(pv: unknown): number[] | null {
  if (!Array.isArray(pv)) return null;
  const visits = Array<number>(PATH_GRID_SIZE).fill(0);
  for (const entry of pv) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [idx, count] = entry;
    if (
      typeof idx !== "number" ||
      typeof count !== "number" ||
      idx < 0 ||
      idx >= PATH_GRID_SIZE
    ) {
      continue;
    }
    visits[idx] = Math.min(15, count);
  }
  return visits;
}

function inferPathEndpoints(
  visits: number[],
  start: number,
  end: number,
): { start: number; end: number } {
  let nextStart = start;
  let nextEnd = end;

  if (nextStart < 0) {
    nextStart = visits.findIndex((count) => count > 0);
  }
  if (nextEnd < 0) {
    for (let i = visits.length - 1; i >= 0; i--) {
      if ((visits[i] ?? 0) > 0) {
        nextEnd = i;
        break;
      }
    }
  }

  return { start: nextStart, end: nextEnd };
}

export function decodePathField(raw: {
  m?: unknown;
  pv?: unknown;
  st?: unknown;
  en?: unknown;
}): SessionPath | undefined {
  const sparseVisits = visitsFromSparsePairs(raw.pv);
  if (sparseVisits) {
    const { start, end } = inferPathEndpoints(
      sparseVisits,
      typeof raw.st === "number" ? raw.st : -1,
      typeof raw.en === "number" ? raw.en : -1,
    );
    return { visits: sparseVisits, start, end };
  }

  if (typeof raw.m !== "string") return undefined;
  const bytes = base64UrlToBytes(raw.m);
  if (!bytes || bytes.length !== PATH_GRID_SIZE / 2) return undefined;

  const visits = nibbleBytesToVisits(bytes);
  const { start, end } = inferPathEndpoints(
    visits,
    typeof raw.st === "number" ? raw.st : -1,
    typeof raw.en === "number" ? raw.en : -1,
  );

  return { visits, start, end };
}
