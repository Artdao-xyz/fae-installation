import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { categoryMarkerImageSrc } from "../config/filterSidebarTones";

type CategoryMarkerIconProps = {
  tone: FilterSidebarCategoryTone;
  className?: string;
};

export function CategoryMarkerIcon({ tone, className }: CategoryMarkerIconProps) {
  return (
    // Static category glyph from /public; pre-colored SVG.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={categoryMarkerImageSrc[tone]}
      alt=""
      width={20}
      height={20}
      decoding="async"
      className={className}
      aria-hidden
    />
  );
}
