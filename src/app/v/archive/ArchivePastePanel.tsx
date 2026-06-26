"use client";

import { useState } from "react";
import { parseReceiptArchiveJson } from "@/lib/session-receipt/archive-receipt-shared";
import type { SessionReceipt } from "@/lib/session-receipt/types";

type ArchivePastePanelProps = {
  onView: (receipt: SessionReceipt) => void;
};

export function ArchivePastePanel({ onView }: ArchivePastePanelProps) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleView() {
    const parsed = parseReceiptArchiveJson(raw);
    if (!parsed) {
      setError(
        "Invalid JSON — paste a full archive line or a receipt object with sessionStart, events, seed, and prompt.",
      );
      return;
    }
    setError(null);
    onView(parsed);
  }

  return (
    <section className="space-y-3 rounded border border-black/10 bg-white p-4">
      <div className="space-y-1">
        <h2 className="font-suisseintl text-sm font-medium text-black">
          Paste JSON
        </h2>
        <p className="font-suisseintl text-xs text-black/60">
          From <code className="font-mono">receipts.jsonl</code>, R2, or any
          saved backup — one archive line or the receipt object inside it.
        </p>
      </div>
      <textarea
        value={raw}
        onChange={(event) => {
          setRaw(event.target.value);
          if (error) setError(null);
        }}
        rows={8}
        spellCheck={false}
        placeholder='{"archivedAt":"…","receipt":{…}}'
        className="w-full resize-y rounded border border-black/15 bg-[#fafafa] p-3 font-mono text-xs leading-relaxed text-black outline-none focus:border-black/40"
      />
      {error ? (
        <p className="font-suisseintl text-xs text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleView}
        disabled={!raw.trim()}
        className="rounded bg-black px-4 py-2 font-suisseintl text-sm text-white disabled:opacity-40"
      >
        View receipt
      </button>
    </section>
  );
}
