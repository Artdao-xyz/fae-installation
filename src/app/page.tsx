"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listContent } from "@/lib/content-repository";
import type { ContentFixtureRow } from "@/data/content-fixture";
import { ImageTestDebugPanel } from "@/components/debug/ImageTestDebugPanel";

const MIN_Z = -1200;
const MAX_Z = 500;
const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-image-test-mode";
const RES_MULTIPLIER = 1;
const IMAGE_SPACING = 160;
const FETCHED_WIDTH = 440 * RES_MULTIPLIER;
const FETCHED_HEIGHT = 440 * RES_MULTIPLIER;
const DISPLAYED_WIDTH = 110 * RES_MULTIPLIER;
const DISPLAYED_HEIGHT = 110 * RES_MULTIPLIER;

type ImagePoint = {
  id: number;
  x: number;
  y: number;
  z0: number;
  speed: number;
  src: string;
  title: string;
};

type Mode = "optimized" | "snappy";

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 9999.91) * 43758.5453;
  return value - Math.floor(value);
}

function wrapDepth(z: number) {
  const range = MAX_Z - MIN_Z;
  return ((((z - MIN_Z) % range) + range) % range) + MIN_Z;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("optimized");
  const [mounted, setMounted] = useState(false);
  const [timeSec, setTimeSec] = useState(0);
  const [snappyScrollY, setSnappyScrollY] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [contentRows, setContentRows] = useState<ContentFixtureRow[]>([]);
  const [contentTotal, setContentTotal] = useState<number>(0);
  const [fetchDurationMs, setFetchDurationMs] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const preloadStartedRef = useRef(false);
  const snappyStartedAtRef = useRef<number | null>(null);
  const snappyHandledRef = useRef<number[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const scrollYRef = useRef(0);
  const isOptimizedMode = mode === "optimized";

  useEffect(() => {
    if (!mounted) {
      return;
    }

    let cancelled = false;
    setFetchError(null);
    setFetchDurationMs(null);

    const loadContent = async () => {
      try {
        const response = await listContent({
          offset: 0,
          latencyMs: isOptimizedMode ? 180 : 80,
        });

        if (cancelled) {
          return;
        }

        setContentRows(response.rows);
        setContentTotal(response.total);
        setFetchDurationMs(response.durationMs);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFetchError(error instanceof Error ? error.message : "Unknown data error");
        setContentRows([]);
        setContentTotal(0);
      }
    };

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, [isOptimizedMode, mounted]);

  const images = useMemo<ImagePoint[]>(() => {
    const gridColumns = Math.max(1, Math.ceil(Math.sqrt(contentRows.length || 1)));
    const half = (gridColumns - 1) / 2;

    return contentRows.map((contentRow, index) => {
      const row = Math.floor(index / gridColumns);
      const col = index % gridColumns;

      return {
        id: index,
        x: (col - half) * IMAGE_SPACING,
        y: (row - half) * IMAGE_SPACING,
        z0: MIN_Z + pseudoRandom(index + 1) * (MAX_Z - MIN_Z),
        speed: 70 + pseudoRandom(index + 10_001) * 120,
        src: contentRow.imageUrl,
        title: contentRow.title,
      };
    });
  }, [contentRows]);

  useEffect(() => {
    setMounted(true);

    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (savedMode === "optimized" || savedMode === "snappy") {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    console.log("[image-test] mode:", mode);
  }, [mode, mounted]);

  useEffect(() => {
    setLoadedCount(0);
    setErrorCount(0);
    setLoadDurationMs(null);
    setTimeSec(0);
    setSnappyScrollY(0);
    preloadStartedRef.current = false;
    snappyStartedAtRef.current = null;
    snappyHandledRef.current = Array(images.length).fill(0);
  }, [images.length, mode]);

  useEffect(() => {
    if (!mounted || !isOptimizedMode || images.length === 0) {
      return;
    }

    if (preloadStartedRef.current) {
      return;
    }

    preloadStartedRef.current = true;
    const startedAt = performance.now();
    let cancelled = false;
    let handled = 0;
    let loaded = 0;
    let errors = 0;
    let flushAnimationFrameId = 0;
    let flushQueued = false;

    const flushStats = () => {
      flushQueued = false;
      setLoadedCount(loaded);
      setErrorCount(errors);
      if (handled >= images.length) {
        setLoadDurationMs(Math.round(performance.now() - startedAt));
      }
    };

    const queueFlush = () => {
      if (flushQueued || cancelled) {
        return;
      }

      flushQueued = true;
      flushAnimationFrameId = window.requestAnimationFrame(flushStats);
    };

    const markHandled = (hasError: boolean) => {
      if (cancelled) {
        return;
      }

      handled += 1;
      if (hasError) {
        errors += 1;
      } else {
        loaded += 1;
      }

      queueFlush();
    };

    for (const image of images) {
      const preload = new window.Image();
      let settled = false;

      const settleOnce = (hasError: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        preload.onload = null;
        preload.onerror = null;
        markHandled(hasError);
      };

      preload.onload = () => settleOnce(false);
      preload.onerror = () => settleOnce(true);
      preload.src = image.src;

      if (preload.complete) {
        settleOnce(preload.naturalWidth === 0);
      }
    }

    return () => {
      cancelled = true;
      if (flushAnimationFrameId) {
        window.cancelAnimationFrame(flushAnimationFrameId);
      }
    };
  }, [images, isOptimizedMode, mounted]);

  useEffect(() => {
    if (!mounted || isOptimizedMode) {
      return;
    }

    if (snappyStartedAtRef.current === null) {
      snappyStartedAtRef.current = performance.now();
    }

    let loaded = 0;
    let errors = 0;

    for (let index = 0; index < images.length; index += 1) {
      const imageElement = imageRefs.current[index];
      if (!imageElement) {
        continue;
      }

      if (snappyHandledRef.current[index] !== 0) {
        if (snappyHandledRef.current[index] === 1) {
          loaded += 1;
        } else if (snappyHandledRef.current[index] === 2) {
          errors += 1;
        }
        continue;
      }

      if (imageElement.complete) {
        if (imageElement.naturalWidth > 0) {
          snappyHandledRef.current[index] = 1;
          loaded += 1;
        } else {
          snappyHandledRef.current[index] = 2;
          errors += 1;
        }
      }
    }

    setLoadedCount(loaded);
    setErrorCount(errors);

    if (loaded + errors >= images.length && snappyStartedAtRef.current !== null) {
      setLoadDurationMs(Math.round(performance.now() - snappyStartedAtRef.current));
    }
  }, [images.length, isOptimizedMode, mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onScroll = () => {
      const currentScrollY = window.scrollY || 0;
      scrollYRef.current = currentScrollY;
      if (!isOptimizedMode) {
        setSnappyScrollY(currentScrollY);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOptimizedMode, mounted]);

  useEffect(() => {
    if (!mounted || !isOptimizedMode) {
      return;
    }

    let animationFrameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const timeSec = (now - startedAt) / 1000;
      const speedBoost = 1 + Math.min(scrollYRef.current / 900, 2);

      for (const image of images) {
        const imageElement = imageRefs.current[image.id];
        if (!imageElement) {
          continue;
        }

        const z = wrapDepth(image.z0 + image.speed * speedBoost * SPEED_FACTOR * timeSec);
        const normalized = (z - MIN_Z) / (MAX_Z - MIN_Z);
        const opacity = 0.12 + normalized * 0.88;

        imageElement.style.transform = `translate3d(${image.x}px, ${image.y}px, ${z.toFixed(2)}px)`;
        imageElement.style.opacity = opacity.toFixed(3);
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [images, isOptimizedMode, mounted]);

  useEffect(() => {
    if (!mounted || isOptimizedMode) {
      return;
    }

    let animationFrameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      setTimeSec((now - startedAt) / 1000);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isOptimizedMode, mounted]);

  const totalImages = images.length;
  const handledCount = loadedCount + errorCount;
  const loadDone = totalImages > 0 && handledCount >= totalImages;

  const handleSnappyImageResult = (imageId: number, hasError: boolean) => {
    if (isOptimizedMode) {
      return;
    }

    if (snappyHandledRef.current[imageId] !== 0) {
      return;
    }

    if (snappyStartedAtRef.current === null) {
      snappyStartedAtRef.current = performance.now();
    }

    snappyHandledRef.current[imageId] = hasError ? 2 : 1;

    if (hasError) {
      setErrorCount((previous) => previous + 1);
    } else {
      setLoadedCount((previous) => previous + 1);
    }

    const totalHandled = snappyHandledRef.current.reduce(
      (count, status) => count + (status === 0 ? 0 : 1),
      0
    );

    if (totalHandled >= images.length && snappyStartedAtRef.current !== null) {
      setLoadDurationMs(Math.round(performance.now() - snappyStartedAtRef.current));
    }
  };

  const handleImageClick = (
    event: React.MouseEvent<HTMLImageElement>,
    title: string
  ) => {
    event.stopPropagation();
    console.log("[image-test] title:", title);
  };

  return (
    <main className="relative min-h-[180vh] bg-[radial-gradient(circle_at_20%_20%,#0d2141_0%,#050711_45%,#02030a_100%)] p-5 text-[#e9f6ff]">
      <ImageTestDebugPanel
        mode={mode}
        onModeChange={setMode}
        loadedCount={loadedCount}
        errorCount={errorCount}
        totalImages={totalImages}
        contentRowsCount={contentRows.length}
        contentTotal={contentTotal}
        fetchDurationMs={fetchDurationMs}
        fetchError={fetchError}
        loadDurationMs={loadDurationMs}
        fetchedWidth={FETCHED_WIDTH}
        fetchedHeight={FETCHED_HEIGHT}
        displayedWidth={DISPLAYED_WIDTH}
        displayedHeight={DISPLAYED_HEIGHT}
        loadDone={loadDone}
      />

      <section
        className="fixed left-0 top-0 h-full w-full overflow-hidden [perspective:1200px] [perspective-origin:50%_45%] [transform-style:preserve-3d]"
        aria-label="3D animated image wall"
      >
        {(isOptimizedMode ? mounted : true) &&
          images.map((image) => {
          const snappySpeedBoost = 1 + Math.min(snappyScrollY / 900, 2);
          const snappyZ = wrapDepth(image.z0 + image.speed * snappySpeedBoost * SPEED_FACTOR * timeSec);
          const zForRender = isOptimizedMode ? image.z0 : snappyZ;
          const normalized = (zForRender - MIN_Z) / (MAX_Z - MIN_Z);
          const opacity = 0.12 + normalized * 0.88;

          return (
            <img
              key={image.id}
              ref={(element) => {
                imageRefs.current[image.id] = element;
              }}
              src={image.src}
              alt={image.title}
              title={image.title}
              width={FETCHED_WIDTH}
              height={FETCHED_HEIGHT}
              className="absolute left-1/2 top-1/2 border border-white/30 object-cover shadow-[0_18px_32px_rgba(0,0,0,0.36)] [border-radius:2px] [transform-style:preserve-3d] [will-change:transform,opacity]"
              style={{
                width: `${DISPLAYED_WIDTH}px`,
                height: `${DISPLAYED_HEIGHT}px`,
                transform: `translate3d(${image.x}px, ${image.y}px, ${zForRender.toFixed(2)}px)`,
                opacity,
              }}
              onClick={(event) => handleImageClick(event, image.title)}
              onLoad={() => handleSnappyImageResult(image.id, false)}
              onError={() => handleSnappyImageResult(image.id, true)}
            />
          );
        })}
      </section>
    </main>
  );
}
