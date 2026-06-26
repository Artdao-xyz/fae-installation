#!/usr/bin/env node
/**
 * Import installation content from `new-data/`:
 *   - content/outputs.json + content/focus-options.json
 *   - images/ (+ optional output-media-overrides.json)
 *   - legacy data.db (optional) for output→media links
 *
 * Writes `data/catalog.json`, copies referenced files to `data/media/`,
 * prunes unreferenced files from `new-data/images/`, and clears `backups/`.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DERIVATIVE_PREFIX =
  /^(?:(?:small|medium|large|xlarge|thumbnail)(?:_webp)?_)/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

function basenameFromRemoteMediaUrl(url) {
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    const noQuery = trimmed.split(/[?#]/)[0] ?? trimmed;
    const parts = noQuery.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? noQuery;
  }
}

function originalMediaBasename(filename) {
  const base = String(filename).trim();
  if (!base) return "";
  return base.replace(DERIVATIVE_PREFIX, "");
}

function localMediaPathFromRemoteUrl(url) {
  const basename = originalMediaBasename(basenameFromRemoteMediaUrl(url));
  if (!basename) return "";
  return `/api/media/${encodeURIComponent(basename).replace(/%2F/g, "/")}`;
}

function rewriteUrl(url) {
  if (!url || typeof url !== "string") return url;
  return localMediaPathFromRemoteUrl(url) || url;
}

function mimeFromExt(ext) {
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return map[String(ext).toLowerCase()] ?? "application/octet-stream";
}

function fileRowToMedia(row) {
  let formats = {};
  if (row.formats) {
    try {
      formats =
        typeof row.formats === "string"
          ? JSON.parse(row.formats)
          : row.formats;
    } catch {
      formats = {};
    }
  }
  const nextFormats = {};
  for (const [key, value] of Object.entries(formats)) {
    if (value && typeof value === "object" && typeof value.url === "string") {
      nextFormats[key] = { ...value, url: rewriteUrl(value.url) };
    } else {
      nextFormats[key] = value;
    }
  }
  return {
    url: rewriteUrl(row.url),
    mime: row.mime ?? undefined,
    ext: row.ext ?? undefined,
    formats: nextFormats,
  };
}

function mediaFromBasename(basename) {
  const ext = path.extname(basename);
  return {
    url: `/api/media/${encodeURIComponent(basename).replace(/%2F/g, "/")}`,
    mime: mimeFromExt(ext),
    ext: ext || undefined,
    formats: {},
  };
}

function parseArgs(argv) {
  const opts = {
    newDataDir: path.join(projectRoot, "new-data"),
    legacyDb: path.join(projectRoot, "data", "data.db"),
    out: path.join(projectRoot, "data", "catalog.json"),
    mediaDir: path.join(projectRoot, "data", "media"),
    backupsDir: path.join(projectRoot, "backups"),
    pruneNewImages: true,
    clearBackups: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--new-data" && argv[i + 1]) {
      opts.newDataDir = path.resolve(argv[++i]);
    } else if (arg === "--legacy-db" && argv[i + 1]) {
      opts.legacyDb = path.resolve(argv[++i]);
    } else if (arg === "--no-prune-new-images") {
      opts.pruneNewImages = false;
    } else if (arg === "--keep-backups") {
      opts.clearBackups = false;
    }
  }
  return opts;
}

function queryJson(dbPath, sql) {
  const out = execFileSync("sqlite3", ["-json", dbPath, sql], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
  if (!out) return [];
  return JSON.parse(out);
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const id = row[key];
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
  }
  return map;
}

function loadLegacyMediaByDocumentId(legacyDb, documentIds) {
  if (!fs.existsSync(legacyDb)) return new Map();
  const idList = documentIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(",");
  const files = queryJson(
    legacyDb,
    `SELECT o.document_id AS documentId, fr.field, f.url, f.formats, f.mime, f.ext, fr."order" AS ord
     FROM outputs o
     JOIN files_related_mph fr ON fr.related_id = o.id AND fr.related_type = 'api::output.output'
     JOIN files f ON f.id = fr.file_id
     WHERE o.document_id IN (${idList})
     ORDER BY o.document_id, fr.field, fr."order"`,
  );
  const byDoc = new Map();
  for (const row of files) {
    if (!byDoc.has(row.documentId)) {
      byDoc.set(row.documentId, { Thumbnail: [], Image: [] });
    }
    const bucket = byDoc.get(row.documentId);
    if (row.field === "Thumbnail") bucket.Thumbnail.push(row);
    else if (row.field === "Image") bucket.Image.push(row);
  }
  const out = new Map();
  for (const [documentId, buckets] of byDoc.entries()) {
    buckets.Thumbnail.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
    buckets.Image.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
    out.set(documentId, {
      Thumbnail: buckets.Thumbnail[0]
        ? fileRowToMedia(buckets.Thumbnail[0])
        : null,
      Image: buckets.Image.map(fileRowToMedia),
    });
  }
  return out;
}

function loadMediaOverrides(newDataDir) {
  const p = path.join(newDataDir, "output-media-overrides.json");
  if (!fs.existsSync(p)) return new Map();
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const out = new Map();
  for (const [documentId, value] of Object.entries(raw)) {
    if (documentId.startsWith("_")) continue;
    const thumb =
      typeof value.Thumbnail === "string" && value.Thumbnail
        ? mediaFromBasename(value.Thumbnail)
        : null;
    const images = Array.isArray(value.Image)
      ? value.Image.filter((x) => typeof x === "string" && x).map(mediaFromBasename)
      : [];
    out.set(documentId, { Thumbnail: thumb, Image: images });
  }
  return out;
}

function relationNames(value) {
  const out = [];
  const visit = (node) => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object") return;
    const name =
      (typeof node.Name === "string" && node.Name) ||
      (typeof node.name === "string" && node.name) ||
      "";
    if (name.trim()) out.push(name.trim());
  };
  visit(value);
  return [...new Set(out)];
}

function buildTaxonomy(outputs, focusOptions) {
  const focusOptionLabels = focusOptions.data
    .map((f) => f.Name)
    .filter((n) => typeof n === "string" && n.trim())
    .sort((a, b) => {
      const ai = focusOptions.data.find((x) => x.Name === a)?.Index ?? 0;
      const bi = focusOptions.data.find((x) => x.Name === b)?.Index ?? 0;
      return ai - bi;
    });

  const uniq = (values) =>
    [...new Set(values.filter((v) => typeof v === "string" && v.trim()))].sort();

  return {
    focusOptionLabels,
    activityOptionLabels: uniq(
      outputs.flatMap((o) => relationNames(o.Activity)),
    ),
    formatOptionLabels: uniq(outputs.flatMap((o) => relationNames(o.Format))),
    networkOptionLabels: uniq(outputs.flatMap((o) => relationNames(o.Network))),
    artistOptionLabels: uniq(outputs.flatMap((o) => relationNames(o.Artists))),
  };
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => {
      if (!link || typeof link !== "object") return null;
      const short =
        typeof link.Short_Title === "string" ? link.Short_Title.trim() : "";
      const content =
        typeof link.Content_Title === "string" ? link.Content_Title.trim() : "";
      if (!short && !content) return null;
      return {
        Short_Title: short || content,
        Content_Title: content || short,
      };
    })
    .filter(Boolean);
}

function normalizeFormat(format) {
  const names = relationNames(format);
  return names.map((Name) => ({ Name }));
}

function collectReferencedBasenames(docs) {
  const basenames = new Set();
  const visitUrl = (url) => {
    if (typeof url !== "string" || !url.startsWith("/api/media/")) return;
    const encoded = url.slice("/api/media/".length);
    const basename = decodeURIComponent(encoded);
    if (basename) basenames.add(basename);
  };
  const visitMedia = (media) => {
    if (!media || typeof media !== "object") return;
    visitUrl(media.url);
    if (media.formats && typeof media.formats === "object") {
      for (const f of Object.values(media.formats)) {
        if (f && typeof f === "object") visitUrl(f.url);
      }
    }
  };
  for (const doc of docs) {
    visitMedia(doc.Thumbnail);
    if (Array.isArray(doc.Image)) {
      for (const img of doc.Image) visitMedia(img);
    }
  }
  return basenames;
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of fs.readdirSync(dir)) {
    if (entry === ".gitkeep") continue;
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const contentDir = path.join(opts.newDataDir, "content");
  const imagesDir = path.join(opts.newDataDir, "images");
  const outputsPath = path.join(contentDir, "outputs.json");
  const focusPath = path.join(contentDir, "focus-options.json");

  for (const p of [outputsPath, focusPath, imagesDir]) {
    if (!fs.existsSync(p)) {
      console.error(`Missing required path: ${p}`);
      process.exit(1);
    }
  }

  const outputsFile = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  const focusFile = JSON.parse(fs.readFileSync(focusPath, "utf8"));
  const outputs = outputsFile.data ?? [];
  const documentIds = outputs.map((o) => o.documentId).filter(Boolean);

  const legacyMedia = loadLegacyMediaByDocumentId(opts.legacyDb, documentIds);
  const overrideMedia = loadMediaOverrides(opts.newDataDir);

  const catalogOutputs = outputs.map((row) => {
    const media =
      legacyMedia.get(row.documentId) ??
      overrideMedia.get(row.documentId) ?? {
        Thumbnail: null,
        Image: [],
      };

    return {
      documentId: row.documentId,
      Content_Title: row.Content_Title ?? "",
      Short_Title: row.Short_Title ?? "",
      Date: row.Date ?? "",
      Programme: row.Programme ?? null,
      Image_Caption: row.Image_Caption ?? "",
      Text: row.Text ?? null,
      createdAt: row.createdAt ?? "",
      updatedAt: row.updatedAt ?? "",
      Thumbnail: media.Thumbnail,
      Image: media.Image,
      Focus: (row.Focus ?? []).map((x) => ({ Name: x.Name })),
      Activity: (row.Activity ?? []).map((x) => ({ Name: x.Name })),
      Network: (row.Network ?? []).map((x) => ({ Name: x.Name })),
      Format: normalizeFormat(row.Format),
      Artists: (row.Artists ?? []).map((x) => ({ Name: x.Name })),
      Links: normalizeLinks(row.Links),
      Source: [],
    };
  });

  const taxonomy = buildTaxonomy(outputs, focusFile);
  const referenced = collectReferencedBasenames(catalogOutputs);

  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter(
      (f) =>
        !f.startsWith(".") &&
        f !== "manifest.jsonl" &&
        f !== "README.txt",
    );

  const missing = [];
  for (const basename of referenced) {
    if (!imageFiles.includes(basename)) missing.push(basename);
  }
  if (missing.length > 0) {
    console.error("Referenced media missing from new-data/images/:");
    for (const name of missing) console.error(`  - ${name}`);
    process.exit(1);
  }

  emptyDir(opts.mediaDir);
  for (const basename of referenced) {
    copyFile(
      path.join(imagesDir, basename),
      path.join(opts.mediaDir, basename),
    );
  }

  if (opts.pruneNewImages) {
    let pruned = 0;
    for (const file of imageFiles) {
      if (referenced.has(file)) continue;
      fs.unlinkSync(path.join(imagesDir, file));
      pruned++;
    }
    console.log(`Pruned ${pruned} unreferenced files from ${imagesDir}`);
  }

  const catalog = {
    builtAt: new Date().toISOString(),
    source: path.join(opts.newDataDir, "content"),
    outputs: catalogOutputs,
    taxonomy,
  };

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, `${JSON.stringify(catalog, null, 2)}\n`);

  const meta = {
    importedAt: new Date().toISOString(),
    newDataDir: opts.newDataDir,
    outputs: catalogOutputs.length,
    mediaFiles: referenced.size,
    legacyDbUsed: fs.existsSync(opts.legacyDb),
    legacyMediaOutputs: legacyMedia.size,
    overrideMediaOutputs: overrideMedia.size,
  };
  fs.writeFileSync(
    path.join(projectRoot, "data", "source.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
  );

  const legacyDbPath = path.join(projectRoot, "data", "data.db");
  if (fs.existsSync(legacyDbPath)) {
    fs.unlinkSync(legacyDbPath);
    console.log("Removed data/data.db");
  }

  if (opts.clearBackups && fs.existsSync(opts.backupsDir)) {
    for (const entry of fs.readdirSync(opts.backupsDir)) {
      fs.rmSync(path.join(opts.backupsDir, entry), {
        recursive: true,
        force: true,
      });
    }
    console.log(`Cleared ${opts.backupsDir}`);
  }

  const withoutMedia = catalogOutputs.filter(
    (o) => !o.Thumbnail && (!o.Image || o.Image.length === 0),
  );
  if (withoutMedia.length > 0) {
    console.warn(
      `Warning: ${withoutMedia.length} outputs have no Thumbnail/Image:`,
    );
    for (const o of withoutMedia) {
      console.warn(`  - ${o.Short_Title || o.Content_Title} (${o.documentId})`);
    }
    process.exitCode = 1;
  }

  console.log(`Wrote ${catalogOutputs.length} outputs → ${opts.out}`);
  console.log(`Copied ${referenced.size} media files → ${opts.mediaDir}`);
}

main();
