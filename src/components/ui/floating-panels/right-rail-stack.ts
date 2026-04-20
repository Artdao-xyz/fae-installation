import { getThumbnailFullCardOuterSize } from "@/components/ui/thumbnail-full/thumbnail-dimensions";

/**
 * Same horizontal inset as Tailwind `top-8.5` / `right-8.5` / `bottom-8.5` (8.5 × 0.25rem).
 * Used to align the middle “flex-1” rail with the top/bottom rails in a virtual column.
 */
export const RIGHT_FLOAT_VIEWPORT_INSET = "2.125rem";

/** Matches minimized `AboutTabRail`: `min-h-[120px]`. */
export const ABOUT_MINIMIZED_RAIL_HEIGHT_PX = 120;

/** Matches `FellowshipsPanel` minimized wrapper height. */
export function fellowshipsMinimizedOuterHeightPx(): number {
  return getThumbnailFullCardOuterSize("lg").height + 40;
}
