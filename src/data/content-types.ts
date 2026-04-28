import type { BlocksContent } from "@strapi/blocks-react-renderer";

export type ContentResource = {
  url: string;
  label: string;
};

export type ContentRow = {
  id: string;
  /** Full title (`Content_Title`) — preview, search, etc. */
  title: string;
  /** Short label (`Short_Title`) — particle thumbnails and tile chrome. */
  shortTitle: string;
  /** Share URL slug derived from the CMS title fields. */
  shareSlug: string;
  imageUrl: string;
  /**
   * URLs from Strapi `Image` (repeatable media) — filled on detail fetch for preview carousel.
   * Catalog list rows usually have `[]` until preview hydrates.
   */
  imageGallery: readonly string[];
  /** Plain text from blocks — search and fallbacks. */
  content: string;
  /** Strapi `Text` blocks JSON; rendered in preview via `@strapi/blocks-react-renderer`. */
  contentBlocks: BlocksContent | null;
  /** External links for the preview “Sources” block; mapped from Strapi repeatable **Source** component(s) on `output` (field `Sources` / `sources` / …) or legacy `Resources`. */
  resources: readonly ContentResource[];
  /**
   * Labels from Strapi resources/links that refer to other outputs (by title / short title),
   * not external URLs. Resolved against the catalog in the content preview.
   */
  linkedOutputNames: readonly string[];
  focusAreas: readonly string[];
  activityTypes: readonly string[];
  year: number;
  /** Display date/year from CMS (`Date` field); may be richer than numeric `year`. */
  yearLabel: string;
  formats: readonly string[];
  networks: readonly string[];
  artists: readonly string[];
  /**
   * Strapi `updatedAt` (ISO 8601) when available from the list/detail API; used for
   * e.g. “latest updates” ordering. Empty string if missing.
   */
  updatedAt: string;
};
