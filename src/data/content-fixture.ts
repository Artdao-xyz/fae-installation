/**
 * Synthetic catalog for dev. `toSlimCatalogRow` / `getContentFixture*` are only required by
 * `src/lib/strapi/offline-fixture/` — remove those exports with the offline-fixture folder if you
 * drop that feature.
 */
import type { BlocksContent } from "@strapi/blocks-react-renderer";
import {
  ACTIVITY_TYPE_LABELS,
  ARTIST_LABELS,
  FOCUS_AREA_LABELS,
  FORMAT_LABELS,
  NETWORK_LABELS,
} from "@/data/content-taxonomy";
import type { ContentRow } from "@/data/content-types";
import { FIXTURE_BODY_TEMPLATES } from "@/data/fixture-body-templates";
import { FIXTURE_SEED_TITLES } from "@/data/fixture-seed-titles";

function mix(i: number, s: number): number {
  let h = Math.imul(i + 1, 374761393) + Math.imul(s, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return h >>> 0;
}

function tagCount1to3(index: number, salt: number): number {
  return 1 + (mix(index, salt) % 3);
}

function formatCount1to2(index: number, salt: number): number {
  return 1 + (mix(index, salt) % 2);
}

const YEAR_MIN = 2015;
const YEAR_MAX = 2026;

function yearForIndex(index: number): number {
  return YEAR_MIN + (mix(index, 2101) % (YEAR_MAX - YEAR_MIN + 1));
}

function pickDistinctFromPool(
  index: number,
  pool: readonly string[],
  targetCount: number,
  mustInclude: string | undefined,
  saltBase: number,
): string[] {
  const cap = Math.min(targetCount, pool.length);
  const set = new Set<string>();
  if (mustInclude) set.add(mustInclude);
  let attempts = 0;
  while (set.size < cap && attempts < pool.length * 8) {
    const idx = mix(index, saltBase + attempts) % pool.length;
    set.add(pool[idx]!);
    attempts++;
  }
  return Array.from(set);
}

const RESOURCE_LINK_POOL = [
  "https://futureartecosystems.com/",
  "https://www.radicalxchange.org/",
  "https://aerocene.org/",
  "https://www.tate.org.uk/",
  "https://www.e-flux.com/",
  "https://www.creativecommons.org/",
  "https://github.com/artdao",
  "https://www.ethereum.org/",
  "https://ipfs.tech/",
  "https://www.w3.org/TR/did-core/",
  "https://www.zora.co/",
  "https://mirror.xyz/",
  "https://www.figma.com/",
  "https://developer.mozilla.org/",
  "https://www.are.na/",
  "https://www.newmuseum.org/",
  "https://www.serpentinegalleries.org/",
  "https://www.london.gov.uk/",
  "https://www.arts.gov/",
  "https://www.unesco.org/",
] as const;

function pickResourcesForIndex(index: number): string[] {
  const n = 1 + (mix(index, 1601) % 3);
  const out: string[] = [];
  let attempts = 0;
  while (out.length < n && attempts < RESOURCE_LINK_POOL.length * 2) {
    const u =
      RESOURCE_LINK_POOL[mix(index, 1703 + attempts) % RESOURCE_LINK_POOL.length]!;
    if (!out.includes(u)) out.push(u);
    attempts++;
  }
  return out;
}

function buildContentForIndex(index: number, title: string): string {
  const blockCount = 2 + (mix(index, 1807) % 2);
  const parts: string[] = [];
  for (let b = 0; b < blockCount; b++) {
    const bi = mix(index, 1909 + b * 31) % FIXTURE_BODY_TEMPLATES.length;
    parts.push(FIXTURE_BODY_TEMPLATES[bi]!.replace(/\{\{title\}\}/g, title));
  }
  return parts.join("\n\n");
}

/** Mirrors Strapi `Text` JSON so preview can run `BlocksRenderer` offline. */
const FIXTURE_STRAPI_LIKE_BLOCKS_ROW0: BlocksContent = [
  {
    type: "paragraph",
    children: [
      {
        type: "text",
        text: "Fixture body in Strapi blocks shape. Use FAE_USE_STRAPI_FIXTURE=1 to avoid CMS calls while developing.",
      },
    ],
  },
  {
    type: "heading",
    level: 2,
    children: [{ type: "text", text: "Sample heading" }],
  },
  {
    type: "paragraph",
    children: [
      { type: "text", text: "Inline modifiers: " },
      { type: "text", text: "italic", italic: true },
      { type: "text", text: " and " },
      { type: "text", text: "bold", bold: true },
      { type: "text", text: "." },
    ],
  },
];

export const CONTENT_FIXTURE_ROWS: ContentRow[] = FIXTURE_SEED_TITLES.map(
  (title, index) => {
    const numericId = index + 1;
    const paddedId = String(numericId).padStart(3, "0");

    const focusMust =
      index < FOCUS_AREA_LABELS.length ? FOCUS_AREA_LABELS[index] : undefined;
    const activityMust =
      index < ACTIVITY_TYPE_LABELS.length ? ACTIVITY_TYPE_LABELS[index] : undefined;

    const focusAreas = pickDistinctFromPool(
      index,
      FOCUS_AREA_LABELS,
      tagCount1to3(index, 401),
      focusMust,
      701,
    );
    const activityTypes = pickDistinctFromPool(
      index,
      ACTIVITY_TYPE_LABELS,
      tagCount1to3(index, 503),
      activityMust,
      907,
    );

    const formats = pickDistinctFromPool(
      index,
      FORMAT_LABELS,
      formatCount1to2(index, 1113),
      undefined,
      1217,
    );
    const networks = pickDistinctFromPool(
      index,
      NETWORK_LABELS,
      tagCount1to3(index, 1319),
      undefined,
      1423,
    );
    const artists = pickDistinctFromPool(
      index,
      ARTIST_LABELS,
      formatCount1to2(index, 1529),
      undefined,
      1631,
    );

    const year = yearForIndex(index);
    const id = `fxt-${paddedId}`;
    const plainContent = buildContentForIndex(index, title);
    return {
      id,
      title,
      shortTitle: title,
      imageUrl: `https://picsum.photos/seed/${id}/220/220.webp`,
      content: plainContent,
      contentBlocks: index === 0 ? FIXTURE_STRAPI_LIKE_BLOCKS_ROW0 : null,
      resources: pickResourcesForIndex(index),
      focusAreas,
      activityTypes,
      year,
      yearLabel: String(year),
      formats,
      networks,
      artists,
    };
  },
);

/** Same shape as Strapi catalog list rows (no body text or resources until detail). */
export function toSlimCatalogRow(row: ContentRow): ContentRow {
  return {
    ...row,
    content: "",
    contentBlocks: null,
    resources: [],
  };
}

export function getContentFixtureCatalogRows(): ContentRow[] {
  return CONTENT_FIXTURE_ROWS.map(toSlimCatalogRow);
}

export function getContentFixtureDetailByDocumentId(
  documentId: string,
): ContentRow | null {
  const t = documentId.trim();
  if (!t) return null;
  const row = CONTENT_FIXTURE_ROWS.find((r) => r.id === t);
  return row ? { ...row } : null;
}
