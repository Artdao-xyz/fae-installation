"use client";

import { useEffect, useMemo, useState } from "react";
import { useControls, folder } from "leva";
import {
  Thumbnail,
  getThumbnailFullCardOuterSize,
  type ThumbnailSize,
} from "@/components/ui/thumbnail-full";
import { computeThumbnailSpreadLayout } from "@/lib/thumbnail-spread-layout";

const DEMO_LABELS = ["Fairclouds", "Northwind", "Silverlake", "Marigold", "Harbor"] as const;

export function ThumbnailSpreadDebug() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const read = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const controls = useControls({
    Spread: folder(
      {
        count: { value: 5, min: 1, max: 100, step: 1 },
        gap: { value: 16, min: 0, max: 64, step: 1 },
        spiralScale: {
          value: 10,
          min: 4,
          max: 48,
          step: 1,
          label: "Scatter wobble",
        },
        size: {
          options: { sm: "sm", md: "md", lg: "lg" },
          value: "lg" as ThumbnailSize,
        },
      },
      { collapsed: false },
    ),
  });

  const thumbSize = controls.size as ThumbnailSize;
  const { width: cardW, height: cardH } = getThumbnailFullCardOuterSize(thumbSize);

  const layout = useMemo(
    () =>
      computeThumbnailSpreadLayout({
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        cardWidth: cardW,
        cardHeight: cardH,
        count: controls.count,
        gap: controls.gap,
        spiralScale: controls.spiralScale,
      }),
    [
      viewport.width,
      viewport.height,
      cardW,
      cardH,
      controls.count,
      controls.gap,
      controls.spiralScale,
    ],
  );

  return (
    <div className="relative min-h-screen bg-[#c8c8c8]">
      {viewport.width === 0 ? (
        <p className="p-4 font-sans text-sm text-text-primary">Measuring viewport…</p>
      ) : (
        <>
          {layout.positions.map((pos, i) => (
            <div
              key={`${pos.left}-${pos.top}-${i}`}
              className="absolute"
              style={{ left: pos.left, top: pos.top }}
            >
              <Thumbnail
                variant="full"
                size={thumbSize}
                imageSrc="/title.svg"
                imageAlt=""
                label={DEMO_LABELS[i % DEMO_LABELS.length]!}
                chipTone={i % 2 === 0 ? "light" : "dark"}
              />
            </div>
          ))}
          {layout.placed < layout.requested && (
            <p className="absolute bottom-4 left-4 max-w-sm rounded bg-black/70 px-3 py-2 font-sans text-xs text-white">
              Placed {layout.placed} of {layout.requested}: viewport or gap is too tight for
              this card size. Try smaller size, fewer items, or smaller gap.
            </p>
          )}
        </>
      )}
    </div>
  );
}
