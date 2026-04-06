import type { Metadata } from "next";
import Link from "next/link";
import { ThumbnailSpreadDebug } from "@/components/debug/ThumbnailSpreadDebug";

export const metadata: Metadata = {
  title: "Debug — Thumbnail spread",
  description: "Deterministic center-out thumbnail layout (viewport)",
};

export default function DebugSpreadPage() {
  return (
    <>
      <Link
        href="/debug"
        className="fixed left-3 top-3 z-10 rounded bg-white/90 px-3 py-1.5 font-sans text-sm text-text-primary shadow hover:bg-white"
      >
        ← Debug
      </Link>
      <ThumbnailSpreadDebug />
    </>
  );
}
