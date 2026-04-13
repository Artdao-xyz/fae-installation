export function Footer() {
  return (
    <footer className="flex h-filter-top-bar shrink-0 items-center justify-between border-t-hairline border-solid border-ink-primary bg-surface-canvas px-3 py-2">
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
