"use client";

import { AboutPanel } from "@/components/ui/about-panel/AboutPanel";
import { GlossaryPanel } from "@/components/ui/glossary-panel";
import { LatestUpdatesPanel } from "@/components/ui/latest-updates-panel/LatestUpdatesPanel";

/**
 * Client-only mount so SSR does not emit HTML for floating docks (avoids hydration
 * mismatches vs delayed About peek and client-only layout math).
 * `FloatingPanelStackProvider` must wrap this and any subtree that controls stack state.
 */
export function FloatingDockMount() {
  return (
    <>
      <AboutPanel />
      <GlossaryPanel />
      <LatestUpdatesPanel />
    </>
  );
}
