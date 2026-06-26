import fs from "node:fs";

import type { ContentRow } from "@/data/content-types";
import { mapStrapiOutputToContentRow } from "@/lib/strapi/map-output-to-content-row";

import { localCatalogPath } from "./paths";

export type LocalTaxonomyOptionLabels = {
  focusOptionLabels: string[];
  activityOptionLabels: string[];
  formatOptionLabels: string[];
  networkOptionLabels: string[];
  artistOptionLabels: string[];
};

export type LocalCatalogFile = {
  builtAt?: string;
  sourceDb?: string;
  outputs: Record<string, unknown>[];
  taxonomy: LocalTaxonomyOptionLabels;
};

type LocalCatalogCache = {
  rows: ContentRow[];
  byDocumentId: Map<string, ContentRow>;
  taxonomy: LocalTaxonomyOptionLabels;
};

let cache: LocalCatalogCache | null = null;

function readCatalogFile(): LocalCatalogFile {
  const raw = fs.readFileSync(localCatalogPath(), "utf8");
  return JSON.parse(raw) as LocalCatalogFile;
}

export function loadLocalCatalog(): LocalCatalogCache {
  if (cache) return cache;

  const file = readCatalogFile();
  const rows: ContentRow[] = [];
  const byDocumentId = new Map<string, ContentRow>();

  for (const doc of file.outputs) {
    const row = mapStrapiOutputToContentRow(doc);
    if (!row) continue;
    rows.push(row);
    byDocumentId.set(row.id, row);
  }

  cache = {
    rows,
    byDocumentId,
    taxonomy: file.taxonomy ?? {
      focusOptionLabels: [],
      activityOptionLabels: [],
      formatOptionLabels: [],
      networkOptionLabels: [],
      artistOptionLabels: [],
    },
  };

  return cache;
}

export function clearLocalCatalogCache(): void {
  cache = null;
}
