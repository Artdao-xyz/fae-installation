"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageTestDebugPanel } from "@/components/debug/ImageTestDebugPanel";
import {
  ImageWall,
  type ImageWallStats,
} from "../components/image-test/ImageWall";
import { IMAGE_FETCH_LIMIT } from "../components/image-test/config";

type Mode = "optimized" | "snappy";

const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-image-test-mode";
const RES_MULTIPLIER = 1;
const FETCHED_WIDTH = 440 * RES_MULTIPLIER;
const FETCHED_HEIGHT = 440 * RES_MULTIPLIER;
const DISPLAYED_WIDTH = 110 * RES_MULTIPLIER;
const DISPLAYED_HEIGHT = 110 * RES_MULTIPLIER;

const EMPTY_STATS: ImageWallStats = {
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
  const [stats, setStats] = useState<ImageWallStats>(EMPTY_STATS);
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

  const handleStatsChange = useCallback((nextStats: ImageWallStats) => {
    setStats(nextStats);
  }, []);

  return (
    <main className="relative min-h-[180vh] bg-[radial-gradient(circle_at_20%_20%,#0d2141_0%,#050711_45%,#02030a_100%)] p-5 text-[#e9f6ff]">
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

      <ImageWall
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
