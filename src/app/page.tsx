"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageTestDebugPanel } from "@/components/debug/ImageTestDebugPanel";
import {
  FilterMenu,
  FilterSelectionProvider,
} from "@/components/ui/filter-menu";
import { HeroTitleBlock } from "@/components/ui/hero-title-block";
import { PixelTessellationBackground } from "@/components/ui/pixel-tessellation-background";
import {
  ImageParticleSimulation,
  type ImageParticleSimulationStats,
} from "../components/image-test/ImageParticleSimulation";
import { IMAGE_FETCH_LIMIT } from "../components/image-test/config";

type Mode = "optimized" | "snappy";

const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-image-test-mode";
const RES_MULTIPLIER = 1;
const FETCHED_WIDTH = 440 * RES_MULTIPLIER;
const FETCHED_HEIGHT = 440 * RES_MULTIPLIER;
const DISPLAYED_WIDTH = 75 * RES_MULTIPLIER;
const DISPLAYED_HEIGHT = 75 * RES_MULTIPLIER;

const EMPTY_STATS: ImageParticleSimulationStats = {
  loadedCount: 0,
  errorCount: 0,
  loadDurationMs: null,
  contentRowsCount: 0,
  contentTotal: 0,
  fetchDurationMs: null,
  fetchError: null,
  totalImages: 0,
  loadDone: false,
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("optimized");
  const [stats, setStats] = useState<ImageParticleSimulationStats>(EMPTY_STATS);
  const imageLimit = IMAGE_FETCH_LIMIT > 0 ? IMAGE_FETCH_LIMIT : undefined;
  /** Region between the filter column and the viewport; height is main below the hero. */
  const particlePlacementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (savedMode === "optimized" || savedMode === "snappy") {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    console.log("[image-test] mode:", mode);
  }, [mode]);

  const handleStatsChange = useCallback((nextStats: ImageParticleSimulationStats) => {
    setStats(nextStats);
  }, []);

  return (
    <FilterSelectionProvider>
    <div className="flex min-h-screen w-full">
      <FilterMenu />
      <PixelTessellationBackground />
      <main className="relative z-1 flex min-h-screen min-w-0 flex-1 flex-col p-5 text-[#303030]">

        <HeroTitleBlock
          title="Future Art Ecosystems"
          subtitle="Cultural Infraestructure Research"
        />

        <div
          ref={particlePlacementRef}
          className="relative min-h-0 w-full flex-1"
        >
        {/* <ImageTestDebugPanel
          mode={mode}
          onModeChange={setMode}
          loadedCount={stats.loadedCount}
          errorCount={stats.errorCount}
          totalImages={stats.totalImages}
          contentRowsCount={stats.contentRowsCount}
          contentTotal={stats.contentTotal}
          fetchDurationMs={stats.fetchDurationMs}
          fetchError={stats.fetchError}
          loadDurationMs={stats.loadDurationMs}
          fetchedWidth={FETCHED_WIDTH}
          fetchedHeight={FETCHED_HEIGHT}
          displayedWidth={DISPLAYED_WIDTH}
          displayedHeight={DISPLAYED_HEIGHT}
          loadDone={stats.loadDone}
        /> */}

        <ImageParticleSimulation
          mode={mode}
          imageLimit={imageLimit}
          fetchedWidth={FETCHED_WIDTH}
          fetchedHeight={FETCHED_HEIGHT}
          displayedWidth={DISPLAYED_WIDTH}
          displayedHeight={DISPLAYED_HEIGHT}
          speedFactor={SPEED_FACTOR}
          onStatsChange={handleStatsChange}
          placementContainerRef={particlePlacementRef}
        />
        </div>
      </main>
    </div>
    </FilterSelectionProvider>
  );
}
