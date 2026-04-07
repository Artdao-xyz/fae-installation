"use client";

import { useEffect, useRef, useState } from "react";
import { valueNoise2D } from "./value-noise-2d";

/**
 * Tiled SVG + spatial opacity from smooth 2D noise: one pattern fill per frame, then a
 * low-res mask scaled up (soft “zones”). See {@link NOISE_SCALE}, {@link OPACITY_MIN}, {@link OPACITY_MAX}.
 */

const TILE_W = 65;
const TILE_H = 67;
const TILE_SCALE = 0.15;
const SVG_SRC = "/svg/pixel.svg";

/** Supersample small tiles before pattern creation (device px). */
const MIN_RASTER_DEVICE_PX = 36;

/** Smaller → broader light/dark zones across the grid. */
const NOISE_SCALE = 0.035;
/** How fast noise drifts (noise-space units per second). */
const NOISE_DRIFT_X = 1.5;
const NOISE_DRIFT_Y = 1.5;

/** Zone opacity range: noise 0→1 maps to this alpha range on the pattern. */
const OPACITY_MIN = .350;
const OPACITY_MAX = 0.01;

const GRID_ROTATION_DEG = 0.01;
const OVERSCAN = 1.18;

type Props = {
  className?: string;
};

function mapNoiseToAlpha(n: number): number {
  return OPACITY_MIN + n * (OPACITY_MAX - OPACITY_MIN);
}

export function PixelTessellationBackground({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const patternRef = useRef<CanvasPattern | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const timeRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const dprRef = useRef(1);
  const stepXRef = useRef(TILE_W * TILE_SCALE);
  const stepYRef = useRef(TILE_H * TILE_SCALE);
  const rafRef = useRef(0);

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const v = mq.matches;
      reduceMotionRef.current = v;
      setReduceMotion(v);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    let widthCss = 0;
    let heightCss = 0;
    let maskImageData: ImageData | null = null;
    let maskCols = 0;
    let maskRows = 0;

    function rebuildPatternFromImage() {
      const img = imgRef.current;
      const c = canvasRef.current;
      if (!img?.complete || !c) return;
      const cctx = c.getContext("2d");
      if (!cctx) return;

      const dpr = dprRef.current;
      const stepCssX = TILE_W * TILE_SCALE;
      const stepCssY = TILE_H * TILE_SCALE;
      const pxW = Math.max(1, Math.round(stepCssX * dpr));
      const pxH = Math.max(1, Math.round(stepCssY * dpr));
      const snappedX = pxW / dpr;
      const snappedY = pxH / dpr;
      stepXRef.current = snappedX;
      stepYRef.current = snappedY;

      const scaleUp = Math.max(
        1,
        MIN_RASTER_DEVICE_PX / Math.min(pxW, pxH),
      );
      const texW = Math.max(1, Math.round(pxW * scaleUp));
      const texH = Math.max(1, Math.round(pxH * scaleUp));

      const tile = document.createElement("canvas");
      tile.width = texW;
      tile.height = texH;
      const tctx = tile.getContext("2d");
      if (!tctx) return;

      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = "high";
      tctx.drawImage(img, 0, 0, TILE_W, TILE_H, 0, 0, texW, texH);

      const pattern = cctx.createPattern(tile, "repeat");
      if (pattern && typeof pattern.setTransform === "function") {
        pattern.setTransform(
          new DOMMatrix([
            snappedX / texW,
            0,
            0,
            snappedY / texH,
            0,
            0,
          ]),
        );
      }
      patternRef.current = pattern;
    }

    function syncCanvasSize() {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      dprRef.current = dpr;
      const rect = c.getBoundingClientRect();
      widthCss = rect.width;
      heightCss = rect.height;
      c.width = Math.max(1, Math.floor(widthCss * dpr));
      c.height = Math.max(1, Math.floor(heightCss * dpr));
      const g = c.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildPatternFromImage();
    }

    const img = new Image();
    img.decoding = "async";
    img.src = SVG_SRC;
    imgRef.current = img;
    img.addEventListener("load", rebuildPatternFromImage);
    if (img.complete) {
      rebuildPatternFromImage();
    }

    const ro = new ResizeObserver(() => {
      syncCanvasSize();
    });
    ro.observe(canvas);
    syncCanvasSize();

    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!reduceMotionRef.current) {
        timeRef.current += dt;
      }

      const pattern = patternRef.current;
      if (!pattern || !imgRef.current?.complete || widthCss < 1 || heightCss < 1) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const dpr = dprRef.current;
      const stepX = stepXRef.current;
      const stepY = stepYRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, widthCss, heightCss);

      const t = timeRef.current;
      const cols = Math.ceil(widthCss / stepX) + 1;
      const rows = Math.ceil(heightCss / stepY) + 1;

      if (maskCols !== cols || maskRows !== rows) {
        maskCols = cols;
        maskRows = rows;
        maskImageData = null;
      }
      if (!maskImageData) {
        maskImageData = ctx.createImageData(cols, rows);
      }

      const data = maskImageData.data;
      for (let iy = 0; iy < rows; iy++) {
        for (let ix = 0; ix < cols; ix++) {
          const nx = ix * NOISE_SCALE + t * NOISE_DRIFT_X;
          const ny = iy * NOISE_SCALE + t * NOISE_DRIFT_Y;
          const n = valueNoise2D(nx, ny);
          const a = Math.round(mapNoiseToAlpha(n) * 255);
          const i = (iy * cols + ix) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = a;
        }
      }

      if (maskCanvas.width !== cols || maskCanvas.height !== rows) {
        maskCanvas.width = cols;
        maskCanvas.height = rows;
      }
      maskCtx.putImageData(maskImageData, 0, 0);

      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, widthCss, heightCss);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(maskCanvas, 0, 0, cols, rows, 0, 0, widthCss, heightCss);
      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      img.removeEventListener("load", rebuildPatternFromImage);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: `${OVERSCAN * 100}%`,
          height: `${OVERSCAN * 100}%`,
          transform: `translate(-50%, -50%) rotate(${reduceMotion ? 0 : GRID_ROTATION_DEG}deg)`,
        }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </div>
  );
}
