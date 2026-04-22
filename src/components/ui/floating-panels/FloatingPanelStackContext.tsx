"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Z_INDEX } from "@/lib/z-index-scale";

export type FloatingPanelKey = "about" | "glossary" | "latestUpdates";

export type FloatingPanelPhase = "minimized" | "peek" | "full";

export type AboutPanelView = "minimized" | "peek" | "full";
export type DockPanelView = "minimized" | "peek";

/** Right floating stack: About starts minimized; peek opens with the filter sidebar (`AboutPeekWhenFilterSidebarOpens`). */
const INITIAL_ABOUT: AboutPanelView = "minimized";
const INITIAL_GLOSSARY: DockPanelView = "minimized";
const INITIAL_LATEST_UPDATES: DockPanelView = "minimized";

const BASE_MINIMIZED_Z = Z_INDEX.guiFloatingDock;
const PEEK_BASE_Z = Z_INDEX.guiPeekBase;
const ABOUT_FULL_Z = Z_INDEX.fullscreen;

type PanelsState = {
  about: AboutPanelView;
  glossary: DockPanelView;
  latestUpdates: DockPanelView;
};

type Ctx = {
  getChromeZIndex: (id: FloatingPanelKey, phase: FloatingPanelPhase) => number;
  aboutView: AboutPanelView;
  setAboutView: Dispatch<SetStateAction<AboutPanelView>>;
  glossaryView: DockPanelView;
  setGlossaryView: Dispatch<SetStateAction<DockPanelView>>;
  latestUpdatesView: DockPanelView;
  setLatestUpdatesView: Dispatch<SetStateAction<DockPanelView>>;
  /** Closes About (including full-screen), Glossary, and Latest updates. */
  minimizeAllFloatingPanels: () => void;
};

const FloatingPanelStackContext = createContext<Ctx | null>(null);

function peekOrder(p: PanelsState): FloatingPanelKey[] {
  const order: FloatingPanelKey[] = [];
  if (p.about === "peek") order.push("about");
  if (p.glossary === "peek") order.push("glossary");
  if (p.latestUpdates === "peek") order.push("latestUpdates");
  return order;
}

export function FloatingPanelStackProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<PanelsState>({
    about: INITIAL_ABOUT,
    glossary: INITIAL_GLOSSARY,
    latestUpdates: INITIAL_LATEST_UPDATES,
  });

  const setAboutView = useCallback((next: SetStateAction<AboutPanelView>) => {
    setPanels((prev) => {
      const about = typeof next === "function" ? next(prev.about) : next;
      const u: PanelsState = { ...prev, about };
      /** Opening About (peek or full) dismisses Glossary only; Latest updates may stay open. */
      if (about === "peek" || about === "full") u.glossary = "minimized";
      return u;
    });
  }, []);

  const setGlossaryView = useCallback((next: SetStateAction<DockPanelView>) => {
    setPanels((prev) => {
      const glossary = typeof next === "function" ? next(prev.glossary) : next;
      const u: PanelsState = { ...prev, glossary };
      /** Glossary peek closes About (any mode) and Latest updates. */
      if (glossary === "peek") {
        u.about = "minimized";
        u.latestUpdates = "minimized";
      }
      return u;
    });
  }, []);

  const setLatestUpdatesView = useCallback((next: SetStateAction<DockPanelView>) => {
    setPanels((prev) => {
      const latestUpdates =
        typeof next === "function" ? next(prev.latestUpdates) : next;
      const u: PanelsState = { ...prev, latestUpdates };
      /** Opening Latest updates (peek) dismisses Glossary. */
      if (latestUpdates === "peek") u.glossary = "minimized";
      return u;
    });
  }, []);

  const getChromeZIndex = useCallback(
    (id: FloatingPanelKey, phase: FloatingPanelPhase) => {
      if (phase === "full" && id === "about") return ABOUT_FULL_Z;
      if (phase === "minimized") return BASE_MINIMIZED_Z;
      const order = peekOrder(panels);
      const idx = order.indexOf(id);
      return PEEK_BASE_Z + Math.max(0, idx);
    },
    [panels],
  );

  const minimizeAllFloatingPanels = useCallback(() => {
    setPanels({
      about: "minimized",
      glossary: "minimized",
      latestUpdates: "minimized",
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      getChromeZIndex,
      aboutView: panels.about,
      setAboutView,
      glossaryView: panels.glossary,
      setGlossaryView,
      latestUpdatesView: panels.latestUpdates,
      setLatestUpdatesView,
      minimizeAllFloatingPanels,
    }),
    [
      getChromeZIndex,
      panels.about,
      panels.glossary,
      panels.latestUpdates,
      setAboutView,
      setGlossaryView,
      setLatestUpdatesView,
      minimizeAllFloatingPanels,
    ],
  );

  return (
    <FloatingPanelStackContext.Provider value={value}>
      {children}
    </FloatingPanelStackContext.Provider>
  );
}

export function useFloatingPanelStack() {
  const ctx = useContext(FloatingPanelStackContext);
  if (!ctx) {
    throw new Error("FloatingPanelStackProvider is required");
  }
  return ctx;
}
