"use client";

import { useEffect, useRef } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { AboutPanel } from "@/components/ui/about-panel/AboutPanel";
import { GlossaryPanel } from "@/components/ui/glossary-panel";
import { LatestUpdatesPanel } from "@/components/ui/latest-updates-panel/LatestUpdatesPanel";
import { useFloatingPanelStack } from "./FloatingPanelStackContext";

/**
 * When the filter options column opens (catalog + taxonomy ready), open About
 * to peek in the same turn so both enter together (replaces a fixed delay on About).
 */
function AboutPeekWhenFilterSidebarOpens() {
  const { filtersPanelOpen } = useFilterSelection();
  const { setAboutView } = useFloatingPanelStack();
  const prevFiltersOpen = useRef(false);

  useEffect(() => {
    if (filtersPanelOpen && !prevFiltersOpen.current) {
      setAboutView((v) => (v === "minimized" ? "peek" : v));
    }
    prevFiltersOpen.current = filtersPanelOpen;
  }, [filtersPanelOpen, setAboutView]);

  return null;
}

/**
 * Client-only mount so SSR does not emit HTML for floating docks (avoids hydration
 * mismatches vs client-only layout math). `FloatingPanelStackProvider` must wrap this.
 */
export function FloatingDockMount() {
  return (
    <>
      <AboutPeekWhenFilterSidebarOpens />
      <AboutPanel />
      <GlossaryPanel />
      <LatestUpdatesPanel />
    </>
  );
}
