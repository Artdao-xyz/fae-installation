import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { domainRowHighlightedBgClass } from "../config/filterSidebarTones";

type MobileLandingDomainButtonProps = {
  label: string;
  tone: FilterSidebarCategoryTone;
  compact?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

export function MobileLandingDomainButton({
  label,
  tone,
  compact = false,
  selected = false,
  onPress,
}: MobileLandingDomainButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPress}
      className={[
        "relative -ml-px flex h-13 min-w-0 shrink items-center justify-center border-hairline border-border text-ink-primary transition-colors [border-left-style:dashed] [border-right-style:dashed] [border-top-style:solid] [border-bottom-style:solid]",
        selected
          ? `z-10 ${domainRowHighlightedBgClass[tone]} focus-visible:outline-none`
          : "bg-surface-muted focus-visible:outline-none",
        compact ? "w-13 flex-none px-0" : "flex-1 gap-1 px-1",
      ].join(" ")}
    >
      <CategoryMarkerIcon
        tone={tone}
        className={`${compact ? "size-5" : "size-4"} shrink-0 object-contain`}
      />
      <span
        className={
          compact
            ? "sr-only"
            : "min-w-0 truncate font-lust-text text-xs font-normal leading-4 tracking-wide text-ink-primary"
        }
      >
        {label}
      </span>
    </button>
  );
}
