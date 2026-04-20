import type { BlocksContent } from "@strapi/blocks-react-renderer";

export type ContentRow = {
  id: string;
  /** Full title (`Content_Title`) — preview, search, etc. */
  title: string;
  /** Short label (`Short_Title`) — particle thumbnails and tile chrome. */
  shortTitle: string;
  imageUrl: string;
  /** Plain text from blocks — search and fallbacks. */
  content: string;
  /** Strapi `Text` blocks JSON; rendered in preview via `@strapi/blocks-react-renderer`. */
  contentBlocks: BlocksContent | null;
  resources: readonly string[];
  focusAreas: readonly string[];
  activityTypes: readonly string[];
  year: number;
  /** Display date/year from CMS (`Date` field); may be richer than numeric `year`. */
  yearLabel: string;
  formats: readonly string[];
  networks: readonly string[];
  artists: readonly string[];
};
