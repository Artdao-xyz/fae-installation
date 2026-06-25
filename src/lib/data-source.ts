/**
 * CMS catalog source: offline snapshot (`data/catalog.json`) or live Strapi.
 *
 * Set `FAE_DATA_SOURCE=local` or `FAE_DATA_SOURCE=strapi`.
 * When unset, the app uses local data if `data/catalog.json` exists, otherwise Strapi.
 */

export type DataSource = "local" | "strapi";

const ENV_KEY = "FAE_DATA_SOURCE";

function normalizeDataSource(raw: string): DataSource | null {
  const value = raw.trim().toLowerCase();
  if (value === "local" || value === "strapi") return value;
  return null;
}

/** Explicit `FAE_DATA_SOURCE` value, or `null` when unset/invalid. */
export function getConfiguredDataSource(): DataSource | null {
  const raw = process.env[ENV_KEY]?.trim() ?? "";
  if (!raw) return null;
  const parsed = normalizeDataSource(raw);
  if (!parsed) {
    console.warn(
      `[${ENV_KEY}] invalid value "${raw}" — expected "local" or "strapi"`,
    );
    return null;
  }
  return parsed;
}

export function isLocalDataSourceConfigured(): boolean {
  return getConfiguredDataSource() === "local";
}

export function isStrapiDataSourceConfigured(): boolean {
  return getConfiguredDataSource() === "strapi";
}
