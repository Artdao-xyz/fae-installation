"use client";

import { useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { InstallationArrowIcon } from "./InstallationArrowIcon";
import { InstallationRestartConfirmDialog } from "./InstallationRestartConfirmDialog";
import { useSessionReceipt } from "./SessionReceiptProvider";

const shellClassName = [
  "relative z-10 flex w-full shrink-0 flex-col",
  "border-t-thin border-r-hairline border-solid border-border bg-[#e8e8e8] p-3",
].join(" ");

const actionButtonClassName = [
  "flex w-full shrink-0 items-center justify-between",
  "border-x-0 border-y-thin border-dotted border-border",
  "bg-[#ececec] px-2.5 py-[15px]",
  "font-lust-text text-sm leading-5 text-[#303030]",
  "transition-[opacity,background-color] hover:bg-[#F7F7F7] hover:opacity-90",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary",
].join(" ");

export function InstallationSidebarActions() {
  const { enabled, recording, openPrintConfirm, clearSession } =
    useSessionReceipt();
  const { resetToIdle } = useFilterSelection();
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

  if (!enabled || !recording) return null;

  return (
    <>
      <div
        className={shellClassName}
        role="group"
        aria-label="Session controls"
      >
        <button
          type="button"
          onClick={openPrintConfirm}
          className={`${actionButtonClassName} border-b-0`}
          aria-label="Complete journey and print receipt"
        >
          <span className="truncate">Complete Journey</span>
          <InstallationArrowIcon />
        </button>
        <button
          type="button"
          onClick={() => setRestartConfirmOpen(true)}
          className={actionButtonClassName}
          aria-label="Restart session"
        >
          <span className="truncate">Restart Session</span>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
          <img
            src="/svg/reset.svg"
            alt=""
            width={17}
            height={14}
            className="m-0 block h-3.5 w-auto max-h-3.5 shrink-0 object-contain object-center"
            aria-hidden
          />
        </button>
      </div>
      <InstallationRestartConfirmDialog
        open={restartConfirmOpen}
        onConfirm={() => {
          setRestartConfirmOpen(false);
          clearSession();
          resetToIdle();
        }}
        onCancel={() => setRestartConfirmOpen(false)}
      />
    </>
  );
}
