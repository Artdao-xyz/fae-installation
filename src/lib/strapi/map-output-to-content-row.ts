import type { BlocksContent } from "@strapi/blocks-react-renderer";
import type { ContentResource, ContentRow } from "@/data/content-types";
import { createOutputShareSlug } from "@/lib/output-share-slug";

type StrapiMedia = {
  url?: unknown;
  width?: unknown;
  height?: unknown;
  size?: unknown;
  formats?: Record<string, StrapiMedia | undefined>;
};

/** Preview images display around 362px max; prefer medium derivatives over raw uploads. */
const STRAPI_PREVIEW_IMAGE_URL_PRIORITY = [
  "medium",
  "medium_webp",
  "small",
  "small_webp",
  "large",
  "large_webp",
  "xlarge",
  "xlarge_webp",
  "thumbnail",
  "thumbnail_webp",
] as const;

/** Catalog thumbnails render at 75-120px; prefer CDN derivatives over the raw upload. */
const STRAPI_THUMBNAIL_URL_PRIORITY = [
  "small_webp",
  "small",
  "thumbnail_webp",
  "thumbnail",
  "medium_webp",
  "medium",
] as const;

/** Strapi may nest file fields under `attributes` (REST plugin). */
function mediaPreferredUrl(media: unknown): string | null {
  const m = mediaObject(media);
  if (!m) return null;
  if (m.formats && typeof m.formats === "object") {
    for (const key of STRAPI_PREVIEW_IMAGE_URL_PRIORITY) {
      const f = m.formats[key];
      if (f && typeof f.url === "string" && f.url.length > 0) return f.url;
    }
    for (const key of Object.keys(m.formats)) {
      if (
        (STRAPI_PREVIEW_IMAGE_URL_PRIORITY as readonly string[]).includes(key)
      ) {
        continue;
      }
      const f = m.formats[key];
      if (f && typeof f.url === "string" && f.url.length > 0) return f.url;
    }
  }
  return typeof m.url === "string" && m.url.length > 0 ? m.url : null;
}

function mediaPreferredThumbnailUrl(media: unknown): string | null {
  const m = mediaObject(media);
  if (!m) return null;
  if (m.formats && typeof m.formats === "object") {
    for (const key of STRAPI_THUMBNAIL_URL_PRIORITY) {
      const f = m.formats[key];
      if (f && typeof f.url === "string" && f.url.length > 0) return f.url;
    }
  }
  return typeof m.url === "string" && m.url.length > 0 ? m.url : null;
}

function mediaObject(media: unknown): StrapiMedia | null {
  if (!media || typeof media !== "object") return null;
  const raw = media as Record<string, unknown>;
  return (
    raw.attributes && typeof raw.attributes === "object"
      ? (raw.attributes as StrapiMedia)
      : raw
  ) as StrapiMedia;
}

/**
 * Collects best-effort image URLs from Strapi `Image` when it is a single file, `{ data: [...] }`,
 * or a plain array (repeatable media).
 */
export function collectMediaGalleryUrls(raw: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (u: string | null): void => {
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };

  const visit = (node: unknown): void => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if ("data" in o) {
      visit(o.data);
      return;
    }
    push(mediaPreferredUrl(node));
  };

  visit(raw);
  return out;
}

function pickRelationLabel(obj: Record<string, unknown>): string | null {
  for (const key of [
    "Name",
    "Title",
    "name",
    "title",
  ] as const) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function nameFromRelationEntry(entry: unknown): string | null {
  if (entry == null) return null;
  if (typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;
  const direct = pickRelationLabel(o);
  if (direct) return direct;
  const attrs = o.attributes;
  if (attrs && typeof attrs === "object") {
    return pickRelationLabel(attrs as Record<string, unknown>);
  }
  return null;
}

/**
 * Titles for linked `output` documents (self-referential relation). Strapi does not use
 * `Name` on outputs — we match preview/catalog resolution: Short_Title, then full title.
 */
function outputEntryDisplayTitle(entry: unknown): string | null {
  if (entry == null || typeof entry !== "object") return null;
  const fromObj = (obj: Record<string, unknown>) => {
    for (const key of [
      "Short_Title",
      "Content_Title",
      "Name",
      "Title",
    ] as const) {
      const v = obj[key];
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
    return null;
  };
  const o = entry as Record<string, unknown>;
  const direct = fromObj(o);
  if (direct) return direct;
  const attrs = o.attributes;
  if (attrs && typeof attrs === "object") {
    return fromObj(attrs as Record<string, unknown>);
  }
  return null;
}

/**
 * Walks a Strapi relation value (array, `data` wrapper, nested entries) and collects
 * one display string per linked output.
 */
function collectLinkedOutputTitlesFromRelationValue(
  value: unknown,
): string[] {
  const out: string[] = [];
  const visit = (node: unknown): void => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if ("data" in o) {
      visit(o.data);
      return;
    }
    const t = outputEntryDisplayTitle(o);
    if (t) out.push(t);
  };
  visit(value);
  return out;
}

/** Prefer `Links` (Strapi relation on output); other keys for alternate schemas. */
const LINKED_OUTPUTS_RELATION_KEYS = [
  "Links",
  "Linked_outputs",
  "linked_outputs",
  "LinkedOutputs",
  "Related_outputs",
  "related_outputs",
] as const;

function pickLinkedOutputsRelation(
  o: Record<string, unknown>,
): unknown {
  const env = process.env.STRAPI_OUTPUTS_LINKED_OUTPUTS_RELATION?.trim();
  if (env && env in o) return o[env];
  for (const key of LINKED_OUTPUTS_RELATION_KEYS) {
    if (key in o) return o[key];
  }
  return null;
}

function linkedOutputRelationRaw(doc: Record<string, unknown>): unknown {
  const direct = pickLinkedOutputsRelation(doc);
  if (direct != null) return direct;
  const attrs = doc.attributes;
  if (attrs && typeof attrs === "object") {
    return pickLinkedOutputsRelation(attrs as Record<string, unknown>);
  }
  return null;
}

function mergeOrderUniqueStrings(
  a: readonly string[],
  b: readonly string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (s: string) => {
    const t = s.trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  for (const x of a) push(x);
  for (const x of b) push(x);
  return out;
}

export function strapiDocumentDisplayName(entry: unknown): string | null {
  return nameFromRelationEntry(entry);
}

/** Strapi may return one-to-many as an array, many-to-one as one object, or `{ data: … }`. */
function relationNames(value: unknown): string[] {
  if (value == null) return [];

  const out: string[] = [];
  const visit = (node: unknown): void => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if ("data" in o) {
      visit(o.data);
      return;
    }
    const n = nameFromRelationEntry(o);
    if (n) out.push(n);
  };

  visit(value);
  return out;
}

function formatsFromOutputDoc(doc: Record<string, unknown>): string[] {
  const raw =
    doc.Format ??
    doc.Formats ??
    doc.format ??
    doc.formats;
  return relationNames(raw);
}

function strapiSystemTimestampIso(
  doc: Record<string, unknown>,
  key: "updatedAt" | "createdAt",
): string {
  const direct = doc[key];
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }
  const attrs = doc.attributes;
  if (attrs && typeof attrs === "object") {
    const v = (attrs as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

/**
 * Numeric year for `ContentRow.year`: first 4-digit year in the CMS `Date` value.
 * `Date` may be a single year (`2024`) or an interval (`2022-2024`, `2022–2024`, spaced variants).
 */
function parseYear(dateField: unknown): number {
  if (typeof dateField === "number" && Number.isFinite(dateField))
    return Math.trunc(dateField);
  if (typeof dateField === "string") {
    const trimmed = dateField.trim();
    if (trimmed.length === 0) return 0;
    const m = trimmed.match(/\d{4}/);
    if (m) {
      const y = parseInt(m[0]!, 10);
      if (y >= 1000 && y <= 9999) return y;
    }
  }
  return 0;
}

/** Best-effort plain text for Strapi blocks (paragraphs joined with blank lines). */
export function strapiBlocksToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";

  const collectInline = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const o = node as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (Array.isArray(o.children)) {
      return o.children.map(collectInline).join("");
    }
    return "";
  };

  const paragraphs: string[] = [];
  for (const block of blocks) {
    const t = collectInline(block).trim();
    if (t.length > 0) paragraphs.push(t);
  }
  return paragraphs.join("\n\n").trim();
}

function isExternalResourceUrlString(s: string): boolean {
  const t = s.trim();
  return t.length > 0 && (/^https?:\/\//i.test(t) || t.startsWith("/"));
}

/** Strapi v4 `attributes`; v5 is often flat — merge for URL/label resolution on components. */
function strapiEntryFields(o: Record<string, unknown>): Record<string, unknown> {
  const attrs = o.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    return { ...o, ...(attrs as Record<string, unknown>) };
  }
  return o;
}

function resourcesAndLinkedNamesFromDoc(doc: Record<string, unknown>): {
  resources: ContentResource[];
  linkedNames: string[];
} {
  const resources: ContentResource[] = [];
  const linkedNames: string[] = [];
  const seenUrl = new Set<string>();
  const seenLinked = new Set<string>();

  const pushResource = (v: unknown, label?: unknown) => {
    if (typeof v !== "string") return;
    const t = v.trim();
    if (t.length === 0 || !isExternalResourceUrlString(t)) return;
    if (seenUrl.has(t)) return;
    seenUrl.add(t);
    resources.push({
      url: t,
      label: typeof label === "string" ? label.trim() : "",
    });
  };

  const pushLinked = (v: unknown) => {
    if (typeof v !== "string") return;
    const t = v.trim();
    if (t.length === 0) return;
    if (seenLinked.has(t)) return;
    seenLinked.add(t);
    linkedNames.push(t);
  };

  const sourceLinkLabel = (o: Record<string, unknown>): string => {
    for (const key of [
      "label",
      "Label",
      "Name",
      "Title",
      "name",
      "title",
    ] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
    return "";
  };

  const visitSource = (node: unknown): void => {
    if (node == null) return;
    if (typeof node === "string") {
      if (isExternalResourceUrlString(node)) pushResource(node);
      else pushLinked(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visitSource(item);
      return;
    }
    if (typeof node !== "object") return;

    const o = strapiEntryFields(node as Record<string, unknown>);
    if ("data" in o) {
      visitSource(o.data);
      return;
    }

    const urlCandidate =
      o.Url ??
      o.url ??
      o.URL ??
      o.link ??
      o.Link ??
      o.href ??
      o.Href ??
      o.uri;
    if (
      typeof urlCandidate === "string" &&
      isExternalResourceUrlString(urlCandidate)
    ) {
      pushResource(urlCandidate, sourceLinkLabel(o));
      return;
    }

    if ("links" in o) {
      visitSource(o.links);
      return;
    }

    const label = sourceLinkLabel(o) || nameFromRelationEntry(o);
    if (label) pushLinked(label);
  };

  /**
   * Strapi `Source` on output can be a single component
   * `{ id, links: [{ id, url, label }] }`, repeatable component rows, or legacy `Resources`.
   */
  const fromCms: unknown =
    doc.Sources ??
    doc.sources ??
    doc.Source ??
    doc.source ??
    doc.Resources ??
    doc.resources ??
    doc.Resource_Links;
  const raw: unknown =
    Array.isArray(fromCms) && fromCms.length > 0
      ? fromCms
      : Array.isArray(doc.links)
        ? doc.links
        : null;

  visitSource(raw ?? fromCms);
  return { resources, linkedNames };
}

/**
 * Strapi v5 `find` often returns a flat document; v4/REST can nest fields under `attributes`.
 * Merges so `mapStrapiOutputToContentRow` sees `documentId`, `Text`, etc. at the top level.
 */
export function strapiOutputEntryToFlatRecord(
  entry: unknown,
): Record<string, unknown> | null {
  if (entry == null || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }
  const o = entry as Record<string, unknown>;
  const attrs = o.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    const a = attrs as Record<string, unknown>;
    return { ...a, ...o };
  }
  return o;
}

export function mapStrapiOutputToContentRow(
  doc: Record<string, unknown>,
): ContentRow | null {
  const documentId = doc.documentId;
  if (typeof documentId !== "string" || documentId.length === 0) return null;

  const contentTitle =
    typeof doc.Content_Title === "string" && doc.Content_Title.trim().length > 0
      ? doc.Content_Title.trim()
      : "";
  const shortTitleRaw =
    typeof doc.Short_Title === "string" && doc.Short_Title.trim().length > 0
      ? doc.Short_Title.trim()
      : "";

  const title = contentTitle || shortTitleRaw;
  const shortTitle = shortTitleRaw || contentTitle;
  const configuredSlug =
    typeof doc.Slug === "string" && doc.Slug.trim().length > 0
      ? doc.Slug.trim()
      : "";
  const shareSlug = createOutputShareSlug(
    configuredSlug || shortTitle || title || documentId,
  );

  const imageGallery = collectMediaGalleryUrls(doc.Image);
  const thumbUrl = mediaPreferredThumbnailUrl(doc.Thumbnail);
  const imageUrl = thumbUrl ?? imageGallery[0] ?? "";

  const captionRaw = doc.Image_Caption ?? doc.Caption ?? doc.caption;
  const caption =
    typeof captionRaw === "string" ? captionRaw.trim() : "";

  /** Same `doc` as `Sources` / `Source` (below) — one Strapi detail response, one map pass. */
  const textRaw = "Text" in doc ? doc.Text : undefined;
  const contentBlocks: BlocksContent | null = Array.isArray(textRaw)
    ? (textRaw as BlocksContent)
    : null;
  const content = contentBlocks
    ? strapiBlocksToPlainText(contentBlocks)
    : "";

  const dateStr =
    typeof doc.Date === "string" ? doc.Date.trim() : "";
  const year = parseYear(doc.Date);
  /** Full `Date` string for UI: one year or YYYY–YYYY interval (max length per CMS schema). */
  const yearLabel =
    dateStr.length > 0 ? dateStr : year > 0 ? String(year) : "";

  const { resources, linkedNames: linkedFromResourceFields } =
    resourcesAndLinkedNamesFromDoc(doc);
  const linkedFromOutputRelation = collectLinkedOutputTitlesFromRelationValue(
    linkedOutputRelationRaw(doc),
  );
  const linkedOutputNames = mergeOrderUniqueStrings(
    linkedFromResourceFields,
    linkedFromOutputRelation,
  );

  const updatedAt =
    strapiSystemTimestampIso(doc, "updatedAt") ||
    strapiSystemTimestampIso(doc, "createdAt");

  return {
    id: documentId,
    title,
    shortTitle,
    shareSlug,
    imageUrl,
    imageGallery,
    caption,
    content,
    contentBlocks,
    resources,
    linkedOutputNames,
    focusAreas: relationNames(doc.Focus),
    activityTypes: relationNames(doc.Activity),
    year,
    yearLabel,
    formats: formatsFromOutputDoc(doc),
    networks: relationNames(doc.Network),
    artists: relationNames(
      doc.artist ??
        doc.artists ??
        doc.Artist ??
        doc.Artists,
    ),
    updatedAt,
  };
}

export function mapStrapiOutputsPayloadToContentRows(
  data: unknown,
): ContentRow[] {
  if (!Array.isArray(data)) return [];
  const rows: ContentRow[] = [];
  for (const item of data) {
    if (item && typeof item === "object") {
      const row = mapStrapiOutputToContentRow(item as Record<string, unknown>);
      if (row) rows.push(row);
    }
  }
  return rows;
}
