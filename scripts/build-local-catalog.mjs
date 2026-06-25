#!/usr/bin/env node
/**
 * Build `data/catalog.json` from a Strapi SQLite backup (`data.db`).
 * Run after `npm run sync:local-data` (or pass --db / --out).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DERIVATIVE_PREFIX =
  /^(?:(?:small|medium|large|xlarge|thumbnail)(?:_webp)?_)/i;

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  const opts = {
    db: path.join(projectRoot, "data", "data.db"),
    out: path.join(projectRoot, "data", "catalog.json"),
    mediaDir: path.join(projectRoot, "data", "media"),
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--db" && argv[i + 1]) opts.db = path.resolve(argv[++i]);
    else if (arg === "--out" && argv[i + 1]) opts.out = path.resolve(argv[++i]);
    else if (arg === "--media-dir" && argv[i + 1]) {
      opts.mediaDir = path.resolve(argv[++i]);
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

function rewriteUrl(url) {
  if (!url || typeof url !== "string") return url;
  return localMediaPathFromRemoteUrl(url) || url;
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

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const id = row[key];
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
  }
  return map;
}

function buildOutputs(dbPath) {
  const outputs = queryJson(
    dbPath,
    `SELECT
      id,
      document_id AS documentId,
      content_title AS Content_Title,
      short_title AS Short_Title,
      date AS Date,
      programme AS Programme,
      image_caption AS Image_Caption,
      text AS Text,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM outputs
    ORDER BY "index" ASC, id ASC`,
  );

  const files = queryJson(
    dbPath,
    `SELECT
      fr.related_id AS output_id,
      fr.field,
      f.url,
      f.formats,
      f.mime,
      f.ext,
      fr."order" AS ord
    FROM files_related_mph fr
    JOIN files f ON f.id = fr.file_id
    WHERE fr.related_type = 'api::output.output'
    ORDER BY fr.related_id, fr.field, fr."order"`,
  );

  const focus = queryJson(
    dbPath,
    `SELECT l.output_id, fo.name AS Name
     FROM outputs_focus_lnk l
     JOIN focus_options fo ON fo.id = l.focus_option_id
     ORDER BY l.output_id, l.focus_option_ord`,
  );

  const activity = queryJson(
    dbPath,
    `SELECT l.output_id, ao.name AS Name
     FROM outputs_activity_lnk l
     JOIN activity_options ao ON ao.id = l.activity_option_id
     ORDER BY l.output_id, l.activity_option_ord`,
  );

  const networks = queryJson(
    dbPath,
    `SELECT l.output_id, n.name AS Name
     FROM outputs_network_lnk l
     JOIN networks n ON n.id = l.network_id
     ORDER BY l.output_id, l.network_ord`,
  );

  const formats = queryJson(
    dbPath,
    `SELECT l.output_id, fo.name AS Name
     FROM outputs_format_lnk l
     JOIN format_options fo ON fo.id = l.format_option_id
     ORDER BY l.output_id, l.id`,
  );

  const artists = queryJson(
    dbPath,
    `SELECT l.output_id, a.name AS Name
     FROM outputs_artists_lnk l
     JOIN artists a ON a.id = l.artist_id
     ORDER BY l.output_id, l.artist_ord`,
  );

  const links = queryJson(
    dbPath,
    `SELECT l.output_id, o2.short_title AS Short_Title, o2.content_title AS Content_Title
     FROM outputs_links_lnk l
     JOIN outputs o2 ON o2.id = l.inv_output_id
     ORDER BY l.output_id, l.output_ord`,
  );

  const sources = queryJson(
    dbPath,
    `SELECT
      oc.entity_id AS output_id,
      cgl.url,
      cgl.label,
      oc."order" AS source_ord,
      sc."order" AS link_ord
    FROM outputs_cmps oc
    JOIN components_general_sources cgs ON cgs.id = oc.cmp_id
    JOIN components_general_sources_cmps sc ON sc.entity_id = cgs.id
    JOIN components_general_links cgl ON cgl.id = sc.cmp_id
    WHERE oc.field = 'Source' AND oc.component_type = 'general.sources'
    ORDER BY oc.entity_id, oc."order", sc."order"`,
  );

  const filesByOutput = groupBy(files, "output_id");
  const focusByOutput = groupBy(focus, "output_id");
  const activityByOutput = groupBy(activity, "output_id");
  const networkByOutput = groupBy(networks, "output_id");
  const formatByOutput = groupBy(formats, "output_id");
  const artistByOutput = groupBy(artists, "output_id");
  const linksByOutput = groupBy(links, "output_id");
  const sourcesByOutput = groupBy(sources, "output_id");

  const docs = outputs.map((row) => {
    let text = row.Text;
    if (typeof text === "string" && text.length > 0) {
      try {
        text = JSON.parse(text);
      } catch {
        text = null;
      }
    }

    const outputFiles = filesByOutput.get(row.id) ?? [];
    const thumbs = outputFiles
      .filter((f) => f.field === "Thumbnail")
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
    const images = outputFiles
      .filter((f) => f.field === "Image")
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));

    const sourceRows = sourcesByOutput.get(row.id) ?? [];
    const sourceComponents = [];
    const bySourceOrd = groupBy(sourceRows, "source_ord");
    for (const [, linkRows] of [...bySourceOrd.entries()].sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    )) {
      sourceComponents.push({
        links: linkRows.map((lr) => ({
          url: lr.url,
          label: lr.label ?? "",
        })),
      });
    }

    return {
      documentId: row.documentId,
      Content_Title: row.Content_Title ?? "",
      Short_Title: row.Short_Title ?? "",
      Date: row.Date ?? "",
      Programme: row.Programme ?? null,
      Image_Caption: row.Image_Caption ?? "",
      Text: text,
      createdAt: row.createdAt ?? "",
      updatedAt: row.updatedAt ?? "",
      Thumbnail: thumbs[0] ? fileRowToMedia(thumbs[0]) : null,
      Image: images.map(fileRowToMedia),
      Focus: (focusByOutput.get(row.id) ?? []).map((x) => ({ Name: x.Name })),
      Activity: (activityByOutput.get(row.id) ?? []).map((x) => ({
        Name: x.Name,
      })),
      Network: (networkByOutput.get(row.id) ?? []).map((x) => ({
        Name: x.Name,
      })),
      Format: (formatByOutput.get(row.id) ?? []).map((x) => ({ Name: x.Name })),
      Artists: (artistByOutput.get(row.id) ?? []).map((x) => ({
        Name: x.Name,
      })),
      Links: (linksByOutput.get(row.id) ?? []).map((x) => ({
        Short_Title: x.Short_Title ?? "",
        Content_Title: x.Content_Title ?? "",
      })),
      Source: sourceComponents,
    };
  });

  return docs;
}

function buildTaxonomy(dbPath) {
  const focusOptionLabels = queryJson(
    dbPath,
    `SELECT name FROM focus_options WHERE name IS NOT NULL AND name != '' ORDER BY "index" ASC`,
  ).map((r) => r.name);

  const activityOptionLabels = queryJson(
    dbPath,
    `SELECT name FROM activity_options WHERE name IS NOT NULL AND name != '' ORDER BY "index" ASC`,
  ).map((r) => r.name);

  const formatOptionLabels = queryJson(
    dbPath,
    `SELECT name FROM format_options WHERE name IS NOT NULL AND name != '' ORDER BY "index" ASC`,
  ).map((r) => r.name);

  const networkOptionLabels = queryJson(
    dbPath,
    `SELECT name FROM networks WHERE name IS NOT NULL AND name != '' ORDER BY "index" ASC`,
  ).map((r) => r.name);

  const artistOptionLabels = queryJson(
    dbPath,
    `SELECT name FROM artists WHERE name IS NOT NULL AND name != '' ORDER BY "index" ASC`,
  ).map((r) => r.name);

  return {
    focusOptionLabels,
    activityOptionLabels,
    formatOptionLabels,
    networkOptionLabels,
    artistOptionLabels,
  };
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

function validateMedia(docs, mediaDir) {
  const referenced = collectReferencedBasenames(docs);
  const missing = [];
  for (const basename of referenced) {
    const filePath = path.join(mediaDir, basename);
    if (!fs.existsSync(filePath)) missing.push(basename);
  }
  return { referenced: referenced.size, missing };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(opts.db)) {
    console.error(`Database not found: ${opts.db}`);
    console.error("Run: npm run sync:local-data");
    process.exit(1);
  }

  console.log(`Building catalog from ${opts.db}`);
  const outputs = buildOutputs(opts.db);
  const taxonomy = buildTaxonomy(opts.db);

  const catalog = {
    builtAt: new Date().toISOString(),
    sourceDb: opts.db,
    outputs,
    taxonomy,
  };

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, `${JSON.stringify(catalog, null, 2)}\n`);

  const { referenced, missing } = validateMedia(outputs, opts.mediaDir);
  console.log(`Wrote ${outputs.length} outputs → ${opts.out}`);
  console.log(`Media references: ${referenced}, missing on disk: ${missing.length}`);
  if (missing.length > 0) {
    console.warn("Missing media files (first 10):");
    for (const name of missing.slice(0, 10)) {
      console.warn(`  - ${name}`);
    }
    process.exitCode = 1;
  }
}

main();
