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
      <img
        src="/svg/serpentine.svg"
        alt="Serpentine"
        className="pointer-events-none h-[10px] w-[47px] shrink-0 object-contain"
        aria-hidden
      />
      <p className="font-fira-mono text-[8px] leading-3 text-ink-caption">
        © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
