"use client";

import {
  filterFramedRoundedInnerClass,
  filterPillSingleLayerBrightnessHoverClass,
} from "./filterFramedClasses";

const CLEAR_SEARCH_BUTTON_CLASS =
  "inline-flex shrink-0 items-center justify-center p-1 leading-[0] text-ink-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary";

export type FilterSearchFieldProps = {
  id: string;
  /** Screen-reader label (matches `id` via `htmlFor`) */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function FilterSearchField({
  id,
  label,
  value,
  onChange,
  placeholder = "Search",
}: FilterSearchFieldProps) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div
        className={`fae-control-filter-outer inline-flex w-full min-w-0 max-w-full items-stretch ${filterPillSingleLayerBrightnessHoverClass} focus-within:outline-none focus-within:ring-1 focus-within:ring-ink-primary focus-within:ring-offset-0`}
      >
        <div
          className={`${filterFramedRoundedInnerClass(false)} flex min-w-0 flex-1 items-center gap-2 text-left !text-sm whitespace-normal`}
        >
          <input
            id={id}
            type="text"
            role="searchbox"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent font-fira-mono text-sm leading-5 text-ink-body placeholder:text-sm placeholder:leading-5 placeholder:text-ink-body/50 focus:outline-none"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className={CLEAR_SEARCH_BUTTON_CLASS}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
              <img
                src="/svg/delete.svg"
                alt=""
                className="m-0 block size-4 max-h-4 max-w-4 shrink-0 object-contain object-center"
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
