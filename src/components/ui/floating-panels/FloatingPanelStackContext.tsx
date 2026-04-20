"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FloatingPanelKey = "about" | "glossary" | "fellowships";

export type FloatingPanelPhase = "minimized" | "peek" | "full";

const BASE_MINIMIZED_Z = 52;
const PEEK_BASE_Z = 54;
const ABOUT_FULL_Z = 60;

type Ctx = {
  getChromeZIndex: (id: FloatingPanelKey, phase: FloatingPanelPhase) => number;
  setPanelPhase: (id: FloatingPanelKey, phase: FloatingPanelPhase) => void;
};

const FloatingPanelStackContext = createContext<Ctx | null>(null);

export function FloatingPanelStackProvider({ children }: { children: ReactNode }) {
  const [expandedStack, setExpandedStack] = useState<FloatingPanelKey[]>([]);

  const setPanelPhase = useCallback((id: FloatingPanelKey, phase: FloatingPanelPhase) => {
    setExpandedStack((prev) => {
      if (phase === "minimized") return prev.filter((k) => k !== id);
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const getChromeZIndex = useCallback(
    (id: FloatingPanelKey, phase: FloatingPanelPhase) => {
      if (phase === "full" && id === "about") return ABOUT_FULL_Z;
      if (phase === "minimized") return BASE_MINIMIZED_Z;
      const idx = expandedStack.indexOf(id);
      return PEEK_BASE_Z + Math.max(0, idx);
    },
    [expandedStack],
  );

  const value = useMemo(
    () => ({ getChromeZIndex, setPanelPhase }),
    [getChromeZIndex, setPanelPhase],
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

/** Keeps stack order in sync before paint so z-index matches interaction. */
export function useFloatingPanelPhase(id: FloatingPanelKey, phase: FloatingPanelPhase) {
  const { setPanelPhase } = useFloatingPanelStack();
  useLayoutEffect(() => {
    setPanelPhase(id, phase);
    return () => setPanelPhase(id, "minimized");
  }, [id, phase, setPanelPhase]);
}
