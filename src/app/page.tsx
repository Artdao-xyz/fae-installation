"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const GRID_SIZE = 13;
const TOTAL_IMAGES = GRID_SIZE * GRID_SIZE;
const MIN_Z = -1200;
const MAX_Z = 500;
const SPEED_FACTOR = 0.5;
const MODE_STORAGE_KEY = "fae-image-test-mode";
const RES_MULTIPLIER = 1;
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
  const preloadStartedRef = useRef(false);
  const snappyStartedAtRef = useRef<number | null>(null);
  const snappyHandledRef = useRef<number[]>(Array(TOTAL_IMAGES).fill(0));
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const scrollYRef = useRef(0);
  const isOptimizedMode = mode === "optimized";

  const images = useMemo<ImagePoint[]>(() => {
    const spacing = 160;
    const half = (GRID_SIZE - 1) / 2;

    return Array.from({ length: TOTAL_IMAGES }, (_, index) => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;

      return {
        id: index,
        x: (col - half) * spacing,
        y: (row - half) * spacing,
        z0: MIN_Z + pseudoRandom(index + 1) * (MAX_Z - MIN_Z),
        speed: 70 + pseudoRandom(index + 10_001) * 120,
        src: `https://picsum.photos/seed/fae-${index}/${FETCHED_WIDTH}/${FETCHED_HEIGHT}.webp`,
      };
    });
  }, []);

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
    snappyHandledRef.current = Array(TOTAL_IMAGES).fill(0);
  }, [mode]);

  useEffect(() => {
    if (!mounted || !isOptimizedMode) {
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
      if (handled >= TOTAL_IMAGES) {
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

    for (let index = 0; index < TOTAL_IMAGES; index += 1) {
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

    if (loaded + errors >= TOTAL_IMAGES && snappyStartedAtRef.current !== null) {
      setLoadDurationMs(Math.round(performance.now() - snappyStartedAtRef.current));
    }
  }, [isOptimizedMode, mounted]);

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

  const handledCount = loadedCount + errorCount;
  const loadDone = handledCount >= TOTAL_IMAGES;
  const fetchedPixelsPerImage = FETCHED_WIDTH * FETCHED_HEIGHT;
  const displayedPixelsPerImage = DISPLAYED_WIDTH * DISPLAYED_HEIGHT;

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

    if (totalHandled >= TOTAL_IMAGES && snappyStartedAtRef.current !== null) {
      setLoadDurationMs(Math.round(performance.now() - snappyStartedAtRef.current));
    }
  };

  return (
    <main className="relative min-h-[180vh] bg-[radial-gradient(circle_at_20%_20%,#0d2141_0%,#050711_45%,#02030a_100%)] p-5 text-[#e9f6ff]">
      <section className="fixed left-5 top-5 z-[5] w-[min(420px,calc(100vw-40px))] rounded-sm border border-white/35 bg-[rgba(8,17,39,0.72)] px-4 py-[14px] backdrop-blur-md">
        <h1 className="mb-2 text-[1.2rem]">169 image load test</h1>
        <p className="my-1.5 font-mono text-[0.88rem]">
          Mode: {isOptimizedMode ? "Optimized/Scalable" : "Snappy"}
        </p>
        <div className="my-[10px] flex gap-2" role="group" aria-label="Rendering mode">
          <button
            type="button"
            aria-pressed={isOptimizedMode}
            onClick={() => setMode("optimized")}
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
            onClick={() => setMode("snappy")}
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
          Loaded: {loadedCount}/{TOTAL_IMAGES} | Errors: {errorCount}
        </p>
        <p className="my-1.5 font-mono text-[0.88rem]">
          Total load time: {loadDurationMs !== null ? `${loadDurationMs} ms` : "loading..."}
        </p>
        <p className="my-1.5 font-mono text-[0.88rem]">
          Fetched size each: {FETCHED_WIDTH}x{FETCHED_HEIGHT}px ({fetchedPixelsPerImage.toLocaleString()} px)
        </p>
        <p className="my-1.5 font-mono text-[0.88rem]">
          Displayed size each: {DISPLAYED_WIDTH}x{DISPLAYED_HEIGHT}px ({displayedPixelsPerImage.toLocaleString()} px)
        </p>
        {loadDone && <p className="my-1.5 font-mono text-[0.88rem]">All image requests completed.</p>}
      </section>

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
              alt={`Random image ${image.id + 1}`}
              width={FETCHED_WIDTH}
              height={FETCHED_HEIGHT}
              className="absolute left-1/2 top-1/2 border border-white/30 object-cover shadow-[0_18px_32px_rgba(0,0,0,0.36)] [border-radius:2px] [transform-style:preserve-3d] [will-change:transform,opacity]"
              style={{
                width: `${DISPLAYED_WIDTH}px`,
                height: `${DISPLAYED_HEIGHT}px`,
                transform: `translate3d(${image.x}px, ${image.y}px, ${zForRender.toFixed(2)}px)`,
                opacity,
              }}
              onLoad={() => handleSnappyImageResult(image.id, false)}
              onError={() => handleSnappyImageResult(image.id, true)}
            />
          );
        })}
      </section>
    </main>
  );
}
