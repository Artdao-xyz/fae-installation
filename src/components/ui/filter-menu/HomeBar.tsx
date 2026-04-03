import Link from "next/link";
import { FilterMenuHomeIcon } from "./icons/FilterMenuHomeIcon";

export function HomeBar() {
  return (
    <div className="flex h-[40px] shrink-0 items-center border-b-[0.5px] border-solid border-text-primary bg-white-fae px-3">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2 text-text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
      >
        <FilterMenuHomeIcon />
        <span className="truncate font-[ui-serif,Georgia,Cambria,Times_New_Roman,serif] text-sm font-normal leading-none text-text-body">
          Home
        </span>
      </Link>
    </div>
  );
}
