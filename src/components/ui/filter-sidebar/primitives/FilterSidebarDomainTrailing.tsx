import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";

type FilterSidebarDomainTrailingProps = {
  tone: FilterSidebarCategoryTone;
  /** Shorter row (e.g. filter search active) — smaller hit target; viewBox unchanged. */
  compact?: boolean;
};

/** Right-hand bracket motif (FAE filter domain rows): idle vs hover/selected with highlight sparkle. */
export function FilterSidebarDomainTrailing({
  tone,
  compact = false,
}: FilterSidebarDomainTrailingProps) {
  const bracketAccentMarkerClass = toneAccentClass[tone].marker;
  /** Wide viewBox spreads brackets horizontally and clears room around center sparkle */
  const viewBox = "0 0 26 20";
  const bracketPolylines = (
    <>
      <polyline
        points="8,3 5,3 5,17 8,17"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      <polyline
        points="18,3 21,3 21,17 18,17"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </>
  );

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${compact ? "size-5" : "size-6"}`}
    >
      {/* Idle: brackets only */}
      <svg
        viewBox={viewBox}
        fill="none"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-0 block size-full text-ink-body opacity-100 transition-opacity group-hover:opacity-0 group-data-[domain-active=true]:opacity-0"
      >
        {bracketPolylines}
      </svg>
      {/* Hover / selected: brackets + sparkle (highlight color) */}
      <svg
        viewBox={viewBox}
        fill="none"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
        className={`pointer-events-none absolute inset-0 block size-full opacity-0 transition-opacity group-hover:opacity-100 group-data-[domain-active=true]:opacity-100 ${bracketAccentMarkerClass}`}
      >
        {bracketPolylines}
        <g transform="translate(9 6)">
          <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
            <path
              d="M3.21604 3.01192C4.01796 2.21 4.4024 0.669841 4.49438 0C4.67642 0.738925 5.0283 2.20458 5.84633 3.02261C6.66436 3.84064 8.34221 4.40471 8.97053 4.47614C8.29014 4.66896 6.87253 5.00042 6.03853 5.83442C5.20454 6.66841 4.54749 8.27166 4.47589 8.97078C4.3926 8.24597 4.12239 6.80518 3.09308 5.77587C2.06377 4.74656 0.551962 4.54343 3.31942e-05 4.49493C0.687694 4.38513 2.41412 3.81384 3.21604 3.01192Z"
              fill="currentColor"
            />
          </svg>
        </g>
      </svg>
    </span>
  );
}
