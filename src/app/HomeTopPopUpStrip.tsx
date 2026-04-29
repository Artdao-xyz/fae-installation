"use client";

import { PopUp } from "@/components/ui/pop-up";

const EXTRA_LEFT_OFFSET_PX = 8;

export function HomeTopPopUpStrip() {
  const leftStyle = `calc(var(--width-filter-chrome-column) + ${EXTRA_LEFT_OFFSET_PX}px)`;

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
