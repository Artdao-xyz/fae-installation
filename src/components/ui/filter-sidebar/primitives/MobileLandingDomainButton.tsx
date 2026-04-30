import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";

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
  const toneTextClass = toneAccentClass[tone].marker;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPress}
      className={[
        "relative -ml-px flex h-13 min-w-0 shrink items-center justify-center border-hairline border-solid border-border bg-surface-canvas text-ink-body transition-colors hover:z-10 hover:bg-surface-hover/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary",
        selected ? "z-10 border-ink-primary" : "",
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
            : `min-w-0 truncate font-lust-text text-xs font-normal leading-4 tracking-wide ${toneTextClass}`
        }
      >
        {label}
      </span>
    </button>
  );
}
