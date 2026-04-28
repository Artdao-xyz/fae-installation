"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import {
  MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS,
  MOBILE_OVERLAY_TOP_CLASS,
  MOBILE_OVERLAY_X_CLASS,
} from "@/components/ui/filter-sidebar/shell/layout-classes";
import { GLOSSARY_PANEL_ENTRIES } from "@/data/glossary-panel-content";

type MobileGlossarySheetProps = {
  zIndex: number;
  onClose: () => void;
};

/**
 * `max-lg` glossary: same chrome insets as About / preview (below site header, above dock).
 */
export function MobileGlossarySheet({ zIndex, onClose }: MobileGlossarySheetProps) {
  return (
    <div
      className={`fixed flex h-auto min-h-0 min-w-0 flex-col overflow-hidden bg-surface-canvas lg:hidden ${MOBILE_OVERLAY_TOP_CLASS} ${MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS} ${MOBILE_OVERLAY_X_CLASS}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label="Glossary"
    >
      <div className="flex w-full shrink-0 items-stretch border-b-hairline border-solid border-ink-primary bg-surface-canvas">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          aria-label="Close glossary"
        >
          <OpenSvgIcon className="shrink-0 rotate-90" />
          <span>Close</span>
        </button>
      </div>
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="flex flex-col">
          {GLOSSARY_PANEL_ENTRIES.map((entry, index) => {
            const isLast = index === GLOSSARY_PANEL_ENTRIES.length - 1;
            return (
              <article
                key={entry.id}
                className={`flex flex-col gap-2 pb-4 ${
                  index > 0 ? "pt-4" : ""
                } ${
                  isLast
                    ? ""
                    : "border-b-hairline border-dotted border-ink-primary"
                }`}
              >
                <h3 className="m-0 w-fit max-w-full self-start border-b-hairline border-r-hairline border-dotted border-ink-primary bg-white px-2 py-1 font-fira-mono text-xs font-normal leading-5 text-ink-body">
                  {entry.term}
                </h3>
                <p className="m-0 font-suisseintl text-xs font-normal leading-[1.6] tracking-[0.36px] text-ink-body">
                  {entry.definition}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
