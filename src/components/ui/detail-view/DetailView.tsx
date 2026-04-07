"use client";

import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import type { ContentFixtureRow } from "@/data/content-fixture";
import { useFilterSelection } from "@/components/ui/filter-menu/FilterSelectionContext";
import { FORMAT_ICON_ITEMS } from "@/components/ui/filter-menu/domains/format/formatItems";

type DetailViewProps = {
  row: ContentFixtureRow;
  onClose: () => void;
  className?: string;
};

function Divider() {
  return <div className="h-px w-full shrink-0 bg-text-primary" role="presentation" />;
}

/** Corner-bracket outline chips (read-only), matching Figma “Filters-Button-Toggle” focus row. */
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
      <span className="h-0.5 w-full border-[0.5px] border-text-primary bg-text-primary" />
      <span className="h-0.5 w-full border-[0.5px] border-text-primary bg-text-primary" />
    </span>
  );

  return (
    <div
      className="flex items-center bg-white-fae/80 pr-px backdrop-blur-[25px]"
      data-name="Filters-Button-Toggle"
    >
      {cap}
      <span
        className={`flex items-center justify-center border-[0.5px] border-solid border-text-primary px-2 py-[5px] ${
          filterSelected ? "bg-surface-muted" : ""
        }`}
      >
        <span className="max-w-[220px] truncate font-mono text-[10px] font-normal leading-[14px] text-text-primary">
          {label}
        </span>
      </span>
      {cap}
    </div>
  );
}

/** Inverted pill when the label matches the current Activity filter selection (Figma selected state). */
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
        className="flex items-center gap-0 border-[0.5px] border-solid border-text-primary bg-text-primary"
        data-name="Filters-Button-Toggle"
      >
        <span className="rounded px-2.5 py-[5px] font-mono text-[10px] font-normal leading-[14px] text-text-primary bg-white-fae">
          {label}
        </span>
      </div>
    );
  }

  return (
    <span className="border-[0.5px] border-solid border-text-primary bg-white-fae/80 px-2.5 py-[5px] font-mono text-[10px] font-normal leading-[14px] text-text-primary backdrop-blur-[25px]">
      {label}
    </span>
  );
}

function NetworkPillReadOnly({ label }: { label: string }) {
  return (
    <span
      className="flex shrink-0 flex-col items-start justify-center border-[0.3px] border-dashed border-text-primary bg-white-fae/80 backdrop-blur-[25px]"
      data-name="Filters-Button-Toggle"
    >
      <span className="flex items-center justify-center rounded-full px-2 py-[5px]">
        <span className="whitespace-nowrap font-mono text-[10px] font-normal leading-[14px] text-text-primary">
          {label}
        </span>
      </span>
    </span>
  );
}

function formatIconForLabel(label: string) {
  return FORMAT_ICON_ITEMS.find((item) => item.label === label) ?? null;
}

function FormatReadOnlyChip({ label }: { label: string }) {
  const item = formatIconForLabel(label);
  if (item) {
    const { Icon } = item;
    return (
      <div
        className="flex h-[25px] w-[38px] shrink-0 items-center justify-center border-[0.5px] border-solid border-text-primary bg-white-fae/80 text-text-primary backdrop-blur-[25px]"
        title={label}
        aria-label={label}
      >
        <Icon className="pointer-events-none h-3.5 w-auto max-w-[28px] shrink-0" />
      </div>
    );
  }

  return (
    <div
      className="flex h-[25px] min-w-[38px] shrink-0 items-center justify-center border-[0.5px] border-solid border-text-primary bg-white-fae/80 px-2 font-mono text-[10px] text-text-primary backdrop-blur-[25px]"
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
    <p className="mb-0 font-suisseintl text-xs font-normal leading-[1.6] tracking-[0.36px] text-text-caption">
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
      className={`fixed right-0 top-0 z-55 flex h-full max-h-dvh w-[min(100vw-1rem,432px)] flex-col border-x-[0.5px] border-solid border-text-primary bg-white-fae motion-reduce:transition-none ${className}`}
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
              <p className="font-lust-text text-xl tracking-[-0.38px] text-black">
                {row.title}
              </p>
              <p className="font-lust-text text-xs tracking-[-0.228px] text-black">
                {row.year}
              </p>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-4">
            <div className="flex gap-2.5">
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-text-body">
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
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-text-body">
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
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-text-body">
                Format
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.formats.map((label) => (
                  <FormatReadOnlyChip key={label} label={label} />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <p className="w-[60px] shrink-0 font-fira-mono text-xs font-normal leading-[15px] tracking-[0.5px] text-text-body">
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
            <p className="font-lust-text text-xs leading-none tracking-[-0.228px] text-text-caption">
              Resources
            </p>
            <ul className="flex list-none flex-col gap-[5px] p-0">
              {row.resources.map((href) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-sm bg-white-fae/90 px-0 py-0.5 font-mono text-[10px] leading-[14px] text-text-body underline decoration-solid [text-decoration-skip-ink:none] backdrop-blur-[25px] hover:bg-surface-hover/80"
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
          className="flex w-full items-center justify-center gap-3 px-4 py-3 font-mono text-sm text-white-fae transition-colors hover:bg-black-fae/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white-fae focus-visible:ring-offset-2 focus-visible:ring-offset-text-body border-t-[0.5px] border-solid border-text-primary"
          aria-label="Close detail panel"
        >
          <span
            className="select-none text-[13px] leading-none tracking-wide text-black"
          >
            Show more
          </span>
        </button>
      </div>
    </aside>
  );
}
