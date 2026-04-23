"use client";

const SEARCH_ICON_FRAME_CLASS =
  "inline-flex shrink-0 items-center justify-center border-hairline border-dotted border-ink-primary bg-[#ECECEC] p-1";

const CLEAR_SEARCH_ICON_FRAME_CLASS =
  "inline-grid shrink-0 size-[1.5rem] place-items-center border-hairline border-dotted border-ink-primary bg-[#ECECEC] p-0 leading-[0]";

/** Renders the “clear all filters” (refresh) control when `onRefreshFilters` is passed from `Search`. */
const SHOW_FILTER_CLEAR_ALL_BUTTON = true;

export type FilterSearchFieldProps = {
  id: string;
  /** Screen-reader label (matches `id` via `htmlFor`) */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** When set, shows a control that clears global filters (and typically the field via `onChange`). */
  onRefreshFilters?: () => void;
  placeholder?: string;
};

export function FilterSearchField({
  id,
  label,
  value,
  onChange,
  onRefreshFilters,
  placeholder = "Search",
}: FilterSearchFieldProps) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="flex min-w-0 items-center gap-2 border-hairline border-solid border-ink-primary bg-surface-canvas px-2 py-1.5">
        <input
          id={id}
          type="text"
          role="searchbox"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-fira-mono text-xs text-ink-body placeholder:text-ink-body/50 focus:outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className={`${CLEAR_SEARCH_ICON_FRAME_CLASS} transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
            <img
              src="/svg/delete.svg"
              alt=""
              className="block size-4 max-h-4 max-w-4 shrink-0 object-contain object-center m-0"
              aria-hidden
            />
          </button>
        ) : null}
        {SHOW_FILTER_CLEAR_ALL_BUTTON && onRefreshFilters ? (
          <button
            type="button"
            onClick={onRefreshFilters}
            aria-label="Clear all filters"
            className={`${SEARCH_ICON_FRAME_CLASS} transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
            <img
              src="/svg/search.svg"
              alt=""
              className="m-0 block size-4 max-h-4 max-w-4 shrink-0 object-contain object-center"
              aria-hidden
            />
          </button>
        ) : null}
      </div>
    </>
  );
}
