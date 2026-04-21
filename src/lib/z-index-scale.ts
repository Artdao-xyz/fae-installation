/**
 * Global stacking order (low → high) for JS (`FloatingPanelStackContext`).
 * Layout uses Tailwind `z-*` classes with these same integers (`z-40` sidebar, `z-[15]` main, …).
 *
 * 1. Body / page flow
 * 2. Background decoration (dotted tessellation)
 * 3. Hero title
 * 4. Particle canvas (thumbnail field)
 * 5. GUI (sidebar, floating docks, docked preview)
 * 6. Full-screen surfaces (About full, preview fullscreen)
 */
export const Z_INDEX = {
  bgDecoration: 10,
  /** Main column stacking context (above background, below global GUI). */
  page: 15,
  hero: 20,
  particles: 30,
  marginGuide: 34,
  gui: 40,
  guiFloatingDock: 42,
  /** First peek card in the right-rail stack; +0/+1/+2 for up to three peeks. */
  guiPeekBase: 44,
  previewDocked: 47,
  fullscreen: 50,
} as const;
