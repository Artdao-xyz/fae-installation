"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import {
  fullScreenContentInnerClass,
  fullScreenContentScrollClass,
  fullScreenContentShellClass,
  fullScreenShowMoreLessButtonClass,
  fullScreenShowMoreLessLabelClass,
} from "@/components/ui/preview/fullScreenContentChrome";
import { PreviewPanelCollapseBar } from "@/components/ui/preview/PreviewPanelCollapseBar";

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
      develops insights, tools and projects that advance our mission.
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

function AboutFullScreenBody() {
  return (
    <div className="flex w-full flex-col items-start gap-5 text-ink-body">

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

/**
 * Isolated so open animation runs on each mount, matching the preview full-screen enter transition.
 */
function AboutFullScreenView({
  zIndex,
  onBackToPeek,
}: {
  zIndex: number;
  onBackToPeek: () => void;
}) {
  const [shellEntered, setShellEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    queueMicrotask(() => {
      if (cancelled || typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setShellEntered(true);
        return;
      }
      setShellEntered(false);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellEntered(true);
      });
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`${fullScreenContentShellClass} transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        shellEntered ? "opacity-100" : "opacity-0"
      } motion-reduce:opacity-100`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label="About Future Art Ecosystems"
    >
      <PreviewPanelCollapseBar
        ariaLabel="Back to About panel"
        onClose={onBackToPeek}
      />
      <div className={fullScreenContentScrollClass}>
        <div className={fullScreenContentInnerClass}>
          <AboutFullScreenBody />
        </div>
      </div>
      <div className="flex shrink-0 justify-start">
        <button
          type="button"
          onClick={onBackToPeek}
          className={fullScreenShowMoreLessButtonClass}
          aria-label="Back to About panel"
        >
          <OpenSvgIcon className="shrink-0" />
          <span className={fullScreenShowMoreLessLabelClass}>Show less</span>
        </button>
      </div>
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [aboutView]);

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
                  className={fullScreenShowMoreLessButtonClass}
                >
                  <OpenSvgIcon className="shrink-0 rotate-180" />
                  <span className={fullScreenShowMoreLessLabelClass}>
                    Show more
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {aboutView === "full" ? (
        <AboutFullScreenView
          zIndex={getChromeZIndex("about", "full")}
          onBackToPeek={closeFull}
        />
      ) : null}
    </>
  );
}
