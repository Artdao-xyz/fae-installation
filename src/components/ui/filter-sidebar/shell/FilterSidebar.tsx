"use client";

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import { FilterOptionsPanel } from "./FilterOptionsPanel";
import { FilterSubpanelsColumn } from "./FilterSubpanelsColumn";
import { Footer } from "./Footer";
import { HomeBar } from "./HomeBar";
import { FILTER_SIDEBAR_COLUMN_CLASS } from "./layout-classes";
import { MobileFiltersBar } from "./MobileFiltersBar";
import { MobileFiltersCloseHeader } from "./MobileFiltersCloseHeader";
import { SideBar } from "./SideBar";

function subscribeMaxLg(onChange: () => void) {
  const mq = window.matchMedia("(max-width: 1023px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMaxLgSnapshot() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

/** Desktop-first SSR snapshot; client corrects after hydration. */
function getMaxLgServerSnapshot() {
  return false;
}

export function FilterSidebar() {
  const isMaxLg = useSyncExternalStore(
    subscribeMaxLg,
    getMaxLgSnapshot,
    getMaxLgServerSnapshot,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [briefingsSubpanelOpen, setBriefingsSubpanelOpen] = useState(false);
  const [rdSubpanelOpen, setRdSubpanelOpen] = useState(false);
  const [networkSubpanelOpen, setNetworkSubpanelOpen] = useState(false);
  const panelId = useId();

  const anySubpanelOpen =
    briefingsSubpanelOpen || rdSubpanelOpen || networkSubpanelOpen;

  /** Only one domain subpanel open at a time (Briefings vs R&D vs Network). */
  const onToggleBriefingsSubpanel = useCallback(() => {
    setBriefingsSubpanelOpen((o) => {
      const next = !o;
      if (next) {
        setRdSubpanelOpen(false);
        setNetworkSubpanelOpen(false);
      }
      return next;
    });
  }, []);

  const onToggleRdSubpanel = useCallback(() => {
    setRdSubpanelOpen((o) => {
      const next = !o;
      if (next) {
        setBriefingsSubpanelOpen(false);
        setNetworkSubpanelOpen(false);
      }
      return next;
    });
  }, []);

  const onToggleNetworkSubpanel = useCallback(() => {
    setNetworkSubpanelOpen((o) => {
      const next = !o;
      if (next) {
        setBriefingsSubpanelOpen(false);
        setRdSubpanelOpen(false);
      }
      return next;
    });
  }, []);

  const toggleFiltersOpen = useCallback(() => {
    setFiltersOpen((open) => {
      const next = !open;
      if (!next) {
        setBriefingsSubpanelOpen(false);
        setRdSubpanelOpen(false);
        setNetworkSubpanelOpen(false);
      }
      return next;
    });
  }, []);

  return (
    <div className="relative flex h-screen min-h-0 shrink-0 overflow-hidden z-50 w-auto min-w-0">
      {/* `lg+`: fixed-width column. `max-lg`: full-screen only while filters overlay is open. */}
      <div
        className={`z-50 flex h-full min-h-0 flex-col items-stretch self-stretch overflow-hidden ${FILTER_SIDEBAR_COLUMN_CLASS} ${
          filtersOpen
            ? "max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-[100dvh] max-lg:min-h-0 max-lg:w-full max-lg:min-w-0 max-lg:max-w-none max-lg:shrink-0 max-lg:transition-none"
            : "max-lg:hidden"
        }`}
      >
        {isMaxLg && filtersOpen ? (
          <MobileFiltersCloseHeader onClose={toggleFiltersOpen} />
        ) : null}
        <HomeBar className="max-lg:hidden" mergeWithSubpanel={anySubpanelOpen} />
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden ${
            filtersOpen ? "bg-surface-canvas" : "bg-transparent"
          }`}
        >
          <div className="hidden h-full min-h-0 shrink-0 lg:block">
            <SideBar
              filtersOpen={filtersOpen}
              onToggleFilters={toggleFiltersOpen}
              filterPanelId={panelId}
            />
          </div>
          {filtersOpen ? (
            <FilterOptionsPanel
              panelId={panelId}
              briefingsSubpanelOpen={briefingsSubpanelOpen}
              rdSubpanelOpen={rdSubpanelOpen}
              networkSubpanelOpen={networkSubpanelOpen}
              onToggleBriefingsSubpanel={onToggleBriefingsSubpanel}
              onToggleRdSubpanel={onToggleRdSubpanel}
              onToggleNetworkSubpanel={onToggleNetworkSubpanel}
              onCloseBriefings={() => setBriefingsSubpanelOpen(false)}
              onCloseRd={() => setRdSubpanelOpen(false)}
              onCloseNetwork={() => setNetworkSubpanelOpen(false)}
              mobileSubpanelsColumn={
                isMaxLg ? (
                  <FilterSubpanelsColumn
                    className="w-full min-w-0 max-w-none"
                    anySubpanelOpen={anySubpanelOpen}
                    briefingsSubpanelOpen={briefingsSubpanelOpen}
                    rdSubpanelOpen={rdSubpanelOpen}
                    networkSubpanelOpen={networkSubpanelOpen}
                    onCloseBriefings={() => setBriefingsSubpanelOpen(false)}
                    onCloseRd={() => setRdSubpanelOpen(false)}
                    onCloseNetwork={() => setNetworkSubpanelOpen(false)}
                  />
                ) : null
              }
            />
          ) : null}
        </div>
        <Footer className="max-lg:hidden" mergeWithSubpanel={anySubpanelOpen} />
      </div>
      {filtersOpen && !isMaxLg ? (
        <FilterSubpanelsColumn
          anySubpanelOpen={anySubpanelOpen}
          briefingsSubpanelOpen={briefingsSubpanelOpen}
          rdSubpanelOpen={rdSubpanelOpen}
          networkSubpanelOpen={networkSubpanelOpen}
          onCloseBriefings={() => setBriefingsSubpanelOpen(false)}
          onCloseRd={() => setRdSubpanelOpen(false)}
          onCloseNetwork={() => setNetworkSubpanelOpen(false)}
        />
      ) : null}

      {isMaxLg && !filtersOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col border-t-hairline border-solid border-ink-primary bg-surface-canvas lg:hidden">
          <MobileFiltersBar onOpen={toggleFiltersOpen} />
          <Footer showYear={false} mergeWithSubpanel={false} />
        </div>
      ) : null}
    </div>
  );
}
