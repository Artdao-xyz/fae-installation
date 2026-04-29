import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { filterPillSelection } from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";
import { HomeSvgIcon } from "@/components/ui/icons/HomeSvgIcon";
import { filterChromeRightEdgeClass } from "./layout-classes";

/** Suisse Intl, 12px / regular — HomeBar breadcrumb (Home → preview title when open). */
const homeBarBreadcrumbTypeClassName =
  "font-suisseintl text-xs font-normal leading-5";

const breadcrumbArrowImgClassName =
  "pointer-events-none block h-2.5 w-2 shrink-0 object-contain select-none opacity-80";

const breadcrumbFadeClassName =
  "transition-opacity duration-300 ease-out motion-reduce:transition-none";

const resetFiltersButtonClassName =
  "inline-flex h-full shrink-0 items-center justify-center border-l-hairline border-solid border-ink-primary bg-transparent px-3 leading-[0] transition-[opacity,background-color] hover:bg-[#F7F7F7] hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary";

type HomeBarProps = {
  className?: string;
  mergeWithSubpanel?: boolean;
};

export function HomeBar({
  className = "",
  mergeWithSubpanel = false,
}: HomeBarProps) {
  const { contentPreviewRow, resetToIdle, closeContentPreview } = useFilterSelection();
  const [breadcrumbEntered, setBreadcrumbEntered] = useState(false);
  const prevPreviewIdRef = useRef<string | undefined>(undefined);

  const previewId = contentPreviewRow?.id;

  useEffect(() => {
    if (!previewId) {
      prevPreviewIdRef.current = undefined;
      return;
    }

    const opening = prevPreviewIdRef.current === undefined;
    prevPreviewIdRef.current = previewId;

    if (opening) {
      let raf0 = 0;
      let raf1 = 0;
      let raf2 = 0;
      raf0 = requestAnimationFrame(() => {
        setBreadcrumbEntered(false);
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setBreadcrumbEntered(true));
        });
      });
      return () => {
        cancelAnimationFrame(raf0);
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    let reveal = 0;
    reveal = requestAnimationFrame(() => setBreadcrumbEntered(true));
    return () => cancelAnimationFrame(reveal);
  }, [previewId]);

  return (
    <div
      className={`flex h-filter-chrome-bar min-w-0 shrink-0 border-b-hairline border-solid border-ink-primary bg-surface-canvas ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-hidden pl-3 pr-0">
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <Link
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              if (contentPreviewRow) {
                closeContentPreview();
              } else {
                resetToIdle();
              }
            }}
            aria-label={
              contentPreviewRow
                ? "Return to filtered results, close preview"
                : "Home"
            }
            className="flex min-w-0 shrink-0 items-center gap-2 text-ink-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
          >
            <HomeSvgIcon />
            <span className={`truncate ${homeBarBreadcrumbTypeClassName} text-ink-body`}>
              Future Arts Ecosystems
            </span>
          </Link>
          {contentPreviewRow ? (
            <div
              className={`flex min-w-0 flex-1 items-center gap-2 ${breadcrumbFadeClassName} ${
                breadcrumbEntered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Breadcrumb"
            >
              <Image
                src="/svg/right-arrow.svg"
                alt=""
                width={8}
                height={10}
                unoptimized
                className={breadcrumbArrowImgClassName}
                aria-hidden
              />
              <span
                className={`min-w-0 flex-1 truncate ${homeBarBreadcrumbTypeClassName} ${filterPillSelection.text}`}
                title={contentPreviewRow.title}
              >
                {contentPreviewRow.title}
              </span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={resetToIdle}
          aria-label="Clear all filters"
          className={resetFiltersButtonClassName}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
          <img
            src="/svg/reset.svg"
            alt="Reset"
            width={17}
            height={14}
            className="m-0 block h-3.5 w-auto max-h-3.5 shrink-0 object-contain object-center"
          />
        </button>
      </div>
    </div>
  );
}
