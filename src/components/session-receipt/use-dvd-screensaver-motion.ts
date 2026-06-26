"use client";

import { useEffect, useRef } from "react";

const SPEED_PX_PER_SEC = 80;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useDvdScreensaverMotion(active: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) return;

    const el = contentRef.current;
    if (!el) return;

    let rafId = 0;
    let cancelled = false;

    const angle = Math.PI / 4;
    const state = {
      x: 0,
      y: 0,
      vx:
        (Math.random() > 0.5 ? 1 : -1) *
        SPEED_PX_PER_SEC *
        Math.cos(angle),
      vy:
        (Math.random() > 0.5 ? 1 : -1) *
        SPEED_PX_PER_SEC *
        Math.sin(angle),
      lastTime: 0,
    };

    const applyTransform = () => {
      el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    };

    const bounds = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      return {
        width,
        height,
        maxX: Math.max(0, window.innerWidth - width),
        maxY: Math.max(0, window.innerHeight - height),
      };
    };

    const clampPosition = () => {
      const { maxX, maxY } = bounds();
      state.x = Math.min(Math.max(state.x, 0), maxX);
      state.y = Math.min(Math.max(state.y, 0), maxY);
    };

    const init = () => {
      const { maxX, maxY } = bounds();
      state.x = maxX / 2;
      state.y = maxY / 2;
      applyTransform();
    };

    const tick = (time: number) => {
      if (cancelled) return;

      if (state.lastTime === 0) {
        state.lastTime = time;
        rafId = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((time - state.lastTime) / 1000, 0.05);
      state.lastTime = time;

      const { maxX, maxY } = bounds();

      state.x += state.vx * dt;
      state.y += state.vy * dt;

      if (state.x <= 0) {
        state.x = 0;
        state.vx = Math.abs(state.vx);
      } else if (state.x >= maxX) {
        state.x = maxX;
        state.vx = -Math.abs(state.vx);
      }

      if (state.y <= 0) {
        state.y = 0;
        state.vy = Math.abs(state.vy);
      } else if (state.y >= maxY) {
        state.y = maxY;
        state.vy = -Math.abs(state.vy);
      }

      applyTransform();
      rafId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      clampPosition();
      applyTransform();
    };

    init();
    state.lastTime = 0;
    rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      el.style.transform = "";
    };
  }, [active, reducedMotion]);

  return { contentRef, reducedMotion };
}
