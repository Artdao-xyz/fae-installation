"use client";

import { useCallback, useId, type ReactElement } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { SubscribeSubpanelColumn } from "../domains/subscribe/SubscribeSubpanelColumn";
import { SubscribeMenu } from "../sections/SubscribeMenu";
import { FilterOptionsPanel } from "./FilterOptionsPanel";
import { FilterSubpanelsColumn } from "./FilterSubpanelsColumn";
import { Footer } from "./Footer";
import { HomeBar } from "./HomeBar";
import { MobileFiltersBar } from "./MobileFiltersBar";
import { MobileFiltersCloseHeader } from "./MobileFiltersCloseHeader";
import { MobileLatestUpdatesStrip } from "./MobileLatestUpdatesStrip";
import {
  FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS,
  FILTER_SIDEBAR_COLUMN_CLASS,
  FILTER_SIDEBAR_COLUMN_COLLAPSED_CLASS,
  MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS,
  MOBILE_OVERLAY_TOP_CLASS,
  MOBILE_OVERLAY_X_CLASS,
} from "./layout-classes";
import { InstallationSidebarActions } from "@/components/session-receipt/InstallationSidebarActions";
import { SideBar } from "./SideBar";
import { isInstallationMode } from "@/lib/installation-mode";
import { useIsMaxLg } from "./useIsMaxLg";

export function FilterSidebar() {
  const {
    filtersPanelOpen: filtersOpen,
    setFiltersPanelOpen: setFiltersOpen,
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
    hasActiveTaxonomyFilters,
    selectedFaeBriefing,
    clearAllFilters,
    contentPreviewRow,
    filterSearchQuery,
  } = useFilterSelection();
  const panelId = useId();
  const isMaxLg = useIsMaxLg();
  const installation = isInstallationMode();
  const installationDesktopSearching =
    installation &&
    !isMaxLg &&
    filterSearchQuery.trim().length > 0;

  const anySubpanelOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    fellowshipsSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen;

  const toggleFiltersOpen = useCallback(() => {
    setFiltersOpen((open) => {
      const next = !open;
      if (!next) {
        setBriefingsSubpanelOpen(false);
        setRdSubpanelOpen(false);
        setFellowshipsSubpanelOpen(false);
        setArtistsSubpanelOpen(false);
        setNetworkSubpanelOpen(false);
        setSubscribeSubpanelOpen(false);
      }
      return next;
    });
  }, [
    setFiltersOpen,
    setBriefingsSubpanelOpen,
    setRdSubpanelOpen,
    setFellowshipsSubpanelOpen,
    setArtistsSubpanelOpen,
    setNetworkSubpanelOpen,
    setSubscribeSubpanelOpen,
  ]);

  const subpanelsColumn: ReactElement | null = installation ? null : (
    <FilterSubpanelsColumn
      filtersPanelOpen={filtersOpen}
      anySubpanelOpen={anySubpanelOpen}
      briefingsSubpanelOpen={briefingsSubpanelOpen}
      rdSubpanelOpen={rdSubpanelOpen}
      fellowshipsSubpanelOpen={fellowshipsSubpanelOpen}
      artistsSubpanelOpen={artistsSubpanelOpen}
      networkSubpanelOpen={networkSubpanelOpen}
      onCloseBriefings={() => setBriefingsSubpanelOpen(false)}
      onCloseRd={() => setRdSubpanelOpen(false)}
      onCloseFellowships={() => setFellowshipsSubpanelOpen(false)}
      onCloseArtists={() => setArtistsSubpanelOpen(false)}
      onCloseNetwork={() => setNetworkSubpanelOpen(false)}
    />
  );

  const showOptionsPanel = !isMaxLg || filtersOpen;
  const hasSelectedFilters =
    hasActiveTaxonomyFilters || selectedFaeBriefing != null;
  const showMobileSelectedFiltersChrome =
    hasSelectedFilters && contentPreviewRow == null;

  const installationDesktopChrome = installation;

  const filterChromeRow = (
    <>
      <div
        className={`relative hidden shrink-0 lg:flex lg:min-h-0 lg:flex-col ${
          installation
            ? installationDesktopSearching
              ? "h-full self-stretch"
              : "self-stretch"
            : "h-full min-h-0 self-stretch"
        }`}
      >
        <SideBar
          filtersOpen={filtersOpen}
          onToggleFilters={toggleFiltersOpen}
          filterPanelId={panelId}
          showTopBorder={installationDesktopChrome}
          fillHeight
        />
      </div>
      <div
        className={`shrink-0 overflow-hidden ${FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS} max-lg:min-w-0 ${
          filtersOpen
            ? `w-filter-options max-lg:w-full max-lg:flex-1 opacity-100 ${
                installation
                  ? installationDesktopSearching
                    ? "h-full min-h-0 self-stretch"
                    : "min-h-0 self-stretch"
                  : "h-full min-h-0"
              }`
            : installation
              ? "pointer-events-none invisible w-0 opacity-0 max-lg:h-0 max-lg:w-0"
              : "pointer-events-none h-0 w-0 max-lg:w-0 opacity-0"
        }`}
        aria-hidden={installation && !filtersOpen ? true : undefined}
      >
        <div
          className={`w-filter-options min-w-0 overflow-hidden max-lg:w-full ${
            filtersOpen || !installation ? "h-full min-h-0" : ""
          }`}
        >
          {showOptionsPanel ? (
            <FilterOptionsPanel
              panelId={panelId}
              briefingsSubpanelOpen={briefingsSubpanelOpen}
              rdSubpanelOpen={rdSubpanelOpen}
              fellowshipsSubpanelOpen={fellowshipsSubpanelOpen}
              artistsSubpanelOpen={artistsSubpanelOpen}
              networkSubpanelOpen={networkSubpanelOpen}
              onToggleArtistsSubpanel={() =>
                setArtistsSubpanelOpen((open) => {
                  const next = !open;
                  if (next) setSubscribeSubpanelOpen(false);
                  return next;
                })
              }
              onToggleNetworkSubpanel={() =>
                setNetworkSubpanelOpen((open) => {
                  const next = !open;
                  if (next) setSubscribeSubpanelOpen(false);
                  return next;
                })
              }
            />
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <>
    <div
      className="relative z-40 flex h-screen min-h-0 w-auto min-w-0 shrink-0 flex-row items-stretch overflow-visible"
      data-fae-filter-sidebar-root
    >
      <div
        className={`z-50 flex h-full min-h-0 flex-col items-stretch self-stretch overflow-visible ${
          filtersOpen
            ? FILTER_SIDEBAR_COLUMN_CLASS
            : FILTER_SIDEBAR_COLUMN_COLLAPSED_CLASS
        } ${
          filtersOpen
            ? /** `h-full` + `fixed` + `top`/`bottom` makes browsers ignore `bottom` (full viewport). */
              `max-lg:fixed max-lg:z-50 max-lg:h-auto max-lg:min-h-0 max-lg:w-full max-lg:min-w-0 max-lg:max-w-none max-lg:shrink-0 max-lg:transition-none ${MOBILE_OVERLAY_TOP_CLASS} ${MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS} ${MOBILE_OVERLAY_X_CLASS}`
            : "max-lg:hidden"
        }`}
      >
        {isMaxLg && filtersOpen ? (
          <MobileFiltersCloseHeader onClose={toggleFiltersOpen} />
        ) : null}
        <HomeBar
          className={`max-lg:hidden ${FILTER_SIDEBAR_COLUMN_CLASS}`}
          mergeWithSubpanel={anySubpanelOpen}
        />
        <div
          className={
            installation
              ? installationDesktopSearching
                ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                : "flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-visible"
              : `flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden transition-colors duration-500 ease-in-out motion-reduce:transition-none ${
                  filtersOpen ? "bg-surface-canvas" : "bg-transparent"
                }`
          }
        >
          {installation ? (
            <div
              className={`flex min-h-0 flex-row items-stretch ${
                installationDesktopSearching
                  ? "min-h-0 flex-1 overflow-hidden"
                  : "shrink-0 overflow-visible"
              }`}
            >
              {filterChromeRow}
            </div>
          ) : (
            <>
              {filterChromeRow}
              <div className="min-h-0 min-w-0 flex-1 max-lg:hidden" aria-hidden />
            </>
          )}
        </div>
        <div className={`relative shrink-0 max-lg:hidden ${FILTER_SIDEBAR_COLUMN_CLASS}`}>
          {installation ? <InstallationSidebarActions /> : null}
          <Footer mergeWithSubpanel={installation ? false : anySubpanelOpen} />
          {installation ? null : (
            <>
              <div className="absolute inset-y-0 left-full w-filter-options">
                <SubscribeMenu
                  subpanelOpen={subscribeSubpanelOpen}
                  onToggleSubpanel={() =>
                    setSubscribeSubpanelOpen((open) => {
                      const next = !open;
                      if (next) {
                        setArtistsSubpanelOpen(false);
                        setNetworkSubpanelOpen(false);
                      }
                      return next;
                    })
                  }
                />
              </div>
              <div
                className={`absolute bottom-full left-full w-filter-options overflow-hidden border-r-hairline border-t-hairline border-solid border-border bg-surface-canvas transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
                  subscribeSubpanelOpen && !filtersOpen ? "border-l-hairline" : ""
                } ${
                  subscribeSubpanelOpen
                    ? "max-h-[calc(100dvh-var(--inset-margin-guide))] opacity-100"
                    : "pointer-events-none max-h-0 opacity-0"
                }`}
                aria-hidden={!subscribeSubpanelOpen}
              >
                <SubscribeSubpanelColumn mergeTopBorder />
              </div>
            </>
          )}
        </div>
      </div>
      {subpanelsColumn ? (
        <div className="contents max-lg:hidden">{subpanelsColumn}</div>
      ) : null}
      <div className="contents lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
          {installation || filtersOpen || hasSelectedFilters ? null : (
            <MobileLatestUpdatesStrip />
          )}
          <div className="flex w-full shrink-0 flex-col bg-surface-canvas">
            {filtersOpen || contentPreviewRow != null ? null : (
              <MobileFiltersBar onOpen={toggleFiltersOpen} />
            )}
            {!filtersOpen && showMobileSelectedFiltersChrome ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex h-13 w-full items-center justify-center gap-2 border-t-hairline border-solid border-border bg-surface-canvas px-3 font-lust-text text-sm leading-4 tracking-wide text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local static icon asset */}
                <img
                  src="/svg/delete.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 shrink-0"
                  aria-hidden
                />
                Clear Filters
              </button>
            ) : null}
            <Footer showYear={false} mergeWithSubpanel={false} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
