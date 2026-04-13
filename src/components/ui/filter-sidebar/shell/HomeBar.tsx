import Link from "next/link";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

export function HomeBar() {
  return (
    <div className="flex h-filter-top-bar shrink-0 items-center border-b-hairline border-solid border-ink-primary bg-surface-canvas px-3">
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2 text-ink-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
      >
        <HomeSvgIcon />
        <span className={`truncate ${navSidebarLinkLabelClassName}`}>Home</span>
      </Link>
    </div>
  );
}
