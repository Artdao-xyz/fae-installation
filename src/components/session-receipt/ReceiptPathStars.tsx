"use client";

import { useMemo } from "react";
import {
  pathStarsDisplaySize,
  pathStarsToJpegDataUrl,
} from "@/lib/session-receipt/path-stars-image";
import type { SessionPath } from "@/lib/session-receipt/types";

type ReceiptPathStarsProps = {
  path: SessionPath;
  scale?: number;
};

/** Conceptual journey — JPEG raster for reliable mobile display (matches thermal print). */
export function ReceiptPathStars({
  path,
  scale = 1,
}: ReceiptPathStarsProps) {
  const { widthPx, heightPx } = pathStarsDisplaySize(scale);
  const src = useMemo(
    () => pathStarsToJpegDataUrl(path, scale) || null,
    [path, scale],
  );

  if (!src) {
    return (
      <div
        className="mx-auto bg-white"
        style={{ width: widthPx, height: heightPx, maxWidth: "100%" }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- client-generated JPEG for mobile Safari
    <img
      src={src}
      alt="Your browsing path"
      width={widthPx}
      height={heightPx}
      className="mx-auto block"
      style={{ width: widthPx, height: "auto", maxWidth: "100%" }}
    />
  );
}
