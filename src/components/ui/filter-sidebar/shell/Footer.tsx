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
      className={`flex h-filter-chrome-bar shrink-0 border-t-hairline border-solid border-ink-primary bg-surface-canvas ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <div
        className="h-full w-filter-narrow-column shrink-0 border-r-hairline border-solid border-ink-primary"
        aria-hidden
      />
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-between overflow-hidden px-3 py-0">
        <Image
          src="/svg/serpentine.svg"
          alt="Serpentine"
          width={56}
          height={56}
          unoptimized
          className="pointer-events-none h-14 w-14 shrink-0 object-contain"
          aria-hidden
        />
        <p className="font-suisseintl text-[10px] font-medium leading-3 text-ink-caption">
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
