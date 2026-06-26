import fs from "node:fs";
import path from "node:path";

/** Runtime CMS snapshot (gitignored). See `data/README.txt`. */
export function localDataRoot(): string {
  const override = process.env.FAE_LOCAL_DATA_DIR?.trim();
  if (override) return path.resolve(override);
  return path.join(process.cwd(), "data");
}

export function localCatalogPath(): string {
  return path.join(localDataRoot(), "catalog.json");
}

export function localMediaDir(): string {
  return path.join(localDataRoot(), "media");
}

export function localCatalogExists(): boolean {
  try {
    return fs.existsSync(localCatalogPath());
  } catch {
    return false;
  }
}
