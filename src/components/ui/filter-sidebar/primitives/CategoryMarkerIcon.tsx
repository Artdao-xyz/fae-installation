import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  categoryMarkerImageSrc,
  toneAccentClass,
} from "../config/filterSidebarTones";

type CategoryMarkerIconProps = {
  tone: FilterSidebarCategoryTone;
  className?: string;
};

export function CategoryMarkerIcon({ tone, className }: CategoryMarkerIconProps) {
  const maskSrc = categoryMarkerImageSrc[tone];

  return (
    <span
      className={[
        "block mask-center mask-no-repeat mask-contain [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]",
        toneAccentClass[tone].glow,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        maskImage: `url("${maskSrc}")`,
        WebkitMaskImage: `url("${maskSrc}")`,
      }}
      aria-hidden
    />
  );
}
