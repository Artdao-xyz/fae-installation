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
  rowMatchesFilterSelection,
  toggledSet,
  type FilterMatchMode,
  type TaxonomyFilterSelection,
} from "@/lib/filter-row-match";
import {
  fetchPreviewOutputDetail,
  mergePreviewRowWithDetail,
} from "@/lib/preview-output-detail";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FAE_BRIEFING_OPTIONS } from "./domains/briefings/constants";

/** Sidebar availability hints use the same AND semantics as the default particle spread. */
const SIDEBAR_FILTER_MATCH_MODE: FilterMatchMode = "intersection";

/** Fellowships / R&D / Briefings toolbar rows (`lg` filter chrome); click handles future actions and does not open domain subpanels. */
export type DesktopDomainMenuSelectionId =
  | "fellowships"
  | "rd"
  | "briefings";

/** Matches Tailwind `lg` (64rem). Auto-opening the filter column is desktop-only; mobile sheet stays closed until the user taps Filters. */
function shouldAutoOpenFiltersPanel(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export type ContentCatalogStatus = "loading" | "success" | "error";

export type FilterSelectionContextValue = {
  /** Full Strapi-backed catalog from `GET /api/strapi/outputs` (all pages); not truncated by particle `imageLimit`. */
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
  /** Shared query: filter options panel (`lg+`) and landing `main` search (`max-lg`). */
  filterSearchQuery: string;
  setFilterSearchQuery: Dispatch<SetStateAction<string>>;
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
  /**
   * Clears all taxonomy + briefing, collapses domain subpanels, minimizes floating panels, and bumps
   * `filterResetNonce` for any remaining local UIs.
   */
  clearAllFilters: () => void;
  /**
   * Clears all filters, closes domain subpanels, closes the content preview, clears the search string
   * (see `searchQueryResetNonce`), and returns the canvas to idle. Bound to breadcrumb reset, Escape,
   * and empty-canvas click from `ImageParticleSimulationView`.
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
  fellowshipsSubpanelOpen: boolean;
  setFellowshipsSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  networkSubpanelOpen: boolean;
  setNetworkSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  artistsSubpanelOpen: boolean;
  setArtistsSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  subscribeSubpanelOpen: boolean;
  setSubscribeSubpanelOpen: Dispatch<SetStateAction<boolean>>;
  /**
   * Which desktop domain toolbar row (`Fellowships` / `R&D` / `Briefings`) is toggled on.
   * Single selection among the three (`null` = none).
   */
  selectedDesktopDomainMenuId: DesktopDomainMenuSelectionId | null;
  toggleDesktopDomainMenuSelection: (id: DesktopDomainMenuSelectionId) => void;
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
  /** True when any taxonomy dimension has a selection (same notion as particle “filtered” spread). */
  hasActiveTaxonomyFilters: boolean;
  /**
   * Catalog rows matching current filters. Empty when `!hasActiveTaxonomyFilters` so we do not hold the full catalog.
   */
  filterMatchingCatalogRows: ContentRow[];
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
  const fallbackPreviewRequestIdRef = useRef(0);

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
        const outputsInit = fetch("/api/strapi/outputs", {
          credentials: "same-origin",
        });
        const taxonomyInit = fetch("/api/strapi/taxonomy-options", {
          credentials: "same-origin",
        });

        const [res, taxRes] = await Promise.all([outputsInit, taxonomyInit]);
        const [body, taxBodyRaw]: [unknown, unknown] = await Promise.all([
          res.json(),
          taxRes.json(),
        ]);

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
          if (cancelled) return;

          const taxBody: unknown = taxRes.ok ? taxBodyRaw : null;

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

        if (!cancelled && shouldAutoOpenFiltersPanel()) setFiltersPanelOpen(true);
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

  /** Starts closed; opens after catalog + taxonomy load only at `lg+` (see `shouldAutoOpenFiltersPanel`). */
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [briefingsSubpanelOpen, setBriefingsSubpanelOpen] = useState(false);
  const [rdSubpanelOpen, setRdSubpanelOpen] = useState(false);
  const [fellowshipsSubpanelOpen, setFellowshipsSubpanelOpen] =
    useState(false);
  const [networkSubpanelOpen, setNetworkSubpanelOpen] = useState(false);
  const [artistsSubpanelOpen, setArtistsSubpanelOpen] = useState(false);
  const [subscribeSubpanelOpen, setSubscribeSubpanelOpen] = useState(false);
  const filterSubpanelsOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    fellowshipsSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen ||
    subscribeSubpanelOpen;

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
  const [selectedDesktopDomainMenuId, setSelectedDesktopDomainMenuId] =
    useState<DesktopDomainMenuSelectionId | null>(null);

  const toggleDesktopDomainMenuSelection = useCallback(
    (id: DesktopDomainMenuSelectionId) => {
      setSelectedDesktopDomainMenuId((prev) => (prev === id ? null : id));
    },
    [],
  );

  useEffect(() => {
    if (FAE_BRIEFING_OPTIONS.length === 0) {
      setSelectedFaeBriefing(null);
    }
  }, [setSelectedFaeBriefing]);

  const [filterResetNonce, setFilterResetNonce] = useState(0);
  const [searchQueryResetNonce, setSearchQueryResetNonce] = useState(0);
  const [filterSearchQuery, setFilterSearchQuery] = useState("");

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

  const hasActiveTaxonomyFilters = useMemo(
    () =>
      selectedFocusAreas.size > 0 ||
      selectedActivityTypes.size > 0 ||
      selectedArtists.size > 0 ||
      selectedFormats.size > 0 ||
      selectedNetworks.size > 0,
    [
      selectedFocusAreas,
      selectedActivityTypes,
      selectedArtists,
      selectedFormats,
      selectedNetworks,
    ],
  );

  const filterMatchingCatalogRows = useMemo(() => {
    if (!hasActiveTaxonomyFilters) return [];
    return contentCatalog.filter((row) =>
      rowMatchesFilterSelection(
        row,
        taxonomySelection,
        SIDEBAR_FILTER_MATCH_MODE,
      ),
    );
  }, [contentCatalog, taxonomySelection, hasActiveTaxonomyFilters]);

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
      const nextArtists = selectedArtists.has(label)
        ? new Set<string>()
        : new Set<string>([label]);
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
      const nextFormats = selectedFormats.has(label)
        ? new Set<string>()
        : new Set<string>([label]);
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
      const nextNetworks = selectedNetworks.has(label)
        ? new Set<string>()
        : new Set<string>([label]);
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
      setSelectedArtists(new Set((row.artists ?? []).slice(0, 1)));
      setSelectedFormats(new Set((row.formats ?? []).slice(0, 1)));
      setSelectedNetworks(new Set((row.networks ?? []).slice(0, 1)));
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
    setSelectedFormats(new Set(snap.formats.slice(0, 1)));
    setSelectedNetworks(new Set(snap.networks));
    setSelectedFaeBriefing(snap.faeBriefing);
  }, [minimizeAllFloatingPanels]);

  const openContentPreview = useCallback(
    (row: ContentRow) => {
      minimizeAllFloatingPanels();
      const openViaCanvas = contentPreviewOpenerRef.current;
      if (openViaCanvas) {
        openViaCanvas(row);
        return;
      }
      const requestId = ++fallbackPreviewRequestIdRef.current;
      setContentPreviewRow(row);
      void fetchPreviewOutputDetail(row.id).then((full) => {
        if (!full || fallbackPreviewRequestIdRef.current !== requestId) return;
        setContentPreviewRow((prev) =>
          prev?.id === row.id ? mergePreviewRowWithDetail(prev, full) : prev,
        );
      });
    },
    [minimizeAllFloatingPanels],
  );

  const registerContentPreviewOpener = useCallback(
    (fn: ((row: ContentRow) => void) | null) => {
      contentPreviewOpenerRef.current = fn;
    },
    [],
  );

  const closeContentPreview = useCallback(() => {
    const closeViaCanvas = contentPreviewCloserRef.current;
    if (closeViaCanvas) {
      closeViaCanvas();
      return;
    }
    fallbackPreviewRequestIdRef.current += 1;
    setContentPreviewRow(null);
  }, []);

  const registerContentPreviewCloser = useCallback((fn: (() => void) | null) => {
    contentPreviewCloserRef.current = fn;
  }, []);

  const applyPreviewPillFilterAndClose = useCallback(() => {
    clearPendingPreviewFilterSnapshot();
    if (shouldAutoOpenFiltersPanel()) setFiltersPanelOpen(true);
    closeContentPreview();
  }, [clearPendingPreviewFilterSnapshot, setFiltersPanelOpen, closeContentPreview]);

  /**
   * When the user changes a sidebar / subpanel filter while content preview is open, clear
   * the pre-preview snapshot (so we do not restore filters and undo their change) and close
   * the preview so the canvas shows the new filter result set.
   */
  const endContentPreviewOnSidebarFilterChange = useCallback(() => {
    if (contentPreviewRowRef.current == null) return;
    clearPendingPreviewFilterSnapshot();
    closeContentPreview();
  }, [clearPendingPreviewFilterSnapshot, closeContentPreview]);

  const toggleFocusArea = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      endContentPreviewOnSidebarFilterChange();
      setSelectedFocusAreas((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [endContentPreviewOnSidebarFilterChange, minimizeAllFloatingPanels],
  );

  const toggleActivityType = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      endContentPreviewOnSidebarFilterChange();
      setSelectedActivityTypes((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    },
    [endContentPreviewOnSidebarFilterChange, minimizeAllFloatingPanels],
  );

  const toggleArtist = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      endContentPreviewOnSidebarFilterChange();
      setSelectedArtists((prev) => {
        return prev.has(label) ? new Set<string>() : new Set<string>([label]);
      });
    },
    [endContentPreviewOnSidebarFilterChange, minimizeAllFloatingPanels],
  );

  const toggleFormat = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      endContentPreviewOnSidebarFilterChange();
      setSelectedFormats((prev) => {
        return prev.has(label) ? new Set<string>() : new Set<string>([label]);
      });
    },
    [endContentPreviewOnSidebarFilterChange, minimizeAllFloatingPanels],
  );

  const toggleNetwork = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      endContentPreviewOnSidebarFilterChange();
      setSelectedNetworks((prev) => {
        return prev.has(label) ? new Set<string>() : new Set<string>([label]);
      });
    },
    [endContentPreviewOnSidebarFilterChange, minimizeAllFloatingPanels],
  );

  const setSelectedFaeBriefingCb = useCallback(
    (label: string | null) => {
      minimizeAllFloatingPanels();
      endContentPreviewOnSidebarFilterChange();
      setSelectedFaeBriefing(label);
    },
    [endContentPreviewOnSidebarFilterChange, minimizeAllFloatingPanels],
  );

  const exitContentPreviewToFilterCanvas = useCallback(() => {
    if (contentPreviewRow == null) return;
    clearPendingPreviewFilterSnapshot();
    if (shouldAutoOpenFiltersPanel()) setFiltersPanelOpen(true);
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

  const hasResettableFilterState =
    contentPreviewRow != null ||
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    fellowshipsSubpanelOpen ||
    networkSubpanelOpen ||
    artistsSubpanelOpen ||
    subscribeSubpanelOpen ||
    selectedFocusAreas.size > 0 ||
    selectedActivityTypes.size > 0 ||
    selectedArtists.size > 0 ||
    selectedFormats.size > 0 ||
    selectedNetworks.size > 0 ||
    selectedFaeBriefing != null ||
    selectedDesktopDomainMenuId != null ||
    filterSearchQuery.length > 0;

  const clearAllFilters = useCallback(() => {
    if (!hasResettableFilterState) return;
    exitContentPreviewToFilterCanvas();
    minimizeAllFloatingPanels();
    setBriefingsSubpanelOpen(false);
    setRdSubpanelOpen(false);
    setFellowshipsSubpanelOpen(false);
    setNetworkSubpanelOpen(false);
    setArtistsSubpanelOpen(false);
    setSubscribeSubpanelOpen(false);
    setSelectedFocusAreas(new Set());
    setSelectedActivityTypes(new Set());
    setSelectedArtists(new Set());
    setSelectedFormats(new Set());
    setSelectedNetworks(new Set());
    setSelectedFaeBriefing(null);
    setSelectedDesktopDomainMenuId(null);
    setFilterSearchQuery("");
    setFilterResetNonce((n) => n + 1);
  }, [
    hasResettableFilterState,
    exitContentPreviewToFilterCanvas,
    minimizeAllFloatingPanels,
  ]);

  const resetToIdle = useCallback(() => {
    if (!hasResettableFilterState) return;
    clearPendingPreviewFilterSnapshot();
    clearAllFilters();
    setSearchQueryResetNonce((n) => n + 1);
    closeContentPreview();
  }, [
    hasResettableFilterState,
    clearAllFilters,
    clearPendingPreviewFilterSnapshot,
    closeContentPreview,
  ]);

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
      filterSearchQuery,
      setFilterSearchQuery,
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
      fellowshipsSubpanelOpen,
      setFellowshipsSubpanelOpen,
      networkSubpanelOpen,
      setNetworkSubpanelOpen,
      artistsSubpanelOpen,
      setArtistsSubpanelOpen,
      subscribeSubpanelOpen,
      setSubscribeSubpanelOpen,
      selectedDesktopDomainMenuId,
      toggleDesktopDomainMenuSelection,
      filterSubpanelsOpen,
      openContentPreview,
      registerContentPreviewOpener,
      closeContentPreview,
      registerContentPreviewCloser,
      applyPreviewPillFilterAndClose,
      contentPreviewRow,
      setContentPreviewRow,
      filterMatchingRowCount,
      hasActiveTaxonomyFilters,
      filterMatchingCatalogRows,
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
      filterSearchQuery,
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
      fellowshipsSubpanelOpen,
      networkSubpanelOpen,
      artistsSubpanelOpen,
      subscribeSubpanelOpen,
      selectedDesktopDomainMenuId,
      toggleDesktopDomainMenuSelection,
      filterSubpanelsOpen,
      openContentPreview,
      registerContentPreviewOpener,
      closeContentPreview,
      registerContentPreviewCloser,
      applyPreviewPillFilterAndClose,
      contentPreviewRow,
      filterMatchingRowCount,
      hasActiveTaxonomyFilters,
      filterMatchingCatalogRows,
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
