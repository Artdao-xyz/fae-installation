import { CONTENT_FIXTURE_ROWS } from "@/data/content-fixture";
import type { ContentRow } from "@/data/content-types";

export type { ContentRow };

export type ListContentInput = {
  limit?: number;
  offset?: number;
  search?: string;
  latencyMs?: number;
  errorRate?: number;
};

export type ListContentOutput = {
  rows: ContentRow[];
  total: number;
  durationMs: number;
};

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function listContent({
  limit = CONTENT_FIXTURE_ROWS.length,
  offset = 0,
  search = "",
  latencyMs = 140,
  errorRate = 0,
}: ListContentInput = {}): Promise<ListContentOutput> {
  const startedAt = performance.now();

  if (latencyMs > 0) {
    await wait(latencyMs);
  }

  if (errorRate > 0 && Math.random() < errorRate) {
    throw new Error("Simulated repository failure");
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = normalizedSearch
    ? CONTENT_FIXTURE_ROWS.filter((row) =>
        row.title.toLowerCase().includes(normalizedSearch),
      )
    : CONTENT_FIXTURE_ROWS;

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(0, limit);
  const rows = filteredRows.slice(safeOffset, safeOffset + safeLimit);

  return {
    rows,
    total: filteredRows.length,
    durationMs: Math.round(performance.now() - startedAt),
  };
}
