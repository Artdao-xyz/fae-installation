"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ContentRow } from "@/data/content-types";

export type FilterSelectionContextValue = {
  selectedFocusAreas: ReadonlySet<string>;
  selectedActivityTypes: ReadonlySet<string>;
  toggleFocusArea: (label: string) => void;
  toggleActivityType: (label: string) => void;
  clearFocusAreas: () => void;
  clearActivityTypes: () => void;
  setFiltersFromContentRow: (row: {
    focusAreas: readonly string[];
    activityTypes: readonly string[];
  }) => void;
  /** Opens the right-hand content detail panel for this row (wired from the particle canvas). */
  openContentDetail: (row: ContentRow) => void;
  /** Called by `ImageParticleSimulationView` to connect `openContentDetail` to preview state. */
  registerContentDetailOpener: (fn: ((row: ContentRow) => void) | null) => void;
};

const FilterSelectionContext = createContext<FilterSelectionContextValue | null>(
  null,
);

export function FilterSelectionProvider({ children }: { children: ReactNode }) {
  const contentDetailOpenerRef = useRef<((row: ContentRow) => void) | null>(null);

  const [selectedFocusAreas, setSelectedFocusAreas] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleFocusArea = useCallback((label: string) => {
    setSelectedFocusAreas((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const toggleActivityType = useCallback((label: string) => {
    setSelectedActivityTypes((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const clearFocusAreas = useCallback(() => setSelectedFocusAreas(new Set()), []);
  const clearActivityTypes = useCallback(
    () => setSelectedActivityTypes(new Set()),
    [],
  );

  const setFiltersFromContentRow = useCallback(
    (row: { focusAreas: readonly string[]; activityTypes: readonly string[] }) => {
      setSelectedFocusAreas(new Set(row.focusAreas));
      setSelectedActivityTypes(new Set(row.activityTypes));
    },
    [],
  );

  const openContentDetail = useCallback((row: ContentRow) => {
    contentDetailOpenerRef.current?.(row);
  }, []);

  const registerContentDetailOpener = useCallback(
    (fn: ((row: ContentRow) => void) | null) => {
      contentDetailOpenerRef.current = fn;
    },
    [],
  );

  const value = useMemo<FilterSelectionContextValue>(
    () => ({
      selectedFocusAreas,
      selectedActivityTypes,
      toggleFocusArea,
      toggleActivityType,
      clearFocusAreas,
      clearActivityTypes,
      setFiltersFromContentRow,
      openContentDetail,
      registerContentDetailOpener,
    }),
    [
      selectedFocusAreas,
      selectedActivityTypes,
      toggleFocusArea,
      toggleActivityType,
      clearFocusAreas,
      clearActivityTypes,
      setFiltersFromContentRow,
      openContentDetail,
      registerContentDetailOpener,
    ],
  );

  return (
    <FilterSelectionContext.Provider value={value}>
      {children}
    </FilterSelectionContext.Provider>
  );
}

export function useFilterSelection(): FilterSelectionContextValue {
  const ctx = useContext(FilterSelectionContext);
  if (!ctx) {
    throw new Error("useFilterSelection must be used within FilterSelectionProvider");
  }
  return ctx;
}
