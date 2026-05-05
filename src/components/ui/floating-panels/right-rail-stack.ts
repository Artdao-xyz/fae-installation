import { getThumbnailFullCardOuterSize } from "@/components/ui/thumbnail-full/thumbnail-dimensions";

/**
 * Same horizontal inset as Tailwind `top-8.5` / `right-8.5` / `bottom-8.5` (8.5 × 0.25rem).
 * Used to align the middle “flex-1” rail with the top/bottom rails in a virtual column.
 */
export const RIGHT_FLOAT_VIEWPORT_INSET = "2.125rem";

/**
 * Shared fixed outer height for About + Latest Updates docks (minimized and peek).
 * Matches the Latest Updates minimized rail (thumbnail lg + padding) so the column stays aligned.
 */
export function floatingDockPanelOuterHeightPx(): number {
  return getThumbnailFullCardOuterSize("lg").height + 40;
}
