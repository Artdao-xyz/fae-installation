import Link from "next/link";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { navChromeLinkLabelClassName } from "@/components/ui/icons/navChrome";

export function HomeBar() {
  return (
    <div className="flex h-[40px] shrink-0 items-center border-b-[0.5px] border-solid border-text-primary bg-white-fae px-3">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2 text-text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
      >
        <HomeSvgIcon />
        <span className={`truncate ${navChromeLinkLabelClassName}`}>Home</span>
      </Link>
    </div>
  );
}
