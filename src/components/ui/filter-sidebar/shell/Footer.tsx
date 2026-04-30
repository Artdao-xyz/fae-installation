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
      className={`flex h-11 shrink-0 border-t-hairline border-solid border-border bg-surface-canvas max-lg:border-r-0 lg:h-filter-chrome-bar ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-between overflow-hidden px-3 py-0 max-lg:justify-center">
        <a
          href="https://www.serpentinegalleries.org"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Serpentine Galleries website"
          className="inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
        >
          <Image
            src="/svg/serpentine.svg"
            alt=""
            width={56}
            height={12}
            unoptimized
            className="pointer-events-none h-auto w-14 shrink-0 object-contain"
            aria-hidden
          />
        </a>
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
