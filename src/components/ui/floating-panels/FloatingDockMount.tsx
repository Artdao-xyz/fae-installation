"use client";

import { AboutPanel } from "@/components/ui/about-panel/AboutPanel";
import { GlossaryPanel } from "@/components/ui/glossary-panel";
import { LatestUpdatesPanel } from "@/components/ui/latest-updates-panel/LatestUpdatesPanel";
import { FloatingPanelStackProvider } from "./FloatingPanelStackContext";

/**
 * Client-only mount so SSR does not emit HTML for floating docks (avoids hydration
 * mismatches vs delayed About peek and client-only layout math).
 */
export function FloatingDockMount() {
  return (
    <FloatingPanelStackProvider>
      <AboutPanel />
      <GlossaryPanel />
      <LatestUpdatesPanel />
    </FloatingPanelStackProvider>
  );
}
