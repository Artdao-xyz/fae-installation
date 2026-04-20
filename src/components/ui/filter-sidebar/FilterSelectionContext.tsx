"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ContentRow } from "@/data/content-types";

export type FilterSelectionContextValue = {
  selectedFocusAreas: ReadonlySet<string>;
  selectedActivityTypes: ReadonlySet<string>;
  /** Increments when `clearAllFilters` runs; local filter UIs can reset from this. */
  filterResetNonce: number;
  toggleFocusArea: (label: string) => void;
  toggleActivityType: (label: string) => void;
  clearFocusAreas: () => void;
  clearActivityTypes: () => void;
  /** Clears focus + activity and bumps `filterResetNonce` so Format / subpanel filters reset too. */
  clearAllFilters: () => void;
  setFiltersFromContentRow: (row: {
    focusAreas: readonly string[];
    activityTypes: readonly string[];
  }) => void;
  /** Filter options column open (desktop layout + hero alignment). */
  filtersPanelOpen: boolean;
  setFiltersPanelOpen: Dispatch<SetStateAction<boolean>>;
  /** Opens the right-hand content preview for this row (wired from the particle canvas). */
  openContentPreview: (row: ContentRow) => void;
  /** Called by `ImageParticleSimulationView` to connect `openContentPreview` to preview state. */
  registerContentPreviewOpener: (fn: ((row: ContentRow) => void) | null) => void;
};

const FilterSelectionContext = createContext<FilterSelectionContextValue | null>(
  null,
);

export function FilterSelectionProvider({ children }: { children: ReactNode }) {
  const contentPreviewOpenerRef = useRef<((row: ContentRow) => void) | null>(null);

  const [filtersPanelOpen, setFiltersPanelOpen] = useState(true);

  const [selectedFocusAreas, setSelectedFocusAreas] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<Set<string>>(
    () => new Set(),
  );
  const [filterResetNonce, setFilterResetNonce] = useState(0);

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

  const clearAllFilters = useCallback(() => {
    setSelectedFocusAreas(new Set());
    setSelectedActivityTypes(new Set());
    setFilterResetNonce((n) => n + 1);
  }, []);

  const setFiltersFromContentRow = useCallback(
    (row: { focusAreas: readonly string[]; activityTypes: readonly string[] }) => {
      setSelectedFocusAreas(new Set(row.focusAreas));
      setSelectedActivityTypes(new Set(row.activityTypes));
    },
    [],
  );

  const openContentPreview = useCallback((row: ContentRow) => {
    contentPreviewOpenerRef.current?.(row);
  }, []);

  const registerContentPreviewOpener = useCallback(
    (fn: ((row: ContentRow) => void) | null) => {
      contentPreviewOpenerRef.current = fn;
    },
    [],
  );

  const value = useMemo<FilterSelectionContextValue>(
    () => ({
      selectedFocusAreas,
      selectedActivityTypes,
      filterResetNonce,
      toggleFocusArea,
      toggleActivityType,
      clearFocusAreas,
      clearActivityTypes,
      clearAllFilters,
      setFiltersFromContentRow,
      filtersPanelOpen,
      setFiltersPanelOpen,
      openContentPreview,
      registerContentPreviewOpener,
    }),
    [
      selectedFocusAreas,
      selectedActivityTypes,
      filterResetNonce,
      toggleFocusArea,
      toggleActivityType,
      clearFocusAreas,
      clearActivityTypes,
      clearAllFilters,
      setFiltersFromContentRow,
      filtersPanelOpen,
      openContentPreview,
      registerContentPreviewOpener,
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
