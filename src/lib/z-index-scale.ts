/**
 * Global stacking order (low → high) for JS (`FloatingPanelStackContext`).
 * Layout uses Tailwind `z-*` classes with these same integers (`z-40` sidebar, `z-[15]` main, …).
 *
 * 1. Body / page flow
 * 2. Background decoration (dotted tessellation)
 * 3. Margin guide (inset frame hairlines) — just above `bgDecoration`, below main/particles/GUI
 * 4. Hero title
 * 5. Particle canvas (thumbnail field)
 * 6. GUI (sidebar, floating docks, docked preview)
 * 7. Full-screen surfaces (About full, preview fullscreen)
 */
export const Z_INDEX = {
  bgDecoration: 10,
  /**
   * Inset viewport dashed frame — kept low so hero, main column, and particles paint above.
   * Must stay above `bgDecoration` or lines sit behind the tessellation.
   */
  marginGuide: 11,
  /** Main column stacking context (above background, below global GUI). */
  page: 15,
  hero: 20,
  particles: 30,
  gui: 40,
  guiFloatingDock: 42,
  /** First peek card in the right-rail stack; +0/+1/+2 for up to three peeks. */
  guiPeekBase: 44,
  previewDocked: 47,
  fullscreen: 50,
  /**
   * `MobileAboutSheet` — above mobile filter overlay (`z-50`), below site menu.
   */
  mobileAboutSheet: 199,
  /**
   * Mobile site menu (`MobileSiteHeader`). Above filter sheet and docks.
   */
  mobileSiteMenu: 200,
  /** `MobileGlossarySheet` when opened from the site menu (above the menu layer). */
  mobileGlossarySheet: 201,
} as const;
