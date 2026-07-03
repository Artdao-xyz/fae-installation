import type { StarRaster } from "../rasterize-path-stars";
import {
  THERMAL_FOOTER_LOGO_HEIGHT_DOTS,
  THERMAL_FOOTER_SERPENTINE_MAX_WIDTH_DOTS,
} from "../thermal-spec";
import { rasterizeSvgFile } from "./rasterize-monochrome";

const SERPENTINE_LOGO_SVG = "public/svg/serpentine.svg";

/** Serpentine wordmark — matches `ReceiptFooter` layout. */
export async function rasterizeReceiptFooter(): Promise<StarRaster> {
  const heightDots = THERMAL_FOOTER_LOGO_HEIGHT_DOTS;
  return rasterizeSvgFile(
    SERPENTINE_LOGO_SVG,
    heightDots,
    THERMAL_FOOTER_SERPENTINE_MAX_WIDTH_DOTS,
  );
}
