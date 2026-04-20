import { filterChromeRightEdgeClass } from "./layout-classes";

type FooterProps = {
  className?: string;
  mergeWithSubpanel?: boolean;
  /** When false, only the Serpentine mark (e.g. mobile strip, centered). */
  showYear?: boolean;
};

export function Footer({
  className = "",
  mergeWithSubpanel = false,
  showYear = true,
}: FooterProps) {
  return (
    <footer
      className={`flex h-filter-chrome-bar shrink-0 items-center border-t-hairline border-solid border-ink-primary bg-surface-canvas px-3 py-0 ${showYear ? "justify-between" : "justify-center"} ${filterChromeRightEdgeClass(mergeWithSubpanel)} ${className}`}
    >
      <img
        src="/svg/serpentine.svg"
        alt="Serpentine"
        className="pointer-events-none w-12 shrink-0 object-contain"
        aria-hidden
      />
      {showYear ? (
        <p className="font-suisseintl text-[10px] font-medium leading-3 text-ink-caption">
          © {new Date().getFullYear()}
        </p>
      ) : null}
    </footer>
  );
}
