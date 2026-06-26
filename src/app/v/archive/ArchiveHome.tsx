"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReceiptArchiveSummary } from "@/lib/session-receipt/archive-receipt-shared";
import { formatReceiptDate } from "@/lib/session-receipt/format-transcript";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { ReceiptDigitalView } from "@/components/session-receipt/ReceiptDigitalView";
import { ArchivePastePanel } from "./ArchivePastePanel";

type ArchiveHomeProps = {
  summaries: ReceiptArchiveSummary[];
};

export function ArchiveHome({ summaries }: ArchiveHomeProps) {
  const [pastedReceipt, setPastedReceipt] = useState<SessionReceipt | null>(
    null,
  );

  if (pastedReceipt) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPastedReceipt(null)}
          className="absolute left-4 top-4 z-10 rounded bg-white/90 px-3 py-1.5 font-suisseintl text-sm text-black shadow-sm"
          style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        >
          ← Archive
        </button>
        <ReceiptDigitalView receipt={pastedReceipt} variant="confirm" />
      </div>
    );
  }

  const newestFirst = [...summaries].reverse();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 bg-[#e9e9e9] px-6 py-10">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wide text-black/60">
          Local backup
        </p>
        <h1 className="font-suisseintl text-2xl text-black">
          Archived receipts
        </h1>
        <p className="font-suisseintl text-sm text-black/70">
          Full-fidelity copies from{" "}
          <code className="font-mono">data/receipts.jsonl</code>, or paste JSON
          from a cloud backup.
        </p>
      </header>

      <ArchivePastePanel onView={setPastedReceipt} />

      <h2 className="font-suisseintl text-sm font-medium text-black">
        Local file
      </h2>

      {newestFirst.length === 0 ? (
        <p className="font-suisseintl text-sm text-black/70">
          No archived receipts yet. Print a session to append the first entry.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 bg-white">
          {newestFirst.map((item) => (
            <li key={item.index}>
              <Link
                href={`/v/archive?i=${item.index}`}
                className="flex flex-col gap-1 px-4 py-3 transition hover:bg-black/3"
              >
                <span className="font-mono text-xs text-black/50">
                  #{item.index} · archived {formatReceiptDate(item.archivedAt)}
                </span>
                <span className="font-suisseintl text-sm text-black">
                  Session {formatReceiptDate(item.sessionStart)}
                </span>
                <span className="font-suisseintl text-xs text-black/60">
                  {item.eventCount} interaction
                  {item.eventCount === 1 ? "" : "s"}
                  {item.hasPath ? " · star map" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
