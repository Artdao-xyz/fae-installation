"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useSyncExternalStore } from "react";
import {
  FilterSelectionProvider,
  FilterSidebar,
  Search,
  useFilterSelection,
} from "@/components/ui/filter-sidebar";
import { MobileFilteredThumbnailGrid } from "@/components/ui/filter-sidebar/shell/MobileFilteredThumbnailGrid";
import { MobileSiteHeader } from "@/components/ui/filter-sidebar/shell/MobileSiteHeader";
import {
  mobileMainScrollInsetClassName,
} from "@/components/ui/filter-sidebar/shell/layout-classes";
import { useIsMaxLg } from "@/components/ui/filter-sidebar/shell/useIsMaxLg";
import { selectLatestUpdatesRows } from "@/components/ui/latest-updates-panel/latestUpdatesRows";
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

/** Set to `true` to remove the particle layer (mobile still uses a hidden sim + filter grid when needed). */
const HIDE_PARTICLE_CANVAS = false;

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
  const { hasActiveTaxonomyFilters } = useFilterSelection();
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
      className={`relative flex min-h-0 w-full flex-col lg:flex-1 ${
        hasActiveTaxonomyFilters ? "max-lg:w-full" : "max-lg:flex-none"
      }`}
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
        rootClassName="max-lg:pointer-events-none max-lg:opacity-0 max-lg:z-[5]"
      />
      <MobileFilteredThumbnailGrid />
    </div>
  );
}

function HomeContent() {
  const {
    filterSearchQuery,
    setFilterSearchQuery,
    filtersPanelOpen,
    hasActiveTaxonomyFilters,
    contentCatalog,
    contentCatalogStatus,
  } = useFilterSelection();
  const { aboutView } = useFloatingPanelStack();
  const isMaxLg = useIsMaxLg();
  const searching = filterSearchQuery.trim().length > 0;
  /** Mobile landing search sits under `MobileSiteHeader`; hide it while filter sheet or About is open. */
  const hideMobileLandingSearch =
    filtersPanelOpen || aboutView === "full";

  const latestUpdatesStripRows = useMemo(
    () => selectLatestUpdatesRows(contentCatalog, contentCatalogStatus),
    [contentCatalog, contentCatalogStatus],
  );
  const showMobileLatestUpdatesStrip =
    isMaxLg && !filtersPanelOpen && latestUpdatesStripRows.length > 0;

  const mobileScrollInsetClass = mobileMainScrollInsetClassName({
    filtersPanelOpen,
    hasActiveTaxonomyFilters,
    showMobileLatestUpdatesStrip,
  });

  return (
    <div className="flex min-h-screen w-full max-lg:h-dvh max-lg:min-h-0 max-lg:max-h-dvh max-lg:overflow-hidden">
      <FilterSidebar />
      <PixelTessellationBackground />
      <FloatingDockMount />
      <main className="relative z-15 flex min-h-0 min-w-0 flex-1 flex-col p-5 text-ink-body max-lg:min-h-0 max-lg:overflow-hidden max-lg:p-0 lg:overflow-visible">
        <div className="pointer-events-none max-lg:hidden" aria-hidden>
          <MarginGuideFrame />
        </div>

        <MobileSiteHeader />

        <div
          className={[
            "min-w-0 w-full shrink-0 bg-surface-canvas lg:hidden",
            "max-lg:sticky max-lg:top-[calc(env(safe-area-inset-top,0px)+2.75rem)] max-lg:z-20 max-lg:border-b-hairline max-lg:border-solid max-lg:border-ink-primary",
            hideMobileLandingSearch ? "hidden" : "",
            searching ? "flex flex-col" : "",
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

        <div
          className={`relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain max-lg:min-h-0 lg:flex-none lg:overflow-visible ${mobileScrollInsetClass}`}
        >
          <div className="flex w-full min-h-min flex-col">
            <HeroTitleBlock
              title="Future Art Ecosystems"
              subtitle="Cultural Infrastructure Research"
            />

            {HIDE_PARTICLE_CANVAS ? null : <ParticleCanvasField />}
          </div>
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
