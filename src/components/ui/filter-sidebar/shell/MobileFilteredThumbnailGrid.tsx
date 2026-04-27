"use client";

import { Thumbnail } from "@/components/ui/thumbnail-full";
import { useFilterSelection } from "../FilterSelectionContext";
import { useIsMaxLg } from "./useIsMaxLg";

/**
 * `max-lg` only in the viewport: hidden from `lg` up via `lg:hidden`. Fluid `Thumbnail` + 10px labels
 * apply only when `useIsMaxLg()` is true so desktop-sized viewports never use `fillContainer` (even in SSR HTML).
 */
export function MobileFilteredThumbnailGrid() {
  const isMaxLg = useIsMaxLg();
  const {
    hasActiveTaxonomyFilters,
    filterMatchingCatalogRows,
    openContentPreview,
  } = useFilterSelection();

  if (!hasActiveTaxonomyFilters) {
    return null;
  }

  return (
    <div className="w-full px-3 pb-3 pt-2 lg:hidden">
      <ul
        className="grid touch-pan-y grid-cols-2 gap-x-3 gap-y-4"
        role="list"
        aria-label="Filtered outputs"
      >
        {filterMatchingCatalogRows.length === 0 ? (
          <li className="col-span-2 font-fira-mono text-xs leading-4 text-ink-body/70">
            No matching outputs
          </li>
        ) : (
          filterMatchingCatalogRows.map((row) => (
            <li
              key={row.id}
              className="aspect-square min-w-0 w-full even:translate-y-12 motion-reduce:translate-y-0"
            >
              <button
                type="button"
                onClick={() => openContentPreview(row)}
                className="flex h-full w-full min-h-0 touch-pan-y flex-col overflow-hidden p-1 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0"
              >
                <Thumbnail
                  variant="full"
                  size="sm"
                  fillContainer={isMaxLg}
                  label={row.shortTitle}
                  imageSrc={row.imageUrl}
                  imageAlt={row.shortTitle}
                  accessibilityLabel={row.title}
                  labelFontSizePx={isMaxLg ? 10 : undefined}
                  className={
                    isMaxLg
                      ? "h-full min-h-0 w-full flex-1"
                      : "mx-auto min-h-0 min-w-0"
                  }
                />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
