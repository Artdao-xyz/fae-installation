"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import type { ContentRow } from "@/data/content-types";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { FilterPill } from "@/components/ui/filter-sidebar/primitives/FilterPill";
import { PreviewBlocksBody } from "./PreviewBlocksBody";
import { PreviewPanelCollapseBar } from "./PreviewPanelCollapseBar";

type PreviewViewProps = {
  row: ContentRow;
  /** When true, preview fills the viewport (docked panel hidden). */
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
  /** Dismisses the preview entirely (dock or full screen). */
  onClose: () => void;
  className?: string;
};

function Divider() {
  return (
    <div
      className="h-0 w-full shrink-0 border-t-hairline border-dotted border-ink-primary"
      role="presentation"
    />
  );
}

function resourceLinkLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    if (path && path !== "/") {
      const short = path.length > 24 ? `${path.slice(0, 24)}…` : path;
      return `${host}${short}`;
    }
    return host;
  } catch {
    return url;
  }
}

function RichParagraph({ text }: { text: string }) {
  const segments = text.split(/(\*[^*]+\*)/g);
  return (
    <p className="mb-0 font-suisseintl text-xs font-normal leading-[1.6] tracking-[0.36px] text-ink-caption">
      {segments.map((seg, i) => {
        if (seg.startsWith("*") && seg.endsWith("*") && seg.length >= 2) {
          return (
            <em key={i} className="italic">
              {seg.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{seg}</span>;
      })}
    </p>
  );
}

/** Read-only pills: match FilterSidebar variants; always ink (never selection blue) in preview. */
const pillReadOnlyClass = "pointer-events-none shrink-0";

const sectionLabelClass =
  "w-[72px] shrink-0 font-lust-text text-xs font-normal leading-none tracking-[-0.228px] text-ink-body";

function CategoryBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <p className={sectionLabelClass}>{label}</p>
      <div className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5 gap-y-1.5">
        {children}
      </div>
    </div>
  );
}

function PreviewMainContent({ row }: { row: ContentRow }) {
  const paragraphs = useMemo(
    () => row.content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
    [row.content],
  );

  const hasFocus = row.focusAreas.length > 0;
  const hasActivity = row.activityTypes.length > 0;
  const hasFormats = row.formats.length > 0;
  const hasNetworks = row.networks.length > 0;
  const hasArtists = row.artists.length > 0;
  const hasCategories =
    hasFocus || hasActivity || hasFormats || hasNetworks || hasArtists;
  const hasBlocks =
    row.contentBlocks !== null && row.contentBlocks.length > 0;
  const hasBody = hasBlocks || paragraphs.length > 0;
  const hasResources = row.resources.length > 0;
  const dateLine =
    row.yearLabel.trim().length > 0
      ? row.yearLabel
      : row.year > 0
        ? String(row.year)
        : "";

  return (
    <>
      <div className="flex w-full shrink-0 items-start gap-5">
        <div className="relative flex size-[205px] shrink-0 items-center justify-center overflow-hidden rounded-[3.677px] bg-surface-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.imageUrl}
            alt={row.title}
            className="pointer-events-none max-h-full max-w-full object-contain object-center"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-2.5 leading-none">
          <p className="font-lust-text text-xl tracking-[-0.38px] text-black-fae">
            {row.title}
          </p>
          {dateLine ? (
            <p className="font-lust-text text-xs tracking-[-0.228px] text-black-fae">
              {dateLine}
            </p>
          ) : null}
        </div>
      </div>

      {hasCategories ? (
        <>
          <Divider />
          <div className="flex flex-col gap-3">
            {hasFocus ? (
              <CategoryBlock label="Focus">
                {row.focusAreas.map((label) => (
                  <FilterPill
                    key={label}
                    label={label}
                    variant="square"
                    tone="fae-briefings"
                    selected={false}
                    className={pillReadOnlyClass}
                  />
                ))}
              </CategoryBlock>
            ) : null}
            {hasActivity ? (
              <CategoryBlock label="Activity">
                {row.activityTypes.map((label) => (
                  <FilterPill
                    key={label}
                    label={label}
                    variant="rounded"
                    tone="fae-briefings"
                    selected={false}
                    className={pillReadOnlyClass}
                  />
                ))}
              </CategoryBlock>
            ) : null}
            {hasFormats ? (
              <CategoryBlock label="Format">
                {row.formats.map((label) => (
                  <FilterPill
                    key={label}
                    label={label}
                    variant="rounded"
                    tone="fae-briefings"
                    selected={false}
                    className={pillReadOnlyClass}
                  />
                ))}
              </CategoryBlock>
            ) : null}
            {hasNetworks ? (
              <CategoryBlock label="Network">
                {row.networks.map((label) => (
                  <FilterPill
                    key={label}
                    label={label}
                    variant="dotted"
                    tone="network"
                    selected={false}
                    className={pillReadOnlyClass}
                  />
                ))}
              </CategoryBlock>
            ) : null}
            {hasArtists ? (
              <CategoryBlock label="Artist">
                {row.artists.map((label) => (
                  <FilterPill
                    key={label}
                    label={label}
                    variant="rounded"
                    tone="artists"
                    selected={false}
                    className={pillReadOnlyClass}
                  />
                ))}
              </CategoryBlock>
            ) : null}
          </div>
        </>
      ) : null}

      {hasBody ? (
        <>
          <Divider />
          {hasBlocks && row.contentBlocks ? (
            <PreviewBlocksBody content={row.contentBlocks} />
          ) : (
            <div className="flex flex-col gap-3">
              {paragraphs.map((p, i) => (
                <RichParagraph key={i} text={p} />
              ))}
            </div>
          )}
        </>
      ) : null}

      {hasResources ? (
        <>
          <Divider />
          <div className="flex flex-col gap-2 pb-2">
            <p className="font-lust-text text-xs leading-none tracking-[-0.228px] text-ink-caption">
              Resources
            </p>
            <ul className="flex list-none flex-col gap-1 p-0">
              {row.resources.map((href) => (
                <li key={href} className="leading-none">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 rounded-sm bg-surface-canvas/90 py-0 pl-0 pr-0 font-fira-mono text-[10px] leading-[14px] text-ink-body underline decoration-solid [text-decoration-skip-ink:none] backdrop-blur-fae-md hover:bg-surface-hover/80"
                  >
                    <span className="min-w-0 truncate">
                      {resourceLinkLabel(href)}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/svg/blue-arrow.svg"
                      alt=""
                      className="h-[7px] w-[5px] shrink-0 object-contain"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </>
  );
}

const dockedShellClass =
  "fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] z-55 flex shrink-0 flex-col border-hairline border-solid border-ink-primary bg-surface-canvas motion-reduce:transition-none";

/** Same inset on all sides as `MarginGuideFrame` dashed guides. */
const fullScreenShellClass =
  "fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] left-[var(--inset-margin-guide)] z-[62] flex min-h-0 min-w-0 flex-col overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas motion-reduce:transition-none";

const showMoreButtonClass =
  "inline-flex w-fit items-center gap-2 self-start border-t-hairline border-r-hairline border-solid border-ink-primary px-5 py-3 font-fira-mono text-sm text-black-fae transition-colors hover:bg-black-fae/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas";

export function PreviewView({
  row,
  fullScreen,
  onFullScreenChange,
  onClose,
  className = "",
}: PreviewViewProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (fullScreen) {
    return (
      <div
        className={fullScreenShellClass}
        role="dialog"
        aria-modal="true"
        aria-label="Content preview full screen"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={onClose}
        />
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-12 md:py-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            <PreviewMainContent row={row} />
          </div>
        </div>
        <div className="flex shrink-0 justify-start">
          <button
            type="button"
            onClick={onClose}
            className={showMoreButtonClass}
            aria-label="Close preview"
          >
            <OpenSvgIcon className="shrink-0" />
            <span className="select-none text-[13px] leading-none tracking-wide">Show less</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`${dockedShellClass} w-preview-panel ${className}`}
      aria-label="Content preview"
      role="dialog"
      aria-modal="true"
    >
      <PreviewPanelCollapseBar
        ariaLabel="Close preview"
        onClose={onClose}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 pb-4 scrollbar-hide">
          <PreviewMainContent row={row} />
        </div>
      </div>

      <div className="flex shrink-0 justify-start">
        <button
          type="button"
          onClick={() => onFullScreenChange(true)}
          className={showMoreButtonClass}
          aria-label="Open full screen preview"
        >
          <OpenSvgIcon className="shrink-0 rotate-180" />
          <span className="select-none text-[13px] leading-none tracking-wide">Show more</span>
        </button>
      </div>
    </aside>
  );
}
