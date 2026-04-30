"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { GlossarySvgIcon } from "@/components/ui/icons/GlossarySvgIcon";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { SubscribePanelContent } from "@/components/ui/filter-sidebar/domains/subscribe/SubscribeSubpanelColumn";
import { MobileGlossarySheet } from "@/components/ui/glossary-panel/MobileGlossarySheet";
import { Z_INDEX } from "@/lib/z-index-scale";

const MOBILE_HEADER_LABEL_CLASS =
  "font-suisseintl text-sm font-normal leading-5 transition-[color,filter] duration-150 motion-reduce:transition-none";

const MENU_NAV_ITEM_CLASS =
  "flex w-full items-center justify-center gap-4 border-x-hairline border-t-hairline last:border-b-hairline border-solid border-border py-4 font-suisseintl text-sm font-normal leading-6 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";

const MENU_NAV_ICON_CLASS = "size-6! shrink-0";

function subscribeToDocumentBody() {
  return () => {};
}

function getDocumentBodySnapshot(): HTMLElement | null {
  return typeof document !== "undefined" ? document.body : null;
}

type MobileSiteHeaderProps = {
  /** True while the full-screen menu or mobile glossary sheet from the menu is open (landing search, etc.). */
  onMobileOverlayOpenChange?: (open: boolean) => void;
  onHomeClick?: () => void;
};

/**
 * `max-lg` only: fixed strip under the safe area. Menu opens a full-screen sheet; Home / About / Glossary
 * live there (About still uses `MobileAboutSheet`; Glossary uses `MobileGlossarySheet`).
 */
export function MobileSiteHeader({
  onMobileOverlayOpenChange,
  onHomeClick,
}: MobileSiteHeaderProps) {
  const { contentPreviewRow, resetToIdle, closeContentPreview } =
    useFilterSelection();
  const { aboutView, setAboutView } = useFloatingPanelStack();
  const [menuOpen, setMenuOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
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
    setSubscribeOpen(false);
    const closingAbout = aboutView === "full";
    if (closingAbout) setAboutView("minimized");
    if (contentPreviewRow) {
      closeContentPreview();
    } else if (!closingAbout) {
      resetToIdle();
    }
    onHomeClick?.();
  }, [
    aboutView,
    closeContentPreview,
    contentPreviewRow,
    onHomeClick,
    resetToIdle,
    setAboutView,
  ]);

  const openAbout = useCallback(() => {
    setMenuOpen(false);
    setSubscribeOpen(false);
    setAboutView("full");
  }, [setAboutView]);

  const openGlossary = useCallback(() => {
    setMenuOpen(false);
    setSubscribeOpen(false);
    setGlossaryOpen(true);
  }, []);

  const closeGlossary = useCallback(() => setGlossaryOpen(false), []);
  const toggleSubscribe = useCallback(
    () => setSubscribeOpen((open) => !open),
    [],
  );

  return (
    <>
      <header
        className="sticky top-0 z-40 flex w-full shrink-0 flex-col bg-surface-canvas pt-[env(safe-area-inset-top,0px)] lg:hidden"
        role="banner"
      >
        <div className="flex h-13 w-full flex-row items-center justify-between px-3">
          <button
            type="button"
            onClick={goHome}
            aria-label="Home"
            className="flex min-h-0 min-w-0 items-center gap-2 text-ink-primary transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          >
            <HomeSvgIcon className="size-6!" />
            <span className={`truncate ${MOBILE_HEADER_LABEL_CLASS}`}>
              Future Arts Ecosystems
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => {
                const next = !open;
                if (!next) setSubscribeOpen(false);
                return next;
              });
            }}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex size-8 shrink-0 items-center justify-center text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          >
            <Image
              src="/svg/menu.svg"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-6 shrink-0 object-contain"
              aria-hidden
            />
          </button>
        </div>
      </header>

      {portalEl && menuOpen
        ? createPortal(
            <div
              className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top,0px)+3.25rem)] flex min-h-0 flex-col bg-surface-canvas lg:hidden"
              style={{ zIndex: Z_INDEX.mobileSiteMenu }}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="shrink-0 border-t-hairline border-b-hairline border-solid border-border bg-surface-canvas">
                <button
                  type="button"
                  onClick={toggleSubscribe}
                  className={`flex h-13 w-full items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
                    subscribeOpen
                      ? "text-(--color-filter-pill-selection)"
                      : "text-ink-primary hover:bg-surface-hover/60"
                  }`}
                  aria-label={subscribeOpen ? "Close subscribe" : "Open subscribe"}
                >
                  <OpenSvgIcon
                    className={`shrink-0 transition-transform duration-150 motion-reduce:transition-none ${
                      subscribeOpen ? "-rotate-90" : "rotate-90"
                    }`}
                  />
                  <span>Subscribe</span>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {subscribeOpen ? (
                  <SubscribePanelContent
                    tabbed
                    className="flex min-h-0 h-full flex-1 flex-col bg-surface-canvas"
                  />
                ) : (
                  <nav
                    className="flex min-h-full flex-col items-stretch justify-center gap-0 px-0 py-8"
                    aria-label="Site"
                  >
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
                )}
              </div>
              <div className="shrink-0 border-t-hairline border-b-hairline border-solid border-border bg-surface-canvas pb-[env(safe-area-inset-bottom,0px)]">
                <button
                  type="button"
                  onClick={() => {
                    setSubscribeOpen(false);
                    setMenuOpen(false);
                  }}
                  className="flex h-13 w-full items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
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
