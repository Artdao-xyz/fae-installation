/**
 * Offline CMS snapshot: `data/catalog.json` + `data/media/`.
 *
 * Source selection: `FAE_DATA_SOURCE=local` | `FAE_DATA_SOURCE=strapi`.
 */

import type { ContentRow } from "@/data/content-types";
import { getConfiguredDataSource } from "@/lib/data-source";
import type { StrapiTaxonomyOptionLabels } from "@/lib/strapi/fetch-outputs-list";

import { loadLocalCatalog } from "./load-catalog";
import { localCatalogExists } from "./paths";

export type { DataSource } from "@/lib/data-source";
export {
  getConfiguredDataSource,
  isLocalDataSourceConfigured,
  isStrapiDataSourceConfigured,
} from "@/lib/data-source";

export function localDataSourceRequested(): boolean {
  const configured = getConfiguredDataSource();
  if (configured === "strapi") return false;
  if (configured === "local") return true;
  /** Unset: prefer local snapshot when present (kiosk default). */
  return localCatalogExists();
}

function assertLocalCatalogPresent(): void {
  if (localCatalogExists()) return;
  throw new Error(
    "FAE_DATA_SOURCE=local but data/catalog.json is missing. Run: npm run import:new-data",
  );
}

export function localDataEnabled(): boolean {
  if (!localDataSourceRequested()) return false;
  if (getConfiguredDataSource() === "local") {
    assertLocalCatalogPresent();
  }
  return localCatalogExists();
}

export type LocalCatalogResult = {
  rows: ContentRow[];
  total: number;
  durationMs: number;
};

export function localCatalogOrNull(): LocalCatalogResult | null {
  if (!localDataEnabled()) return null;
  const { rows } = loadLocalCatalog();
  return { rows, total: rows.length, durationMs: 0 };
}

export function localTaxonomyOrNull(): StrapiTaxonomyOptionLabels | null {
  if (!localDataEnabled()) return null;
  return loadLocalCatalog().taxonomy;
}

/**
 * `undefined` → not using local data (call Strapi).
 * `ContentRow | null` → local on; `null` means id not found.
 */
export function localDetailIfEnabled(
  documentId: string,
): ContentRow | null | undefined {
  if (!localDataEnabled()) return undefined;
  return loadLocalCatalog().byDocumentId.get(documentId.trim()) ?? null;
}

export function strapiDataSourceConfigured(): boolean {
  return Boolean(process.env.STRAPI_URL?.trim());
}

export type ContentSourceKind = "local" | "strapi" | "none";

/** Active catalog source without throwing when local data is misconfigured. */
export function resolveContentSourceKind(): ContentSourceKind {
  const configured = getConfiguredDataSource();
  if (configured === "local" || (configured !== "strapi" && localCatalogExists())) {
    return localCatalogExists() ? "local" : "none";
  }

  return strapiDataSourceConfigured() ? "strapi" : "none";
}

export function contentSourceReady(): boolean {
  return resolveContentSourceKind() !== "none";
}
