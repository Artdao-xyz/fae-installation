"use client";

import { useRef, useSyncExternalStore } from "react";
import {
  FilterSidebar,
  FilterSelectionProvider,
} from "@/components/ui/filter-sidebar";
import { AboutPanel } from "@/components/ui/about-panel/AboutPanel";
import { LatestUpdatesPanel } from "@/components/ui/latest-updates-panel/LatestUpdatesPanel";
import { HeroTitleBlock } from "@/components/ui/hero-title-block";
import { MarginGuideFrame } from "@/components/ui/margin-guide-frame";
import { PixelTessellationBackground } from "@/components/ui/pixel-tessellation-background";
import { ImageParticleSimulation } from "@/components/particle-canvas/ImageParticleSimulation";
import { IMAGE_FETCH_LIMIT } from "@/components/particle-canvas/config";

type Mode = "optimized" | "snappy";

const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-particle-mode";
const RES_MULTIPLIER = 1;
const FETCHED_WIDTH = 440 * RES_MULTIPLIER;
const FETCHED_HEIGHT = 440 * RES_MULTIPLIER;
const DISPLAYED_WIDTH = 75 * RES_MULTIPLIER;
const DISPLAYED_HEIGHT = 75 * RES_MULTIPLIER;

function readStoredMode(): Mode {
  const legacy = window.localStorage.getItem("fae-image-test-mode");
  const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
  const initial = saved ?? legacy;
  if (initial === "optimized" || initial === "snappy") return initial;
  return "optimized";
}

export default function Home() {
  const imageLimit = IMAGE_FETCH_LIMIT > 0 ? IMAGE_FETCH_LIMIT : undefined;
  const particlePlacementRef = useRef<HTMLDivElement>(null);

  const mode = useSyncExternalStore(
    (onStoreChange) => {
      const onStorage = () => onStoreChange();
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    readStoredMode,
    (): Mode => "optimized",
  );

  return (
    <FilterSelectionProvider>
      <div className="flex min-h-screen w-full">
        <FilterSidebar />
        <PixelTessellationBackground />
        <AboutPanel />
        <LatestUpdatesPanel />
        <main className="relative z-1 flex min-h-0 min-w-0 flex-1 flex-col p-5 text-ink-body">
          <MarginGuideFrame />
          <HeroTitleBlock
            title="Future Art Ecosystems"
            subtitle="Cultural Infrastructure Research"
          />

          <div
            ref={particlePlacementRef}
            className="relative min-h-0 w-full flex-1"
          >
            <ImageParticleSimulation
              mode={mode}
              imageLimit={imageLimit}
              fetchedWidth={FETCHED_WIDTH}
              fetchedHeight={FETCHED_HEIGHT}
              displayedWidth={DISPLAYED_WIDTH}
              displayedHeight={DISPLAYED_HEIGHT}
              speedFactor={SPEED_FACTOR}
              placementContainerRef={particlePlacementRef}
            />
          </div>
        </main>
      </div>
    </FilterSelectionProvider>
  );
}
