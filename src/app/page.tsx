"use client";

import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";
import {
  FilterSelectionProvider,
  FilterSidebar,
  Search,
  useFilterSelection,
} from "@/components/ui/filter-sidebar";
import { MobileSiteHeader } from "@/components/ui/filter-sidebar/shell/MobileSiteHeader";
import { HeroTitleBlock } from "@/components/ui/hero-title-block";
import { MarginGuideFrame } from "@/components/ui/margin-guide-frame";
import { PixelTessellationBackground } from "@/components/ui/pixel-tessellation-background";
import { ImageParticleSimulation } from "@/components/particle-canvas/ImageParticleSimulation";
import { IMAGE_FETCH_LIMIT } from "@/components/particle-canvas/config";
import {
  FloatingPanelStackProvider,
  useFloatingPanelStack,
} from "@/components/ui/floating-panels/FloatingPanelStackContext";

type Mode = "optimized" | "snappy";

const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-particle-mode";
const RES_MULTIPLIER = 1;
const FETCHED_WIDTH = 440 * RES_MULTIPLIER;
const FETCHED_HEIGHT = 440 * RES_MULTIPLIER;
const DISPLAYED_WIDTH = 75 * RES_MULTIPLIER;
const DISPLAYED_HEIGHT = 75 * RES_MULTIPLIER;

/** TEMP: set to `false` to show the WebGL particle canvas again. */
const HIDE_PARTICLE_CANVAS = true;

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

function ParticleCanvasField() {
  const particlePlacementRef = useRef<HTMLDivElement>(null);
  const imageLimit = IMAGE_FETCH_LIMIT > 0 ? IMAGE_FETCH_LIMIT : undefined;
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
  );
}

function HomeContent() {
  const { filterSearchQuery, setFilterSearchQuery, filtersPanelOpen } =
    useFilterSelection();
  const { aboutView } = useFloatingPanelStack();
  const searching = filterSearchQuery.trim().length > 0;
  /** Mobile landing search sits under `MobileSiteHeader`; hide it while filter sheet or About is open. */
  const hideMobileLandingSearch =
    filtersPanelOpen || aboutView === "full";

  return (
    <div className="flex min-h-screen w-full">
      <FilterSidebar />
      <PixelTessellationBackground />
      <FloatingDockMount />
      <main className="relative z-15 flex min-h-0 min-w-0 flex-1 flex-col p-5 text-ink-body max-lg:p-0 max-lg:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px)+6.3125rem)]">
        <div className="pointer-events-none max-lg:hidden" aria-hidden>
          <MarginGuideFrame />
        </div>

        <MobileSiteHeader />

        <div
          className={[
            "min-w-0 w-full border-b-hairline border-solid border-ink-primary bg-surface-canvas lg:hidden",
            hideMobileLandingSearch ? "hidden" : "",
            searching
              ? "flex shrink-0 flex-col overflow-hidden"
              : "shrink-0",
          ]
            .filter(Boolean)
            .join(" ")}
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

        {HIDE_PARTICLE_CANVAS ? null : <ParticleCanvasField />}
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
