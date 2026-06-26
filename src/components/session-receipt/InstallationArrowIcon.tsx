import type { CSSProperties } from "react";

export function InstallationArrowIcon({
  className = "block h-4 w-[11px] shrink-0 object-contain",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static chrome icon
    <img
      src="/svg/blue-arrow.svg"
      alt=""
      width={11}
      height={16}
      className={className}
      style={style}
      aria-hidden
    />
  );
}
