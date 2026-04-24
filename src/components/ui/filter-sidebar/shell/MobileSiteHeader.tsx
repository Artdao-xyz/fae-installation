"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { GlossarySvgIcon } from "@/components/ui/icons/GlossarySvgIcon";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { MobileGlossarySheet } from "@/components/ui/glossary-panel/MobileGlossarySheet";
import { Z_INDEX } from "@/lib/z-index-scale";

const MOBILE_HEADER_LABEL_CLASS =
  "font-suisseintl text-sm font-normal leading-5 transition-[color,filter] duration-150 motion-reduce:transition-none";

const MENU_NAV_ITEM_CLASS =
  "flex w-full max-w-sm items-center justify-center gap-4 py-4 font-suisseintl text-base font-normal leading-6 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";

const MENU_NAV_ICON_CLASS = "!size-8 shrink-0";

function subscribeToDocumentBody() {
  return () => {};
}

function getDocumentBodySnapshot(): HTMLElement | null {
  return typeof document !== "undefined" ? document.body : null;
}

type MobileSiteHeaderProps = {
  /** True while the full-screen menu or mobile glossary sheet from the menu is open (landing search, etc.). */
  onMobileOverlayOpenChange?: (open: boolean) => void;
};

/**
 * `max-lg` only: fixed strip under the safe area. Menu opens a full-screen sheet; Home / About / Glossary
 * live there (About still uses `MobileAboutSheet`; Glossary uses `MobileGlossarySheet`).
 */
export function MobileSiteHeader({
  onMobileOverlayOpenChange,
}: MobileSiteHeaderProps) {
  const { contentPreviewRow, resetToIdle, closeContentPreview } =
    useFilterSelection();
  const { aboutView, setAboutView } = useFloatingPanelStack();
  const [menuOpen, setMenuOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const portalEl = useSyncExternalStore(
    subscribeToDocumentBody,
    getDocumentBodySnapshot,
    () => null,
  );

  const overlayOpen = menuOpen || glossaryOpen;

  useEffect(() => {
    onMobileOverlayOpenChange?.(overlayOpen);
  }, [overlayOpen, onMobileOverlayOpenChange]);

  useEffect(() => {
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayOpen]);

  const goHome = useCallback(() => {
    setMenuOpen(false);
    const closingAbout = aboutView === "full";
    if (closingAbout) setAboutView("minimized");
    if (contentPreviewRow) {
      closeContentPreview();
    } else if (!closingAbout) {
      resetToIdle();
    }
  }, [
    aboutView,
    closeContentPreview,
    contentPreviewRow,
    resetToIdle,
    setAboutView,
  ]);

  const openAbout = useCallback(() => {
    setMenuOpen(false);
    setAboutView("full");
  }, [setAboutView]);

  const openGlossary = useCallback(() => {
    setMenuOpen(false);
    setGlossaryOpen(true);
  }, []);

  const closeGlossary = useCallback(() => setGlossaryOpen(false), []);

  return (
    <>
      <header
        className="sticky top-0 z-40 flex w-full shrink-0 flex-col border-b-hairline border-solid border-ink-primary bg-surface-canvas pt-[env(safe-area-inset-top,0px)] lg:hidden"
        role="banner"
      >
        <div className="flex h-11 w-full flex-row items-stretch justify-center px-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex min-h-0 min-w-0 items-center justify-center gap-2 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          >
            <Image
              src="/svg/menu.svg"
              alt=""
              width={32}
              height={34}
              unoptimized
              className="size-8 shrink-0 object-contain"
              aria-hidden
            />
            <span className={MOBILE_HEADER_LABEL_CLASS}>Menu</span>
          </button>
        </div>
      </header>

      {portalEl && menuOpen
        ? createPortal(
            <div
              className="fixed inset-0 flex min-h-0 flex-col bg-surface-canvas lg:hidden"
              style={{ zIndex: Z_INDEX.mobileSiteMenu }}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top,0px)]">
                <nav
                  className="flex min-h-full flex-col items-center justify-center gap-0 px-4 py-8"
                  aria-label="Site"
                >
                  <button
                    type="button"
                    className={MENU_NAV_ITEM_CLASS}
                    onClick={goHome}
                  >
                    <HomeSvgIcon className={MENU_NAV_ICON_CLASS} />
                    <span>Home</span>
                  </button>
                  <button
                    type="button"
                    className={MENU_NAV_ITEM_CLASS}
                    onClick={openAbout}
                  >
                    <AboutSvgIcon className={MENU_NAV_ICON_CLASS} />
                    <span>About</span>
                  </button>
                  <button
                    type="button"
                    className={MENU_NAV_ITEM_CLASS}
                    onClick={openGlossary}
                  >
                    <GlossarySvgIcon className={MENU_NAV_ICON_CLASS} />
                    <span>Glossary</span>
                  </button>
                </nav>
              </div>
              <div className="shrink-0 border-t-hairline border-solid border-ink-primary bg-surface-canvas pb-[env(safe-area-inset-bottom,0px)]">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-14 w-full items-center justify-center gap-2 px-3 font-fira-mono text-xs font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
                  aria-label="Close menu"
                >
                  <OpenSvgIcon className="shrink-0 -rotate-90" />
                  <span>Close</span>
                </button>
              </div>
            </div>,
            portalEl,
          )
        : null}

      {portalEl && glossaryOpen
        ? createPortal(
            <MobileGlossarySheet
              zIndex={Z_INDEX.mobileGlossarySheet}
              onClose={closeGlossary}
            />,
            portalEl,
          )
        : null}
    </>
  );
}
