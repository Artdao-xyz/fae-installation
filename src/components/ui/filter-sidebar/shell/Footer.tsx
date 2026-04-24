import Image from "next/image";
import { filterChromeRightEdgeClass } from "./layout-classes";

type FooterProps = {
  className?: string;
  mergeWithSubpanel?: boolean;
  /** When false, hides the copyright line (e.g. mobile bottom bar next to another chrome). */
  showYear?: boolean;
};

export function Footer({
  className = "",
  mergeWithSubpanel = false,
  showYear = true,
}: FooterProps) {
  return (
    <footer
      className={`flex h-11 shrink-0 border-t-hairline border-solid border-ink-primary bg-surface-canvas max-lg:border-r-0 lg:h-filter-chrome-bar ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <div
        className="hidden h-full w-filter-narrow-column shrink-0 border-r-hairline border-solid border-ink-primary lg:block"
        aria-hidden
      />
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-between overflow-hidden px-3 py-0 max-lg:justify-center">
        <Image
          src="/svg/serpentine.svg"
          alt="Serpentine"
          width={56}
          height={56}
          unoptimized
          className="pointer-events-none shrink-0 object-contain lg:h-14"
          aria-hidden
        />
        {showYear ? (
          <p className="font-suisseintl text-[10px] font-medium leading-3 text-ink-caption">
            © {new Date().getFullYear()}
          </p>
        ) : (
          <span className="shrink-0 max-lg:hidden" aria-hidden />
        )}
      </div>
    </footer>
  );
}
