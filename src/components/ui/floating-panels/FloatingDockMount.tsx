"use client";

import { useEffect, useRef } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { AboutPanel } from "@/components/ui/about-panel/AboutPanel";
import { GlossaryPanel } from "@/components/ui/glossary-panel";
import { LatestUpdatesPanel } from "@/components/ui/latest-updates-panel/LatestUpdatesPanel";
import { useFloatingPanelStack } from "./FloatingPanelStackContext";

/**
 * On first open of the filter options column, peek About in the same turn so both
 * enter together (replaces a fixed delay on About). We only do this **once** after
 * load: a later false→true on the sidebar (user closed and reopened) must not
 * re-trigger About peek, which looked like a duplicate "load" animation.
 */
function AboutPeekWhenFilterSidebarOpens() {
  const { filtersPanelOpen } = useFilterSelection();
  const { setAboutView } = useFloatingPanelStack();
  const prevFiltersOpen = useRef(false);
  const didInitialAboutPeekRef = useRef(false);

  useEffect(() => {
    const justOpened = filtersPanelOpen && !prevFiltersOpen.current;
    prevFiltersOpen.current = filtersPanelOpen;
    if (!justOpened || didInitialAboutPeekRef.current) return;
    setAboutView((v) => (v === "minimized" ? "peek" : v));
    didInitialAboutPeekRef.current = true;
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
