import Link from "next/link";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { filterChromeRightEdgeClass } from "./layout-classes";

type HomeBarProps = {
  className?: string;
  mergeWithSubpanel?: boolean;
};

export function HomeBar({
  className = "",
  mergeWithSubpanel = false,
}: HomeBarProps) {
  return (
    <div
      className={`flex h-filter-chrome-bar shrink-0 items-center border-b-hairline border-solid border-ink-primary bg-surface-canvas px-3 ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
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
