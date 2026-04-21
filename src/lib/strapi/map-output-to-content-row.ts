import type { BlocksContent } from "@strapi/blocks-react-renderer";
import type { ContentRow } from "@/data/content-types";

type StrapiMedia = {
  url?: unknown;
  formats?: Record<string, { url?: unknown } | undefined>;
};

/** Strapi + Cloudinary `formats` keys — try largest derivatives first when `url` is absent. */
const STRAPI_FORMAT_URL_PRIORITY = [
  "xlarge",
  "large",
  "xlarge_webp",
  "large_webp",
  "medium",
  "medium_webp",
  "small",
  "small_webp",
  "thumbnail",
  "thumbnail_webp",
] as const;

/** Strapi may nest file fields under `attributes` (REST plugin). */
function mediaPreferredUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const raw = media as Record<string, unknown>;
  const m = (
    raw.attributes && typeof raw.attributes === "object"
      ? (raw.attributes as StrapiMedia)
      : raw
  ) as StrapiMedia;
  if (typeof m.url === "string" && m.url.length > 0) return m.url;
  if (m.formats && typeof m.formats === "object") {
    const fmt = m.formats as Record<string, { url?: unknown } | undefined>;
    for (const key of STRAPI_FORMAT_URL_PRIORITY) {
      const f = fmt[key];
      if (f && typeof f.url === "string" && f.url.length > 0) return f.url;
    }
    for (const key of Object.keys(fmt)) {
      if (
        (STRAPI_FORMAT_URL_PRIORITY as readonly string[]).includes(key)
      ) {
        continue;
      }
      const f = fmt[key];
      if (f && typeof f.url === "string" && f.url.length > 0) return f.url;
    }
  }
  return null;
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
  for (const key of ["Name", "Title"] as const) {
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

function parseYear(dateField: unknown): number {
  if (typeof dateField === "number" && Number.isFinite(dateField))
    return dateField;
  if (typeof dateField === "string") {
    const trimmed = dateField.trim();
    const y = parseInt(trimmed.slice(0, 4), 10);
    if (Number.isFinite(y)) return y;
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

function resourcesFromDoc(doc: Record<string, unknown>): string[] {
  const out: string[] = [];
  const pushUrl = (v: unknown) => {
    if (typeof v !== "string") return;
    const t = v.trim();
    if (t.length === 0) return;
    if (/^https?:\/\//i.test(t) || t.startsWith("/")) out.push(t);
  };

  const raw =
    doc.Resources ??
    doc.resources ??
    doc.Links ??
    doc.links ??
    doc.Resource_Links;

  if (!Array.isArray(raw)) return out;

  for (const item of raw) {
    if (typeof item === "string") pushUrl(item);
    else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      pushUrl(
        o.Url ??
          o.url ??
          o.URL ??
          o.link ??
          o.Link ??
          o.href ??
          o.Href ??
          o.uri,
      );
    }
  }
  return out;
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

  const imageGallery = collectMediaGalleryUrls(doc.Image);
  const thumbUrl = mediaPreferredUrl(doc.Thumbnail);
  const imageUrl = thumbUrl ?? imageGallery[0] ?? "";

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
  const yearLabel =
    dateStr.length > 0 ? dateStr : year > 0 ? String(year) : "";

  return {
    id: documentId,
    title,
    shortTitle,
    imageUrl,
    imageGallery,
    content,
    contentBlocks,
    resources: resourcesFromDoc(doc),
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
