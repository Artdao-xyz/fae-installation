import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { filterPillSelection } from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { filterChromeRightEdgeClass } from "./layout-classes";

const breadcrumbArrowImgClassName =
  "pointer-events-none block h-2 w-[6px] shrink-0 object-contain select-none opacity-80";

const breadcrumbFadeClassName =
  "transition-opacity duration-300 ease-out motion-reduce:transition-none";

type HomeBarProps = {
  className?: string;
  mergeWithSubpanel?: boolean;
};

export function HomeBar({
  className = "",
  mergeWithSubpanel = false,
}: HomeBarProps) {
  const { contentPreviewRow } = useFilterSelection();
  const [breadcrumbEntered, setBreadcrumbEntered] = useState(false);
  const hadPreviewRef = useRef(false);

  useEffect(() => {
    const id = contentPreviewRow?.id;
    if (!id) {
      hadPreviewRef.current = false;
      setBreadcrumbEntered(false);
      return;
    }

    const opening = !hadPreviewRef.current;
    hadPreviewRef.current = true;

    if (opening) {
      setBreadcrumbEntered(false);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setBreadcrumbEntered(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    setBreadcrumbEntered(true);
  }, [contentPreviewRow]);

  return (
    <div
      className={`flex h-filter-chrome-bar min-w-0 shrink-0 items-center gap-2 border-b-hairline border-solid border-ink-primary bg-surface-canvas px-3 ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <Link
        href="/"
        className="flex min-w-0 shrink-0 items-center gap-2 text-ink-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
      >
        <HomeSvgIcon />
        <span className={`truncate ${navSidebarLinkLabelClassName}`}>Home</span>
      </Link>
      {contentPreviewRow ? (
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 ${breadcrumbFadeClassName} ${
            breadcrumbEntered ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Breadcrumb"
        >
          <img
            src="/svg/right-arrow.svg"
            alt=""
            className={breadcrumbArrowImgClassName}
            aria-hidden
          />
          <span
            className={`shrink-0 ${navSidebarLinkLabelClassName} text-ink-primary`}
          >
            Filters
          </span>
          <img
            src="/svg/right-arrow.svg"
            alt=""
            className={breadcrumbArrowImgClassName}
            aria-hidden
          />
          <span
            className={`min-w-0 flex-1 truncate font-suisseintl text-xs font-normal leading-5 ${filterPillSelection.text}`}
            title={contentPreviewRow.title}
          >
            {contentPreviewRow.title}
          </span>
        </div>
      ) : null}
    </div>
  );
}
