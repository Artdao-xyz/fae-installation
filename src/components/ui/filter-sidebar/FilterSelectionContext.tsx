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
import {
  countMatchingFilterRows,
  toggledSet,
  type FilterMatchMode,
  type TaxonomyFilterSelection,
} from "@/lib/filter-row-match";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";

/** Sidebar availability hints use the same AND semantics as the default particle spread. */
const SIDEBAR_FILTER_MATCH_MODE: FilterMatchMode = "intersection";

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
  selectedArtists: ReadonlySet<string>;
  selectedFormats: ReadonlySet<string>;
  selectedNetworks: ReadonlySet<string>;
  /** FAE Briefing subpanel (not yet tied to catalog rows — cleared with Clear all). */
  selectedFaeBriefing: string | null;
  /** Increments when `clearAllFilters` runs; local filter UIs can reset from this. */
  filterResetNonce: number;
  /**
   * Increments when `resetToIdle` runs (Escape, canvas background, or legacy “refresh all”)
   * so the search field can clear in sync.
   */
  searchQueryResetNonce: number;
  toggleFocusArea: (label: string) => void;
  toggleActivityType: (label: string) => void;
  toggleArtist: (label: string) => void;
  toggleFormat: (label: string) => void;
  toggleNetwork: (label: string) => void;
  setSelectedFaeBriefing: (label: string | null) => void;
  clearFocusAreas: () => void;
  clearActivityTypes: () => void;
  clearSelectedArtists: () => void;
  clearSelectedFormats: () => void;
  clearSelectedNetworks: () => void;
  /** Clears all taxonomy + briefing + bumps `filterResetNonce` for any remaining local UIs. */
  clearAllFilters: () => void;
  /**
   * Clears all filters, closes the content preview, clears the search string (see `searchQueryResetNonce`),
   * and returns the canvas to idle — same as the old search “refresh” control. Bound to Escape and
   * empty-canvas click from `ImageParticleSimulationView`.
   */
  resetToIdle: () => void;
  setFiltersFromContentRow: (row: {
    focusAreas: readonly string[];
    activityTypes: readonly string[];
    artists?: readonly string[];
    formats?: readonly string[];
    networks?: readonly string[];
  }) => void;
  /**
   * Remembers the current taxonomy + briefing so opening a content preview can re-apply
   * `row` for the docked panel, then restore this when the preview closes.
   */
  snapshotFiltersBeforeContentPreview: () => void;
  /**
   * Re-applies the last `snapshotFiltersBeforeContentPreview` (if any) and clears the snapshot.
   * Used when closing the preview to return to the previous filtered spread.
   */
  restoreFiltersAfterContentPreview: () => void;
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
  /**
   * Closes the content preview and returns particles to idle spread (same as the preview close
   * control) — wired from the canvas, not by setting `contentPreviewRow` directly.
   */
  closeContentPreview: () => void;
  registerContentPreviewCloser: (fn: (() => void) | null) => void;
  /**
   * After calling a taxonomy `toggle*`, use this to close the content preview without restoring
   * the pre-preview snapshot (keeps the new filter state) and to open the filter column.
   */
  applyPreviewPillFilterAndClose: () => void;
  /** Row currently shown in the content preview (for chrome such as HomeBar breadcrumb). */
  contentPreviewRow: ContentRow | null;
  setContentPreviewRow: Dispatch<SetStateAction<ContentRow | null>>;
  /**
   * Rows matching current catalog-backed filters (Focus, Activity, Artists, Format, Network), AND semantics.
   * Used for empty-state messaging and disabling impossible options.
   */
  filterMatchingRowCount: number;
  /** Catalog rows that would match if this tag were toggled (same as next click). */
  focusOptionToggleMatchCount: ReadonlyMap<string, number>;
  activityOptionToggleMatchCount: ReadonlyMap<string, number>;
  artistOptionToggleMatchCount: ReadonlyMap<string, number>;
  formatOptionToggleMatchCount: ReadonlyMap<string, number>;
  networkOptionToggleMatchCount: ReadonlyMap<string, number>;
};

const FilterSelectionContext = createContext<FilterSelectionContextValue | null>(
  null,
);

type PreviewFilterSnapshot = {
  focusAreas: string[];
  activityTypes: string[];
  artists: string[];
  formats: string[];
  networks: string[];
  faeBriefing: string | null;
};

export function FilterSelectionProvider({ children }: { children: ReactNode }) {
  const { minimizeAllFloatingPanels } = useFloatingPanelStack();
  const contentPreviewOpenerRef = useRef<((row: ContentRow) => void) | null>(null);
  const contentPreviewCloserRef = useRef<(() => void) | null>(null);
  const previewFilterSnapshotRef = useRef<PreviewFilterSnapshot | null>(null);

  const [contentPreviewRow, setContentPreviewRow] = useState<ContentRow | null>(
    null,
  );
  const contentPreviewRowRef = useRef<ContentRow | null>(null);
  useEffect(() => {
    contentPreviewRowRef.current = contentPreviewRow;
  }, [contentPreviewRow]);

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
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedFaeBriefing, setSelectedFaeBriefing] = useState<string | null>(
    null,
  );
  const [filterResetNonce, setFilterResetNonce] = useState(0);
  const [searchQueryResetNonce, setSearchQueryResetNonce] = useState(0);

  const taxonomySelection = useMemo(
    (): TaxonomyFilterSelection => ({
      focus: selectedFocusAreas,
      activity: selectedActivityTypes,
      artists: selectedArtists,
      formats: selectedFormats,
      networks: selectedNetworks,
    }),
    [
      selectedFocusAreas,
      selectedActivityTypes,
      selectedArtists,
      selectedFormats,
      selectedNetworks,
    ],
  );

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

  const filterMatchingRowCount = useMemo(
    () =>
      countMatchingFilterRows(
        contentCatalog,
        taxonomySelection,
        SIDEBAR_FILTER_MATCH_MODE,
      ),
    [contentCatalog, taxonomySelection],
  );

  const focusOptionToggleMatchCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const label of filterFocusOptionLabels) {
      const nextFocus = toggledSet(
        selectedFocusAreas,
        label,
        selectedFocusAreas.has(label),
      );
      m.set(
        label,
        countMatchingFilterRows(
          contentCatalog,
          { ...taxonomySelection, focus: nextFocus },
          SIDEBAR_FILTER_MATCH_MODE,
        ),
      );
    }
    return m;
  }, [contentCatalog, filterFocusOptionLabels, taxonomySelection, selectedFocusAreas]);

  const activityOptionToggleMatchCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const label of filterActivityOptionLabels) {
      const nextActivity = toggledSet(
        selectedActivityTypes,
        label,
        selectedActivityTypes.has(label),
      );
      m.set(
        label,
        countMatchingFilterRows(
          contentCatalog,
          { ...taxonomySelection, activity: nextActivity },
          SIDEBAR_FILTER_MATCH_MODE,
        ),
      );
    }
    return m;
  }, [
    contentCatalog,
    filterActivityOptionLabels,
    taxonomySelection,
    selectedActivityTypes,
  ]);

  const artistOptionToggleMatchCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const label of filterArtistOptionLabels) {
      const nextArtists = toggledSet(
        selectedArtists,
        label,
        selectedArtists.has(label),
      );
      m.set(
        label,
        countMatchingFilterRows(
          contentCatalog,
          { ...taxonomySelection, artists: nextArtists },
          SIDEBAR_FILTER_MATCH_MODE,
        ),
      );
    }
    return m;
  }, [contentCatalog, filterArtistOptionLabels, taxonomySelection, selectedArtists]);

  const formatOptionToggleMatchCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const label of filterFormatOptionLabels) {
      const nextFormats = toggledSet(
        selectedFormats,
        label,
        selectedFormats.has(label),
      );
      m.set(
        label,
        countMatchingFilterRows(
          contentCatalog,
          { ...taxonomySelection, formats: nextFormats },
          SIDEBAR_FILTER_MATCH_MODE,
        ),
      );
    }
    return m;
  }, [contentCatalog, filterFormatOptionLabels, taxonomySelection, selectedFormats]);

  const networkOptionToggleMatchCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const label of filterNetworkOptionLabels) {
      const nextNetworks = toggledSet(
        selectedNetworks,
        label,
        selectedNetworks.has(label),
      );
      m.set(
        label,
        countMatchingFilterRows(
          contentCatalog,
          { ...taxonomySelection, networks: nextNetworks },
          SIDEBAR_FILTER_MATCH_MODE,
        ),
      );
    }
    return m;
  }, [
    contentCatalog,
    filterNetworkOptionLabels,
    taxonomySelection,
    selectedNetworks,
  ]);

  const setFiltersFromContentRow = useCallback(
    (row: {
      focusAreas: readonly string[];
      activityTypes: readonly string[];
      artists?: readonly string[];
      formats?: readonly string[];
      networks?: readonly string[];
    }) => {
      minimizeAllFloatingPanels();
      setSelectedFocusAreas(new Set(row.focusAreas));
      setSelectedActivityTypes(new Set(row.activityTypes));
      setSelectedArtists(new Set(row.artists ?? []));
      setSelectedFormats(new Set(row.formats ?? []));
      setSelectedNetworks(new Set(row.networks ?? []));
    },
    [minimizeAllFloatingPanels],
  );

  const clearPendingPreviewFilterSnapshot = useCallback(() => {
    previewFilterSnapshotRef.current = null;
  }, []);

  const snapshotFiltersBeforeContentPreview = useCallback(() => {
    previewFilterSnapshotRef.current = {
      focusAreas: [...selectedFocusAreas],
      activityTypes: [...selectedActivityTypes],
      artists: [...selectedArtists],
      formats: [...selectedFormats],
      networks: [...selectedNetworks],
      faeBriefing: selectedFaeBriefing,
    };
  }, [
    selectedActivityTypes,
    selectedArtists,
    selectedFaeBriefing,
    selectedFocusAreas,
    selectedFormats,
    selectedNetworks,
  ]);

  const restoreFiltersAfterContentPreview = useCallback(() => {
    const snap = previewFilterSnapshotRef.current;
    if (!snap) return;
    previewFilterSnapshotRef.current = null;
    minimizeAllFloatingPanels();
    setSelectedFocusAreas(new Set(snap.focusAreas));
    setSelectedActivityTypes(new Set(snap.activityTypes));
    setSelectedArtists(new Set(snap.artists));
    setSelectedFormats(new Set(snap.formats));
    setSelectedNetworks(new Set(snap.networks));
    setSelectedFaeBriefing(snap.faeBriefing);
  }, [minimizeAllFloatingPanels]);

  const openContentPreview = useCallback((row: ContentRow) => {
    contentPreviewOpenerRef.current?.(row);
  }, []);

  const registerContentPreviewOpener = useCallback(
    (fn: ((row: ContentRow) => void) | null) => {
      contentPreviewOpenerRef.current = fn;
    },
    [],
  );

  const closeContentPreview = useCallback(() => {
    contentPreviewCloserRef.current?.();
  }, []);

  const registerContentPreviewCloser = useCallback((fn: (() => void) | null) => {
    contentPreviewCloserRef.current = fn;
  }, []);

  const applyPreviewPillFilterAndClose = useCallback(() => {
    clearPendingPreviewFilterSnapshot();
    setFiltersPanelOpen(true);
    closeContentPreview();
  }, [clearPendingPreviewFilterSnapshot, setFiltersPanelOpen, closeContentPreview]);

  /**
   * When the user removes a filter while a content preview is open, clear the pre-preview
   * snapshot (so we do not restore filters and undo their change) and close the preview so
   * the canvas re-sorts to the new filter state.
   */
  const endContentPreviewOnFilterDeselect = useCallback(() => {
    if (contentPreviewRowRef.current == null) return;
    clearPendingPreviewFilterSnapshot();
    closeContentPreview();
  }, [clearPendingPreviewFilterSnapshot, closeContentPreview]);

  const toggleFocusArea = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      if (selectedFocusAreas.has(label)) {
        endContentPreviewOnFilterDeselect();
      }
      setSelectedFocusAreas((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [
      endContentPreviewOnFilterDeselect,
      minimizeAllFloatingPanels,
      selectedFocusAreas,
    ],
  );

  const toggleActivityType = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      if (selectedActivityTypes.has(label)) {
        endContentPreviewOnFilterDeselect();
      }
      setSelectedActivityTypes((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [
      endContentPreviewOnFilterDeselect,
      minimizeAllFloatingPanels,
      selectedActivityTypes,
    ],
  );

  const toggleArtist = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      if (selectedArtists.has(label)) {
        endContentPreviewOnFilterDeselect();
      }
      setSelectedArtists((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [
      endContentPreviewOnFilterDeselect,
      minimizeAllFloatingPanels,
      selectedArtists,
    ],
  );

  const toggleFormat = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      if (selectedFormats.has(label)) {
        endContentPreviewOnFilterDeselect();
      }
      setSelectedFormats((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [
      endContentPreviewOnFilterDeselect,
      minimizeAllFloatingPanels,
      selectedFormats,
    ],
  );

  const toggleNetwork = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      if (selectedNetworks.has(label)) {
        endContentPreviewOnFilterDeselect();
      }
      setSelectedNetworks((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [
      endContentPreviewOnFilterDeselect,
      minimizeAllFloatingPanels,
      selectedNetworks,
    ],
  );

  const setSelectedFaeBriefingCb = useCallback(
    (label: string | null) => {
      minimizeAllFloatingPanels();
      if (label === null && selectedFaeBriefing != null) {
        endContentPreviewOnFilterDeselect();
      }
      setSelectedFaeBriefing(label);
    },
    [
      endContentPreviewOnFilterDeselect,
      minimizeAllFloatingPanels,
      selectedFaeBriefing,
    ],
  );

  const exitContentPreviewToFilterCanvas = useCallback(() => {
    if (contentPreviewRow == null) return;
    clearPendingPreviewFilterSnapshot();
    setFiltersPanelOpen(true);
    closeContentPreview();
  }, [
    contentPreviewRow,
    clearPendingPreviewFilterSnapshot,
    closeContentPreview,
  ]);

  const clearFocusAreas = useCallback(() => {
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setSelectedFocusAreas(new Set());
  }, [exitContentPreviewToFilterCanvas, minimizeAllFloatingPanels]);

  const clearActivityTypes = useCallback(() => {
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setSelectedActivityTypes(new Set());
  }, [exitContentPreviewToFilterCanvas, minimizeAllFloatingPanels]);

  const clearSelectedArtists = useCallback(() => {
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setSelectedArtists(new Set());
  }, [exitContentPreviewToFilterCanvas, minimizeAllFloatingPanels]);

  const clearSelectedFormats = useCallback(() => {
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setSelectedFormats(new Set());
  }, [exitContentPreviewToFilterCanvas, minimizeAllFloatingPanels]);

  const clearSelectedNetworks = useCallback(() => {
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setSelectedNetworks(new Set());
  }, [exitContentPreviewToFilterCanvas, minimizeAllFloatingPanels]);

  const clearAllFilters = useCallback(() => {
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setSelectedFocusAreas(new Set());
    setSelectedActivityTypes(new Set());
    setSelectedArtists(new Set());
    setSelectedFormats(new Set());
    setSelectedNetworks(new Set());
    setSelectedFaeBriefing(null);
    setFilterResetNonce((n) => n + 1);
  }, [exitContentPreviewToFilterCanvas, minimizeAllFloatingPanels]);

  const resetToIdle = useCallback(() => {
    clearPendingPreviewFilterSnapshot();
    clearAllFilters();
    setSearchQueryResetNonce((n) => n + 1);
    closeContentPreview();
  }, [clearAllFilters, clearPendingPreviewFilterSnapshot, closeContentPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      resetToIdle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetToIdle]);

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
      selectedArtists,
      selectedFormats,
      selectedNetworks,
      selectedFaeBriefing,
      filterResetNonce,
      searchQueryResetNonce,
      toggleFocusArea,
      toggleActivityType,
      toggleArtist,
      toggleFormat,
      toggleNetwork,
      setSelectedFaeBriefing: setSelectedFaeBriefingCb,
      clearFocusAreas,
      clearActivityTypes,
      clearSelectedArtists,
      clearSelectedFormats,
      clearSelectedNetworks,
      clearAllFilters,
      resetToIdle,
      setFiltersFromContentRow,
      snapshotFiltersBeforeContentPreview,
      restoreFiltersAfterContentPreview,
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
      closeContentPreview,
      registerContentPreviewCloser,
      applyPreviewPillFilterAndClose,
      contentPreviewRow,
      setContentPreviewRow,
      filterMatchingRowCount,
      focusOptionToggleMatchCount,
      activityOptionToggleMatchCount,
      artistOptionToggleMatchCount,
      formatOptionToggleMatchCount,
      networkOptionToggleMatchCount,
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
      selectedArtists,
      selectedFormats,
      selectedNetworks,
      selectedFaeBriefing,
      filterResetNonce,
      searchQueryResetNonce,
      toggleFocusArea,
      toggleActivityType,
      toggleArtist,
      toggleFormat,
      toggleNetwork,
      setSelectedFaeBriefingCb,
      clearFocusAreas,
      clearActivityTypes,
      clearSelectedArtists,
      clearSelectedFormats,
      clearSelectedNetworks,
      clearAllFilters,
      resetToIdle,
      setFiltersFromContentRow,
      snapshotFiltersBeforeContentPreview,
      restoreFiltersAfterContentPreview,
      filtersPanelOpen,
      briefingsSubpanelOpen,
      rdSubpanelOpen,
      networkSubpanelOpen,
      artistsSubpanelOpen,
      filterSubpanelsOpen,
      openContentPreview,
      registerContentPreviewOpener,
      closeContentPreview,
      registerContentPreviewCloser,
      applyPreviewPillFilterAndClose,
      contentPreviewRow,
      filterMatchingRowCount,
      focusOptionToggleMatchCount,
      activityOptionToggleMatchCount,
      artistOptionToggleMatchCount,
      formatOptionToggleMatchCount,
      networkOptionToggleMatchCount,
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
