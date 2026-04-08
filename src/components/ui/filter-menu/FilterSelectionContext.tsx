"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FilterSelectionContextValue = {
  selectedFocusAreas: ReadonlySet<string>;
  selectedActivityTypes: ReadonlySet<string>;
  toggleFocusArea: (label: string) => void;
  toggleActivityType: (label: string) => void;
  clearFocusAreas: () => void;
  clearActivityTypes: () => void;
  /**
   * Replaces the current selection so it matches a content row’s tags (e.g. opening detail from a tile).
   */
  setFiltersFromContentRow: (row: {
    focusAreas: readonly string[];
    activityTypes: readonly string[];
  }) => void;
};

const FilterSelectionContext = createContext<FilterSelectionContextValue | null>(
  null,
);

export function FilterSelectionProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<FilterSelectionContextValue>(
    () => ({
      selectedFocusAreas,
      selectedActivityTypes,
      toggleFocusArea,
      toggleActivityType,
      clearFocusAreas,
      clearActivityTypes,
      setFiltersFromContentRow,
    }),
    [
      selectedFocusAreas,
      selectedActivityTypes,
      toggleFocusArea,
      toggleActivityType,
      clearFocusAreas,
      clearActivityTypes,
      setFiltersFromContentRow,
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
