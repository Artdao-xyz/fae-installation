"use client";

import type { ReactNode } from "react";

const FOCUS_AREA_LABELS = [
  "AI",
  "Blockchain",
  "Cultural Strategy",
  "Ecology",
  "Economy",
  "Gaming",
  "Governance",
  "Infrastructure",
  "Interoperability",
  "Legal",
  "Ownership",
  "Publicy",
  "Public Value",
  "Robotics",
  "Simulation",
] as const;

const ACTIVITY_TYPE_LABELS = [
  "Artist Talk",
  "Case Studies",
  "Commission",
  "Community Calls",
  "Panel",
  "Editorial",
  "Events",
  "Exhibition",
  "Interview",
  "Launch",
  "Networks",
  "Playthrough",
  "Proposals",
  "Prototyping",
  "Publication",
  "R&D",
  "Report",
  "New Technologies",
  "Startegy",
  "Measurements of Success ",
  "Lab",
] as const;

/** Figma 2446:10657 — outer #414141 frame, inner rounded chip (both filter rows) */
function FilterPill({ label }: { label: string }) {
  return (
    <div className="flex items-center border-[0.5px] border-solid border-[#414141] bg-[#414141]">
      <div className="flex items-center justify-center rounded bg-[#E8E8E8] px-2.5 py-[5px]">
        <span className="whitespace-nowrap font-mono text-[10px] font-normal leading-[14px] text-[#414141]">
          {label}
        </span>
      </div>
    </div>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2.5 border-b-[0.5px]  border-solid border-[#414141] bg-[#E8E8E8] p-3">
      <div className="flex w-full items-center justify-between gap-2 whitespace-nowrap">
        <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[0.5px] text-[#303030]/60">
          {title}
        </p>
        <button
          type="button"
          className="cursor-default font-mono text-[6px] font-medium leading-2 text-[#303030] underline decoration-solid underline-offset-2"
          tabIndex={-1}
          aria-hidden
        >
          clear all
        </button>
      </div>
      {children}
    </div>
  );
}

export function PlaceholderSidebar() {
  return (
    <aside
      className="fixed left-0 top-0 z-10 flex h-screen w-[260px] flex-col overflow-y-auto border-r-[0.5px] border-[#414141] bg-[#E8E8E8]"
      aria-label="Sidebar placeholders (Figma)"
    >
      <FilterBlock title="Focus Areas / Themes">
        <div className="flex w-full flex-wrap content-center items-center gap-[5px]">
          {FOCUS_AREA_LABELS.map((label) => (
            <FilterPill key={label} label={label} />
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Activity Type">
        <div className="flex w-full flex-wrap content-center items-center gap-[5px]">
          {ACTIVITY_TYPE_LABELS.map((label) => (
            <FilterPill key={label} label={label} />
          ))}
        </div>
      </FilterBlock>
    </aside>
  );
}
