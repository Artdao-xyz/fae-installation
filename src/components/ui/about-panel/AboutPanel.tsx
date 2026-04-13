"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type View = "minimized" | "peek" | "full";

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

function BracketSectionLabel({ children }: { children: string }) {
  const rail = (
    <span
      className="flex w-0.5 shrink-0 flex-col justify-between py-1"
      aria-hidden
    >
      <span className="h-0.5 w-full border-hairline border-solid border-ink-primary bg-ink-primary" />
      <span className="h-0.5 w-full border-hairline border-solid border-ink-primary bg-ink-primary" />
    </span>
  );
  return (
    <div className="inline-flex items-stretch border-hairline border-solid border-ink-primary bg-surface-canvas/90 backdrop-blur-fae-md">
      {rail}
      <span className="flex items-center px-2 py-[5px]">
        <span className="font-fira-mono text-[10px] font-medium leading-[14px] text-ink-primary">
          {children}
        </span>
      </span>
      {rail}
    </div>
  );
}

function AboutFullScreenBody() {
  return (
    <div className="flex flex-col items-start gap-2.5 text-ink-body">
      <BracketSectionLabel>Vision</BracketSectionLabel>
      <div className="w-full font-suisseintl text-xs font-normal leading-5">
        {ABOUT_BODY}
      </div>

      <BracketSectionLabel>Team</BracketSectionLabel>
      <ul className="m-0 w-full list-none p-0 font-suisseintl text-xs font-normal leading-5">
        {ABOUT_FULL_TEAM.map((name) => (
          <li key={name} className="p-0">
            {name}
          </li>
        ))}
      </ul>

      <BracketSectionLabel>Partnerships</BracketSectionLabel>
      <p className="mb-0 font-suisseintl text-xs font-normal leading-5">
        You can explore our Twitch archive, or tune in live for special events.
        To get more involved, join our Telegram community, sign up to our
        monthly newsletter and take part in our quarterly Community Call. For
        partnerships and other inquiries, please email us.
      </p>

      <BracketSectionLabel>Contact</BracketSectionLabel>
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
  showRightDivider = false,
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
  showRightDivider?: boolean;
}) {
  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex min-h-[120px] w-filter-narrow-column shrink-0 flex-col items-center border-solid border-ink-primary bg-surface-canvas/90 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        showRightDivider ? "border-r-hairline" : ""
      }`}
    >
      <div className="flex min-h-[72px] w-full flex-1 flex-col items-center justify-between px-0.5">
        <OpenSvgIcon className={arrowClassName ?? ""} />
        <span className={navSidebarVerticalLabelClassName}>About</span>
      </div>
      <AboutSvgIcon className="mt-2" />
    </button>
  );
}

export function AboutPanel() {
  const panelId = useId();
  const [view, setView] = useState<View>("minimized");

  const openPeek = useCallback(() => setView("peek"), []);
  const openFull = useCallback(() => setView("full"), []);
  const closeFull = useCallback(() => setView("peek"), []);
  const minimize = useCallback(() => setView("minimized"), []);

  useEffect(() => {
    if (view !== "full") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFull();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, closeFull]);

  useEffect(() => {
    if (view !== "full") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [view]);

  return (
    <>
      {view === "minimized" ? (
        <div className="fixed top-5 right-5 z-52 border-hairline border-solid border-ink-primary">
          <AboutTabRail
            arrowClassName="-scale-x-100"
            onClick={openPeek}
            ariaExpanded={false}
            ariaControls={panelId}
          />
        </div>
      ) : null}

      {view === "peek" ? (
        <div
          id={panelId}
          role="region"
          aria-label="About"
          className="fixed top-5 right-5 z-52 flex max-h-about-panel w-about-panel overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md motion-reduce:transition-none"
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-row">
            <AboutTabRail
              onClick={minimize}
              ariaExpanded={true}
              ariaControls={panelId}
              showRightDivider
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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

      {view === "full" ? (
        <div
          className="fixed inset-0 z-60 flex flex-col bg-surface-canvas motion-reduce:transition-none"
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
