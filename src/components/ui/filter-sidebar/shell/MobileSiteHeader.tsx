"use client";

import Link from "next/link";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";

const MOBILE_HEADER_LABEL_CLASS =
  "font-suisseintl text-sm font-normal leading-5 transition-[color,filter] duration-150 motion-reduce:transition-none";

const SELECTED_TEXT_CLASS = "text-[#0000ff]";
const IDLE_TEXT_CLASS = "text-black";

const ICON_WRAP_BASE =
  "shrink-0 transition-[filter] duration-150 motion-reduce:transition-none";
const ICON_SELECTED_CLASS = `${ICON_WRAP_BASE} brightness-100`;
const ICON_IDLE_CLASS = `${ICON_WRAP_BASE} brightness-0`;

/**
 * `max-lg` only: fixed strip at the top of the viewport (with safe area), matching `h-11` rails
 * (close bar, Clear/Apply). Home resets canvas / preview; About opens the About panel full-screen.
 */
export function MobileSiteHeader() {
  const { contentPreviewRow, resetToIdle, closeContentPreview } = useFilterSelection();
  const { aboutView, setAboutView } = useFloatingPanelStack();
  const aboutSelected = aboutView === "full";
  const homeSelected = !aboutSelected;

  return (
    <header
      className="sticky top-0 z-40 flex w-full shrink-0 flex-col border-b-hairline border-solid border-ink-primary bg-surface-canvas pt-[env(safe-area-inset-top,0px)] lg:hidden"
      role="banner"
    >
      <div className="flex h-11 w-full flex-row items-stretch gap-1 px-1">
        <Link
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            const closingAbout = aboutView === "full";
            if (closingAbout) setAboutView("minimized");
            if (contentPreviewRow) {
              closeContentPreview();
            } else if (!closingAbout) {
              resetToIdle();
            }
          }}
          aria-label={
            contentPreviewRow
              ? "Return to filtered results, close preview"
              : "Home"
          }
          aria-current={homeSelected ? "page" : undefined}
          className={`flex min-h-0 min-w-0 flex-1 basis-0 items-center justify-end gap-2 pr-2 transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
            homeSelected ? SELECTED_TEXT_CLASS : IDLE_TEXT_CLASS
          }`}
        >
          <span className={homeSelected ? ICON_SELECTED_CLASS : ICON_IDLE_CLASS}>
            <HomeSvgIcon />
          </span>
          <span className={MOBILE_HEADER_LABEL_CLASS}>Home</span>
        </Link>
        <button
          type="button"
          onClick={() => setAboutView("full")}
          aria-label="Open About"
          aria-pressed={aboutSelected}
          className={`flex min-h-0 min-w-0 flex-1 basis-0 items-center justify-start gap-2 pl-2 transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
            aboutSelected ? SELECTED_TEXT_CLASS : IDLE_TEXT_CLASS
          }`}
        >
          <span className={aboutSelected ? ICON_SELECTED_CLASS : ICON_IDLE_CLASS}>
            <AboutSvgIcon />
          </span>
          <span className={MOBILE_HEADER_LABEL_CLASS}>About</span>
        </button>
      </div>
    </header>
  );
}
