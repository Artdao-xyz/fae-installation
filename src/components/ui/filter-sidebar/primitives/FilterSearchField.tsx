"use client";

import { RefreshCw } from "lucide-react";

const SEARCH_ICON_FRAME_CLASS =
  "inline-flex shrink-0 items-center justify-center border-hairline border-dotted border-ink-primary bg-[#ffffff] p-1";

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
            className={`${SEARCH_ICON_FRAME_CLASS} transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
            <img
              src="/svg/delete.svg"
              alt=""
              className="size-3 shrink-0 object-contain"
              aria-hidden
            />
          </button>
        ) : null}
        {onRefreshFilters ? (
          <button
            type="button"
            onClick={onRefreshFilters}
            aria-label="Clear all filters"
            className={`${SEARCH_ICON_FRAME_CLASS} text-ink-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary`}
          >
            <RefreshCw className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
        <span className={SEARCH_ICON_FRAME_CLASS} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
          <img
            src="/svg/search.svg"
            alt=""
            className="size-3 shrink-0 object-contain opacity-70"
          />
        </span>
      </div>
    </>
  );
}
