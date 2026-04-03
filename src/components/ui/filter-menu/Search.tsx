export function Search() {
  return (
    <div className="bg-white-fae px-3 py-3">
      <label className="sr-only" htmlFor="filter-search">
        Search
      </label>
      <div className="flex items-center gap-2 border-[0.5px] border-solid border-text-primary bg-white-fae px-2 py-1.5">

        <input
          id="filter-search"
          type="search"
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-text-body placeholder:text-text-body/50 focus:outline-none"
        />
      <img
          src="/svg/search.svg"
          alt=""
          width={12}
          height={12}
          className="shrink-0 opacity-70"
          aria-hidden
        />
      </div>

    </div>
  );
}
