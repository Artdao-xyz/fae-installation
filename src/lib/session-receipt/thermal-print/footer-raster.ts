import {
  THERMAL_CONTENT_DOTS,
  THERMAL_FOOTER_FAE_MAX_WIDTH_DOTS,
  THERMAL_FOOTER_LOGO_HEIGHT_DOTS,
  THERMAL_FOOTER_SERPENTINE_MAX_WIDTH_DOTS,
} from "../thermal-spec";
import { composeRastersRowStart, rasterizeSvgFile } from "./rasterize-monochrome";
import type { StarRaster } from "../rasterize-path-stars";

const FAE_WORDMARK_SVG = "public/title-wordmark.svg";
const SERPENTINE_LOGO_SVG = "public/svg/serpentine.svg";

/** FAE + Serpentine wordmarks — matches `ReceiptFooter` layout. */
export async function rasterizeReceiptFooter(): Promise<StarRaster> {
  const heightDots = THERMAL_FOOTER_LOGO_HEIGHT_DOTS;
  const [fae, serpentine] = await Promise.all([
    rasterizeSvgFile(FAE_WORDMARK_SVG, heightDots, THERMAL_FOOTER_FAE_MAX_WIDTH_DOTS),
    rasterizeSvgFile(
      SERPENTINE_LOGO_SVG,
      heightDots,
      THERMAL_FOOTER_SERPENTINE_MAX_WIDTH_DOTS,
    ),
  ]);
  return composeRastersRowStart(fae, serpentine, THERMAL_CONTENT_DOTS);
}
