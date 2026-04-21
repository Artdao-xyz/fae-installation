import Image from "next/image";
import { filterChromeRightEdgeClass } from "./layout-classes";

type FooterProps = {
  className?: string;
  mergeWithSubpanel?: boolean;
};

export function Footer({
  className = "",
  mergeWithSubpanel = false,
}: FooterProps) {
  return (
    <footer
      className={`flex h-filter-chrome-bar shrink-0 items-center justify-between border-t-hairline border-solid border-ink-primary bg-surface-canvas px-3 py-0 ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <Image
        src="/svg/serpentine.svg"
        alt="Serpentine"
        width={48}
        height={48}
        unoptimized
        className="pointer-events-none w-12 shrink-0 object-contain"
        aria-hidden
      />
      <p className="font-suisseintl text-[10px] font-medium leading-3 text-ink-caption">
        © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
