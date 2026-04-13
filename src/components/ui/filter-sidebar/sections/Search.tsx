export function Search() {
  return (
    <div className="shrink-0 bg-surface-canvas px-3 py-3">
      <label className="sr-only" htmlFor="filter-search">
        Search
      </label>
      <div className="flex items-center gap-2 border-hairline border-solid border-ink-primary bg-surface-canvas px-2 py-1.5">

        <input
          id="filter-search"
          type="search"
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent font-fira-mono text-xs text-ink-body placeholder:text-ink-body/50 focus:outline-none"
        />
      <img
          src="/svg/search.svg"
          alt=""
          className="size-3 shrink-0 object-contain opacity-70"
          aria-hidden
        />
      </div>

    </div>
  );
}
