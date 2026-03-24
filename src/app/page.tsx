"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageTestDebugPanel } from "@/components/debug/ImageTestDebugPanel";
import { PlaceholderSidebar } from "@/components/debug/PlaceholderSidebar";
import { PlaceholderBottomBar } from "@/components/debug/PlaceholderBottomBar";
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
    <main className="relative min-h-screen bg-[#161616] p-5 text-white">

      <img src="/title.svg" alt="Image Test" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 objec-fit invert" />

      <ImageTestDebugPanel
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
      />

      <PlaceholderSidebar />
      <PlaceholderBottomBar />

      <ImageParticleSimulation
        mode={mode}
        imageLimit={imageLimit}
        fetchedWidth={FETCHED_WIDTH}
        fetchedHeight={FETCHED_HEIGHT}
        displayedWidth={DISPLAYED_WIDTH}
        displayedHeight={DISPLAYED_HEIGHT}
        speedFactor={SPEED_FACTOR}
        onStatsChange={handleStatsChange}
      />
    </main>
  );
}
