"use client";

import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import type { ContentRow } from "@/data/content-types";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
type DetailViewProps = {
  row: ContentRow;
  onClose: () => void;
  className?: string;
};

function Divider() {
  return <div className="h-px w-full shrink-0 bg-ink-primary" role="presentation" />;
}

function FocusOutlineChip({
  label,
  filterSelected,
}: {
  label: string;
  filterSelected: boolean;
}) {
  const cap = (
    <span
      className="flex h-[26px] w-0.5 shrink-0 flex-col justify-between py-px"
      aria-hidden
    >
      <span className="h-0.5 w-full border-hairline border-ink-primary bg-ink-primary" />
      <span className="h-0.5 w-full border-hairline border-ink-primary bg-ink-primary" />
    </span>
  );

  return (
    <div
      className="flex items-center bg-surface-canvas/80 pr-px backdrop-blur-fae-md"
      data-name="Filters-Button-Toggle"
    >
      {cap}
      <span
        className={`flex items-center justify-center border-hairline border-solid border-ink-primary px-2 py-[5px] ${
          filterSelected ? "bg-surface-muted" : ""
        }`}
      >
        <span className="max-w-[220px] truncate font-fira-mono text-[10px] font-normal leading-[14px] text-ink-primary">
          {label}
        </span>
      </span>
      {cap}
    </div>
  );
}

function ActivityChipReadOnly({
  label,
  filterSelected,
}: {
  label: string;
  filterSelected: boolean;
}) {
  if (filterSelected) {
    return (
      <div
        className="flex items-center gap-0 border-hairline border-solid border-ink-primary bg-ink-primary"
        data-name="Filters-Button-Toggle"
      >
        <span className="rounded px-2.5 py-[5px] font-fira-mono text-[10px] font-normal leading-[14px] text-ink-primary bg-surface-canvas">
          {label}
        </span>
      </div>
    );
  }

  return (
    <span className="border-hairline border-solid border-ink-primary bg-surface-canvas/80 px-2.5 py-[5px] font-fira-mono text-[10px] font-normal leading-[14px] text-ink-primary backdrop-blur-fae-md">
      {label}
    </span>
  );
}

function NetworkPillReadOnly({ label }: { label: string }) {
  return (
    <span
      className="flex shrink-0 flex-col items-start justify-center border-fine border-dashed border-ink-primary bg-surface-canvas/80 backdrop-blur-fae-md"
      data-name="Filters-Button-Toggle"
    >
      <span className="flex items-center justify-center rounded-full px-2 py-[5px]">
        <span className="whitespace-nowrap font-fira-mono text-[10px] font-normal leading-[14px] text-ink-primary">
          {label}
        </span>
      </span>
    </span>
  );
}

function FormatReadOnlyChip({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-format-icon min-w-0 shrink-0 items-center justify-center border-hairline border-solid border-ink-primary bg-surface-canvas/80 px-2 font-fira-mono text-[10px] font-normal leading-[14px] text-ink-primary backdrop-blur-fae-md"
      title={label}
    >
      {label}
    </div>
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

export function DetailView({ row, onClose, className = "" }: DetailViewProps) {
  const { selectedFocusAreas, selectedActivityTypes } = useFilterSelection();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const paragraphs = row.content.split(/\n\n+/).filter(Boolean);

  return (
    <aside
      className={`fixed right-0 top-0 z-55 flex h-full max-h-dvh w-detail-panel flex-col border-x-hairline border-solid border-ink-primary bg-surface-canvas motion-reduce:transition-none ${className}`}
      aria-label="Content detail"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 pb-4 scrollbar-hide">
          <div className="flex w-full shrink-0 items-end gap-5">
            <div className="relative size-[205px] shrink-0 overflow-hidden rounded-[3.677px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.imageUrl}
                alt={row.title}
                className="pointer-events-none size-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start justify-end gap-2.5 leading-none">
              <p className="font-lust-text text-xl tracking-[-0.38px] text-black-fae">
                {row.title}
              </p>
              <p className="font-lust-text text-xs tracking-[-0.228px] text-black-fae">
                {row.year}
              </p>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-4">
            <div className="flex gap-2.5">
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-ink-body">
                Focus
              </p>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 gap-y-1.5">
                {row.focusAreas.map((label) => (
                  <FocusOutlineChip
                    key={label}
                    label={label}
                    filterSelected={selectedFocusAreas.has(label)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-ink-body">
                Activity
              </p>
              <div className="flex min-w-0 flex-1 flex-wrap gap-x-1.5 gap-y-1.5">
                {row.activityTypes.map((label) => (
                  <ActivityChipReadOnly
                    key={label}
                    label={label}
                    filterSelected={selectedActivityTypes.has(label)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-ink-body">
                Format
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.formats.map((label) => (
                  <FormatReadOnlyChip key={label} label={label} />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-ink-body">
                Network
              </p>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 gap-y-1.5">
                {row.networks.map((label) => (
                  <NetworkPillReadOnly key={label} label={label} />
                ))}
              </div>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-0">
            {paragraphs.map((p, i) => (
              <RichParagraph key={i} text={p} />
            ))}
          </div>

          <Divider />

          <div className="flex flex-col gap-3 pb-2">
            <p className="font-lust-text text-xs leading-none tracking-[-0.228px] text-ink-caption">
              Resources
            </p>
            <ul className="flex list-none flex-col gap-[5px] p-0">
              {row.resources.map((href) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-sm bg-surface-canvas/90 px-0 py-0.5 font-fira-mono text-[10px] leading-[14px] text-ink-body underline decoration-solid [text-decoration-skip-ink:none] backdrop-blur-fae-md hover:bg-surface-hover/80"
                  >
                    <span className="min-w-0 truncate">{resourceLinkLabel(href)}</span>
                    <ExternalLink
                      className="size-2.5 shrink-0 opacity-80"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-stretch">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-3 px-4 py-3 font-fira-mono text-sm text-surface-canvas transition-colors hover:bg-black-fae/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-surface-canvas focus-visible:ring-offset-2 focus-visible:ring-offset-ink-body border-t-hairline border-solid border-ink-primary"
          aria-label="Close detail panel"
        >
          <span
            className="select-none text-[13px] leading-none tracking-wide text-black-fae"
          >
            Show more
          </span>
        </button>
      </div>
    </aside>
  );
}
