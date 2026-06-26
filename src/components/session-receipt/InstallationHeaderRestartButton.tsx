"use client";

import { useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { InstallationRestartConfirmDialog } from "./InstallationRestartConfirmDialog";
import { useSessionReceipt } from "./SessionReceiptProvider";

const restartButtonClassName =
  "inline-flex shrink-0 items-center justify-center bg-transparent leading-[0] transition-[opacity,background-color] hover:bg-[#F7F7F7] hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary";

type InstallationHeaderRestartButtonProps = {
  className?: string;
};

export function InstallationHeaderRestartButton({
  className = "",
}: InstallationHeaderRestartButtonProps) {
  const { enabled, recording, clearSession } = useSessionReceipt();
  const { resetToIdle } = useFilterSelection();
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

  if (!enabled || !recording) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setRestartConfirmOpen(true)}
        className={`${restartButtonClassName} ${className}`}
        aria-label="Restart Journey"
      >
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
