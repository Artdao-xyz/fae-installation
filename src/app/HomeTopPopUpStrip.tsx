"use client";

import { useEffect, useMemo, useState } from "react";
import { PopUp } from "@/components/ui/pop-up";

const SIDEBAR_SELECTOR = "[data-fae-filter-sidebar-root]";
const EXTRA_LEFT_OFFSET_PX = 8;

export function HomeTopPopUpStrip() {
  const [sidebarRightPx, setSidebarRightPx] = useState<number | null>(null);

  useEffect(() => {
    const sidebar = document.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
    if (!sidebar) return;

    const update = () => {
      const rect = sidebar.getBoundingClientRect();
      setSidebarRightPx(rect.right);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(sidebar);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const leftStyle = useMemo(
    () =>
      sidebarRightPx == null
        ? `calc(var(--width-filter-chrome-column) + ${EXTRA_LEFT_OFFSET_PX}px)`
        : `${Math.max(0, Math.round(sidebarRightPx + EXTRA_LEFT_OFFSET_PX))}px`,
    [sidebarRightPx],
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 hidden h-(--inset-margin-guide) bg-[#E9E9E9] lg:block">
      <div className="relative h-full w-full">
        <div
          className="pointer-events-auto absolute top-1/2 -translate-y-1/2"
          style={{ left: leftStyle }}
        >
          <PopUp
            mainContent="Future Art Ecosystems 5"
            secondaryContent="Out now in print"
            cta="Read more"
            url="https://futureartecosystems.org"
          />
        </div>
      </div>
    </div>
  );
}
