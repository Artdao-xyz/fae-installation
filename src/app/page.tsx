"use client";

import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";
import {
  FilterSelectionProvider,
  FilterSidebar,
  Search,
  useFilterSelection,
} from "@/components/ui/filter-sidebar";
import { HeroTitleBlock } from "@/components/ui/hero-title-block";
import { MarginGuideFrame } from "@/components/ui/margin-guide-frame";
import { PixelTessellationBackground } from "@/components/ui/pixel-tessellation-background";
import { ImageParticleSimulation } from "@/components/particle-canvas/ImageParticleSimulation";
import { IMAGE_FETCH_LIMIT } from "@/components/particle-canvas/config";
import { FloatingPanelStackProvider } from "@/components/ui/floating-panels/FloatingPanelStackContext";

type Mode = "optimized" | "snappy";

const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-particle-mode";
const RES_MULTIPLIER = 1;
const FETCHED_WIDTH = 440 * RES_MULTIPLIER;
const FETCHED_HEIGHT = 440 * RES_MULTIPLIER;
const DISPLAYED_WIDTH = 75 * RES_MULTIPLIER;
const DISPLAYED_HEIGHT = 75 * RES_MULTIPLIER;

const FloatingDockMount = dynamic(
  () =>
    import("@/components/ui/floating-panels/FloatingDockMount").then(
      (m) => m.FloatingDockMount,
    ),
  { ssr: false },
);

function readStoredMode(): Mode {
  const legacy = window.localStorage.getItem("fae-image-test-mode");
  const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
  const initial = saved ?? legacy;
  if (initial === "optimized" || initial === "snappy") return initial;
  return "optimized";
}

function HomeContent() {
  const particlePlacementRef = useRef<HTMLDivElement>(null);
  const imageLimit = IMAGE_FETCH_LIMIT > 0 ? IMAGE_FETCH_LIMIT : undefined;
  const { filterSearchQuery, setFilterSearchQuery } = useFilterSelection();
  const searching = filterSearchQuery.trim().length > 0;

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
    <div className="flex min-h-screen w-full">
      <FilterSidebar />
      <PixelTessellationBackground />
      <FloatingDockMount />
      <main className="relative z-15 flex min-h-0 min-w-0 flex-1 flex-col p-5 text-ink-body max-lg:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px)+5.75rem)]">
        <div className="pointer-events-none max-lg:hidden" aria-hidden>
          <MarginGuideFrame />
        </div>

        <div
          className={[
            "min-w-0 w-full border-b-hairline border-solid border-ink-primary bg-surface-canvas lg:hidden",
            searching
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "shrink-0",
          ].join(" ")}
        >
          <Search
            value={filterSearchQuery}
            onChange={setFilterSearchQuery}
            fieldId="filter-search-landing"
          />
        </div>

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
  );
}

export default function Home() {
  return (
    <FloatingPanelStackProvider>
      <FilterSelectionProvider>
        <HomeContent />
      </FilterSelectionProvider>
    </FloatingPanelStackProvider>
  );
}
