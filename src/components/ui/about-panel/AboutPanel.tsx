"use client";

import { useCallback, useEffect, useId } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";

const ABOUT_BODY = (
  <>
    <p className="mb-0 leading-[1.6]">
      Future Art Ecosystems is a project for building 21st century cultural
      infrastructure to support art and advanced technologies for the public good.
    </p>
    <p className="mb-0 leading-[1.6]">&nbsp;</p>
    <p className="mb-0 leading-[1.6]">
      Through briefings, R&amp;D Labs and a growing community of artists,
      technologists, policy-makers, researchers and fellow organisations, FAE
      develops insights, tools and projects that advance our mission. Embedded
      in Serpentine&apos;s Arts Technologies team, FAE facilitates the emergence
      of new systems for art, technology and society.
    </p>
  </>
);

const ABOUT_FULL_TEAM = [
  "Tamar Clarke-Brown",
  "Tommie Introna",
  "Victoria Ivanova",
  "Eva Jäger",
  "Lina Martin-Chan",
  "Vi Trinh",
  "Ruth Waters",
  "Kay Watson",
] as const;

const showMoreLessButtonClassName =
  "inline-flex items-center gap-2 border-r-hairline border-t-hairline border-solid border-ink-primary bg-surface-canvas/90 px-5 py-4 text-left backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary";

const showMoreLessLabelClassName =
  "whitespace-nowrap font-fira-mono text-sm font-normal leading-[14px] text-ink-body";

function AboutFullScreenBody() {
  return (
    <div className="flex flex-col items-start gap-2.5 text-ink-body">

      <div className="w-full font-suisseintl text-xs font-normal leading-5">
        {ABOUT_BODY}
      </div>

      <ul className="m-0 w-full list-none p-0 font-suisseintl text-xs font-normal leading-5">
        {ABOUT_FULL_TEAM.map((name) => (
          <li key={name} className="p-0">
            {name}
          </li>
        ))}
      </ul>

      <p className="mb-0 font-suisseintl text-xs font-normal leading-5">
        You can explore our Twitch archive, or tune in live for special events.
        To get more involved, join our Telegram community, sign up to our
        monthly newsletter and take part in our quarterly Community Call. For
        partnerships and other inquiries, please email us.
      </p>

      <nav
        className="flex flex-wrap items-center gap-x-5 gap-y-2 font-fira-mono text-xs font-normal text-ink-body"
        aria-label="Social and community links"
      >
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          Twitch
        </a>
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          Telegram
        </a>
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          Newsletter
        </a>
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          X
        </a>
      </nav>
    </div>
  );
}

function AboutTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex h-full min-h-0 w-filter-narrow-column shrink-0 flex-col items-center self-stretch border-b-0 border-solid border-ink-primary bg-surface-canvas/90 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        ariaExpanded ? "border-r-hairline" : ""
      }`}
    >
      <div className="flex min-h-[72px] w-full flex-1 flex-col items-center justify-between px-0.5">
        <OpenSvgIcon
          className={`${arrowClassName ?? ""} transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
            ariaExpanded ? "rotate-180" : ""
          }`}
        />
        <span className={navSidebarVerticalLabelClassName}>About</span>
      </div>
      <AboutSvgIcon className="mt-2" />
    </button>
  );
}

export function AboutPanel() {
  const panelId = useId();
  const dockOuterH = floatingDockPanelOuterHeightPx();
  const { aboutView, setAboutView, getChromeZIndex } = useFloatingPanelStack();

  const openFull = useCallback(() => setAboutView("full"), [setAboutView]);
  const closeFull = useCallback(() => setAboutView("peek"), [setAboutView]);

  useEffect(() => {
    if (aboutView !== "full") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFull();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutView, closeFull]);

  useEffect(() => {
    if (aboutView !== "full") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [aboutView]);

  /** Start closed on load, then match the filter-sidebar-style peek open after 1s if still minimized. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      setAboutView((v) => (v === "minimized" ? "peek" : v));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [setAboutView]);

  const toggleDock = useCallback(() => {
    setAboutView((v) => (v === "peek" ? "minimized" : "peek"));
  }, [setAboutView]);

  const peekOpen = aboutView === "peek";
  const peekClipClass = peekOpen
    ? "max-w-[calc(var(--width-about-panel)-var(--width-filter-narrow-column))] opacity-100"
    : "max-w-0 opacity-0 pointer-events-none";

  return (
    <>
      {aboutView !== "full" ? (
        <div
          className={`fixed top-8.5 right-8.5 flex min-h-0 max-h-about-panel flex-row items-stretch overflow-hidden border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md ${
            peekOpen ? "border-hairline" : "border-hairline border-b-0"
          }`}
          style={{
            zIndex: getChromeZIndex("about", peekOpen ? "peek" : "minimized"),
            height: `${dockOuterH}px`,
            minHeight: `${dockOuterH}px`,
          }}
        >
          <AboutTabRail
            arrowClassName="-scale-x-100"
            onClick={toggleDock}
            ariaExpanded={peekOpen}
            ariaControls={panelId}
          />

          <div
            id={peekOpen ? panelId : undefined}
            role={peekOpen ? "region" : undefined}
            aria-label={peekOpen ? "About" : undefined}
            className={`h-full min-h-0 shrink-0 overflow-hidden ${FLOATING_DOCK_PEEK_CLIP_CLASS} ${peekClipClass}`}
          >
            <div className="flex h-full min-h-0 w-[calc(var(--width-about-panel)-var(--width-filter-narrow-column))] shrink-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5">
                <div className="font-suisseintl text-xs font-normal leading-[1.6] text-ink-body">
                  {ABOUT_BODY}
                </div>
              </div>

              <div className="shrink-0 pt-6">
                <button
                  type="button"
                  onClick={openFull}
                  className={showMoreLessButtonClassName}
                >
                  <OpenSvgIcon className="-scale-x-100" />
                  <span className={showMoreLessLabelClassName}>Show more</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {aboutView === "full" ? (
        <div
          className="fixed inset-0 flex flex-col bg-surface-canvas motion-reduce:transition-none"
          style={{ zIndex: getChromeZIndex("about", "full") }}
          role="dialog"
          aria-modal="true"
          aria-label="About Future Art Ecosystems"
        >
          <div className="flex shrink-0 border-b-hairline border-solid border-ink-primary bg-surface-canvas/95 backdrop-blur-fae-md">
            <button
              type="button"
              onClick={closeFull}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-r-hairline border-solid border-ink-primary transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
              aria-label="Back to compact about panel"
            >
              <OpenSvgIcon />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
              <AboutFullScreenBody />
            </div>
          </div>

          <div className="shrink-0 px-6 pt-6 sm:px-10">
            <div className="mx-auto max-w-2xl">
              <button
                type="button"
                onClick={closeFull}
                className={showMoreLessButtonClassName}
              >
                <OpenSvgIcon className="-scale-x-100" />
                <span className={showMoreLessLabelClassName}>Show less</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
