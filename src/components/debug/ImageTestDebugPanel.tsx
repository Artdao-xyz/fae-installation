"use client";

import { useState } from "react";

type Mode = "optimized" | "snappy";

type ImageTestDebugPanelProps = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  loadedCount: number;
  errorCount: number;
  totalImages: number;
  contentRowsCount: number;
  contentTotal: number;
  fetchDurationMs: number | null;
  fetchError: string | null;
  loadDurationMs: number | null;
  fetchedWidth: number;
  fetchedHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  loadDone: boolean;
};

export function ImageTestDebugPanel({
  mode,
  onModeChange,
  loadedCount,
  errorCount,
  totalImages,
  contentRowsCount,
  contentTotal,
  fetchDurationMs,
  fetchError,
  loadDurationMs,
  fetchedWidth,
  fetchedHeight,
  displayedWidth,
  displayedHeight,
  loadDone,
}: ImageTestDebugPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const isOptimizedMode = mode === "optimized";
  const fetchedPixelsPerImage = fetchedWidth * fetchedHeight;
  const displayedPixelsPerImage = displayedWidth * displayedHeight;
  const targetCount = contentTotal || totalImages;

  return (
    <section
      className={`fixed left-5 top-5 z-[5] rounded-sm border border-white/35 bg-[rgba(8,17,39,0.72)] backdrop-blur-md ${
        collapsed ? "w-[220px] px-3 py-2" : "w-[min(420px,calc(100vw-40px))] px-4 py-[14px]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className={`font-semibold ${collapsed ? "text-[0.95rem]" : "text-[1.2rem]"}`}>
          {targetCount} image load test
        </h1>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="cursor-pointer rounded-md border border-white/35 bg-white/10 px-2 py-1 font-mono text-[0.76rem] tracking-[0.02em] text-[#dcecff] transition-all duration-150 hover:border-[#8dd2ff] hover:bg-[#63b8ff33]"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {collapsed ? (
        <p className="mt-1.5 font-mono text-[0.8rem]">
          {loadedCount}/{targetCount} loaded
        </p>
      ) : (
        <>
          <p className="my-1.5 font-mono text-[0.88rem]">
            Mode: {isOptimizedMode ? "Optimized/Scalable" : "Snappy"}
          </p>
          <div className="my-[10px] flex gap-2" role="group" aria-label="Rendering mode">
            <button
              type="button"
              aria-pressed={isOptimizedMode}
              onClick={() => onModeChange("optimized")}
              className={`cursor-pointer rounded-md border px-[10px] py-1.5 font-mono text-[0.82rem] tracking-[0.02em] transition-all duration-150 ${
                isOptimizedMode
                  ? "border-[#84c0ff] bg-gradient-to-br from-[#2a7fe3] to-[#57a4ff] text-[#f4faff] shadow-[0_0_0_1px_rgba(132,192,255,0.25)]"
                  : "border-white/35 bg-white/10 text-[#dcecff] hover:border-[#8dd2ff] hover:bg-[#63b8ff33]"
              }`}
            >
              Optimized
            </button>
            <button
              type="button"
              aria-pressed={!isOptimizedMode}
              onClick={() => onModeChange("snappy")}
              className={`cursor-pointer rounded-md border px-[10px] py-1.5 font-mono text-[0.82rem] tracking-[0.02em] transition-all duration-150 ${
                !isOptimizedMode
                  ? "border-[#84c0ff] bg-gradient-to-br from-[#2a7fe3] to-[#57a4ff] text-[#f4faff] shadow-[0_0_0_1px_rgba(132,192,255,0.25)]"
                  : "border-white/35 bg-white/10 text-[#dcecff] hover:border-[#8dd2ff] hover:bg-[#63b8ff33]"
              }`}
            >
              Snappy
            </button>
          </div>
          <p className="my-1.5 font-mono text-[0.88rem]">
            Loaded: {loadedCount}/{targetCount} | Errors: {errorCount}
          </p>
          <p className="my-1.5 font-mono text-[0.88rem]">
            Data rows: {contentRowsCount}/{targetCount}
            {fetchDurationMs !== null ? ` | Simulated fetch: ${fetchDurationMs} ms` : " | fetching..."}
          </p>
          {fetchError && (
            <p className="my-1.5 font-mono text-[0.88rem] text-[#ff9c9c]">Data error: {fetchError}</p>
          )}
          <p className="my-1.5 font-mono text-[0.88rem]">
            Total load time: {loadDurationMs !== null ? `${loadDurationMs} ms` : "loading..."}
          </p>
          <p className="my-1.5 font-mono text-[0.88rem]">
            Fetched size each: {fetchedWidth}x{fetchedHeight}px ({fetchedPixelsPerImage.toLocaleString()} px)
          </p>
          <p className="my-1.5 font-mono text-[0.88rem]">
            Displayed size each: {displayedWidth}x{displayedHeight}px ({displayedPixelsPerImage.toLocaleString()} px)
          </p>
          {loadDone && (
            <p className="my-1.5 font-mono text-[0.88rem]">All image requests completed.</p>
          )}
        </>
      )}
    </section>
  );
}
