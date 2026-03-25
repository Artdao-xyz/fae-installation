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
      className={`fixed top-5 right-5 z-5 rounded-sm border-[0.5px] border-solid border-[#414141] bg-[#E8E8E8] ${
        collapsed ? "w-[220px] px-3 py-2" : "w-[min(420px,calc(100vw-40px))] px-4 py-[14px]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className={`font-semibold text-[#303030] ${collapsed ? "text-[0.95rem]" : "text-[1.2rem]"}`}>
          {targetCount} image load test
        </h1>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="cursor-pointer rounded-md border-[0.5px] border-solid border-[#414141] bg-white/60 px-2 py-1 font-mono text-[0.76rem] tracking-[0.02em] text-[#303030] transition-all duration-150 hover:bg-white"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {collapsed ? (
        <p className="mt-1.5 font-mono text-[0.8rem] text-[#303030]">
          {loadedCount}/{targetCount} loaded
        </p>
      ) : (
        <>
          <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">
            Mode: {isOptimizedMode ? "Optimized/Scalable" : "Snappy"}
          </p>
          <div className="my-[10px] flex gap-2" role="group" aria-label="Rendering mode">
            <button
              type="button"
              aria-pressed={isOptimizedMode}
              onClick={() => onModeChange("optimized")}
              className={`cursor-pointer rounded-md border-[0.5px] border-solid px-[10px] py-1.5 font-mono text-[0.82rem] tracking-[0.02em] transition-all duration-150 ${
                isOptimizedMode
                  ? "border-[#414141] bg-[#414141] text-[#E8E8E8]"
                  : "border-[#414141] bg-transparent text-[#303030] hover:bg-white/50"
              }`}
            >
              Optimized
            </button>
            <button
              type="button"
              aria-pressed={!isOptimizedMode}
              onClick={() => onModeChange("snappy")}
              className={`cursor-pointer rounded-md border-[0.5px] border-solid px-[10px] py-1.5 font-mono text-[0.82rem] tracking-[0.02em] transition-all duration-150 ${
                !isOptimizedMode
                  ? "border-[#414141] bg-[#414141] text-[#E8E8E8]"
                  : "border-[#414141] bg-transparent text-[#303030] hover:bg-white/50"
              }`}
            >
              Snappy
            </button>
          </div>
          <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">
            Loaded: {loadedCount}/{targetCount} | Errors: {errorCount}
          </p>
          <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">
            Data rows: {contentRowsCount}/{targetCount}
            {fetchDurationMs !== null ? ` | Simulated fetch: ${fetchDurationMs} ms` : " | fetching..."}
          </p>
          {fetchError && (
            <p className="my-1.5 font-mono text-[0.88rem] text-[#b42318]">Data error: {fetchError}</p>
          )}
          <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">
            Total load time: {loadDurationMs !== null ? `${loadDurationMs} ms` : "loading..."}
          </p>
          <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">
            Fetched size each: {fetchedWidth}x{fetchedHeight}px ({fetchedPixelsPerImage.toLocaleString()} px)
          </p>
          <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">
            Displayed size each: {displayedWidth}x{displayedHeight}px ({displayedPixelsPerImage.toLocaleString()} px)
          </p>
          {loadDone && (
            <p className="my-1.5 font-mono text-[0.88rem] text-[#303030]">All image requests completed.</p>
          )}
        </>
      )}
    </section>
  );
}
