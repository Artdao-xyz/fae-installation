"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ContentRow } from "@/data/content-types";
import {
  mergeCmsAndCatalogOptionLabels,
  uniqueSortedLabelsFromCatalog,
} from "@/lib/content-catalog-filter-options";

export type ContentCatalogStatus = "loading" | "success" | "error";

export type FilterSelectionContextValue = {
  /** Full Strapi-backed catalog (one shared fetch for search + particles). */
  contentCatalog: ContentRow[];
  contentCatalogStatus: ContentCatalogStatus;
  contentCatalogError: string | null;
  contentCatalogTotal: number;
  contentCatalogFetchMs: number | null;
  /** Taxonomy labels: CMS-ordered option collections merged with values present on catalog rows. */
  filterFocusOptionLabels: readonly string[];
  filterActivityOptionLabels: readonly string[];
  filterFormatOptionLabels: readonly string[];
  filterNetworkOptionLabels: readonly string[];
  filterArtistOptionLabels: readonly string[];
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
  /** Domain subpanel toggles — live in context so layout/hero/particles update same frame as the click. */
  briefingsSubpanelOpen: boolean;
  setBriefingsSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  rdSubpanelOpen: boolean;
  setRdSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  networkSubpanelOpen: boolean;
  setNetworkSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  artistsSubpanelOpen: boolean;
  setArtistsSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  /** Derived: any domain subpanel column open. */
  filterSubpanelsOpen: boolean;
  /** Opens the right-hand content preview for this row (wired from the particle canvas). */
  openContentPreview: (row: ContentRow) => void;
  /** Called by `ImageParticleSimulationView` to connect `openContentPreview` to preview state. */
  registerContentPreviewOpener: (fn: ((row: ContentRow) => void) | null) => void;
  /** Row currently shown in the content preview (for chrome such as HomeBar breadcrumb). */
  contentPreviewRow: ContentRow | null;
  setContentPreviewRow: Dispatch<SetStateAction<ContentRow | null>>;
};

const FilterSelectionContext = createContext<FilterSelectionContextValue | null>(
  null,
);

export function FilterSelectionProvider({ children }: { children: ReactNode }) {
  const contentPreviewOpenerRef = useRef<((row: ContentRow) => void) | null>(null);

  const [contentPreviewRow, setContentPreviewRow] = useState<ContentRow | null>(
    null,
  );

  const [contentCatalog, setContentCatalog] = useState<ContentRow[]>([]);
  const [contentCatalogStatus, setContentCatalogStatus] =
    useState<ContentCatalogStatus>("loading");
  const [contentCatalogError, setContentCatalogError] = useState<string | null>(
    null,
  );
  const [contentCatalogTotal, setContentCatalogTotal] = useState(0);
  const [contentCatalogFetchMs, setContentCatalogFetchMs] = useState<
    number | null
  >(null);
  const [taxonomyLabelsFromApi, setTaxonomyLabelsFromApi] = useState<{
    focus: string[];
    activity: string[];
    format: string[];
    network: string[];
    artist: string[];
  }>({
    focus: [],
    activity: [],
    format: [],
    network: [],
    artist: [],
  });

  useEffect(() => {
    let cancelled = false;
    setContentCatalogStatus("loading");
    setContentCatalogError(null);

    void (async () => {
      const asStringArray = (obj: unknown, key: string): string[] => {
        if (
          !obj ||
          typeof obj !== "object" ||
          !(key in obj) ||
          !Array.isArray((obj as Record<string, unknown>)[key])
        ) {
          return [];
        }
        return (obj as Record<string, unknown[]>)[key]!.filter(
          (x): x is string => typeof x === "string",
        );
      };

      try {
        const res = await fetch("/api/strapi/outputs", {
          credentials: "same-origin",
        });
        const body: unknown = await res.json();

        if (!res.ok) {
          const msg =
            body &&
            typeof body === "object" &&
            "error" in body &&
            typeof (body as { error: unknown }).error === "string"
              ? (body as { error: string }).error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }

        if (cancelled) return;

        const rows =
          body &&
          typeof body === "object" &&
          "rows" in body &&
          Array.isArray((body as { rows: unknown }).rows)
            ? ((body as { rows: ContentRow[] }).rows)
            : [];
        const total =
          body &&
          typeof body === "object" &&
          "total" in body &&
          typeof (body as { total: unknown }).total === "number"
            ? (body as { total: number }).total
            : rows.length;
        const durationMs =
          body &&
          typeof body === "object" &&
          "durationMs" in body &&
          typeof (body as { durationMs: unknown }).durationMs === "number"
            ? (body as { durationMs: number }).durationMs
            : null;

        setContentCatalog(rows);
        setContentCatalogTotal(total);
        setContentCatalogFetchMs(durationMs);
        setContentCatalogStatus("success");

        try {
          const taxRes = await fetch("/api/strapi/taxonomy-options", {
            credentials: "same-origin",
          });
          const taxBody: unknown = taxRes.ok ? await taxRes.json() : null;

          if (cancelled) return;

          if (taxRes.ok && taxBody && typeof taxBody === "object") {
            setTaxonomyLabelsFromApi({
              focus: asStringArray(taxBody, "focusOptionLabels"),
              activity: asStringArray(taxBody, "activityOptionLabels"),
              format: asStringArray(taxBody, "formatOptionLabels"),
              network: asStringArray(taxBody, "networkOptionLabels"),
              artist: asStringArray(taxBody, "artistOptionLabels"),
            });
          } else {
            setTaxonomyLabelsFromApi({
              focus: [],
              activity: [],
              format: [],
              network: [],
              artist: [],
            });
          }
        } catch {
          if (cancelled) return;
          setTaxonomyLabelsFromApi({
            focus: [],
            activity: [],
            format: [],
            network: [],
            artist: [],
          });
        }

        if (!cancelled) setFiltersPanelOpen(true);
      } catch (e) {
        if (cancelled) return;
        setContentCatalog([]);
        setContentCatalogTotal(0);
        setContentCatalogFetchMs(null);
        setTaxonomyLabelsFromApi({
          focus: [],
          activity: [],
          format: [],
          network: [],
          artist: [],
        });
        setContentCatalogError(
          e instanceof Error ? e.message : "Failed to load content",
        );
        setContentCatalogStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Closed until catalog + taxonomy pipeline finishes so layout doesn’t jump with empty filters. */
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [briefingsSubpanelOpen, setBriefingsSubpanelOpen] = useState(false);
  const [rdSubpanelOpen, setRdSubpanelOpen] = useState(false);
  const [networkSubpanelOpen, setNetworkSubpanelOpen] = useState(false);
  const [artistsSubpanelOpen, setArtistsSubpanelOpen] = useState(false);
  const filterSubpanelsOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen;

  const [selectedFocusAreas, setSelectedFocusAreas] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<Set<string>>(
    () => new Set(),
  );
  const [filterResetNonce, setFilterResetNonce] = useState(0);

  const focusDerivedFromRows = useMemo(
    () => uniqueSortedLabelsFromCatalog(contentCatalog, "focusAreas"),
    [contentCatalog],
  );
  const activityDerivedFromRows = useMemo(
    () => uniqueSortedLabelsFromCatalog(contentCatalog, "activityTypes"),
    [contentCatalog],
  );
  const formatsDerivedFromRows = useMemo(
    () => uniqueSortedLabelsFromCatalog(contentCatalog, "formats"),
    [contentCatalog],
  );
  const networksDerivedFromRows = useMemo(
    () => uniqueSortedLabelsFromCatalog(contentCatalog, "networks"),
    [contentCatalog],
  );
  const artistsDerivedFromRows = useMemo(
    () => uniqueSortedLabelsFromCatalog(contentCatalog, "artists"),
    [contentCatalog],
  );

  const filterFocusOptionLabels = useMemo(
    () =>
      mergeCmsAndCatalogOptionLabels(
        taxonomyLabelsFromApi.focus,
        focusDerivedFromRows,
      ),
    [taxonomyLabelsFromApi.focus, focusDerivedFromRows],
  );
  const filterActivityOptionLabels = useMemo(
    () =>
      mergeCmsAndCatalogOptionLabels(
        taxonomyLabelsFromApi.activity,
        activityDerivedFromRows,
      ),
    [taxonomyLabelsFromApi.activity, activityDerivedFromRows],
  );
  const filterFormatOptionLabels = useMemo(
    () =>
      mergeCmsAndCatalogOptionLabels(
        taxonomyLabelsFromApi.format,
        formatsDerivedFromRows,
      ),
    [taxonomyLabelsFromApi.format, formatsDerivedFromRows],
  );
  const filterNetworkOptionLabels = useMemo(
    () =>
      mergeCmsAndCatalogOptionLabels(
        taxonomyLabelsFromApi.network,
        networksDerivedFromRows,
      ),
    [taxonomyLabelsFromApi.network, networksDerivedFromRows],
  );
  const filterArtistOptionLabels = useMemo(
    () =>
      mergeCmsAndCatalogOptionLabels(
        taxonomyLabelsFromApi.artist,
        artistsDerivedFromRows,
      ),
    [taxonomyLabelsFromApi.artist, artistsDerivedFromRows],
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
      contentCatalog,
      contentCatalogStatus,
      contentCatalogError,
      contentCatalogTotal,
      contentCatalogFetchMs,
      filterFocusOptionLabels,
      filterActivityOptionLabels,
      filterFormatOptionLabels,
      filterNetworkOptionLabels,
      filterArtistOptionLabels,
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
      briefingsSubpanelOpen,
      setBriefingsSubpanelOpen,
      rdSubpanelOpen,
      setRdSubpanelOpen,
      networkSubpanelOpen,
      setNetworkSubpanelOpen,
      artistsSubpanelOpen,
      setArtistsSubpanelOpen,
      filterSubpanelsOpen,
      openContentPreview,
      registerContentPreviewOpener,
      contentPreviewRow,
      setContentPreviewRow,
    }),
    [
      contentCatalog,
      contentCatalogStatus,
      contentCatalogError,
      contentCatalogTotal,
      contentCatalogFetchMs,
      filterFocusOptionLabels,
      filterActivityOptionLabels,
      filterFormatOptionLabels,
      filterNetworkOptionLabels,
      filterArtistOptionLabels,
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
      briefingsSubpanelOpen,
      rdSubpanelOpen,
      networkSubpanelOpen,
      artistsSubpanelOpen,
      filterSubpanelsOpen,
      openContentPreview,
      registerContentPreviewOpener,
      contentPreviewRow,
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
