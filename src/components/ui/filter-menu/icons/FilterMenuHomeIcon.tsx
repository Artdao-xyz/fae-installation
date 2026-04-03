/** Custom mark — vector: `icons/home.svg` (mirror `public/svg/home.svg` for runtime). */
export function FilterMenuHomeIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/home.svg"
      alt=""
      width={18}
      height={18}
      className={`pointer-events-none shrink-0 select-none ${className ?? ""}`}
      aria-hidden
    />
  );
}
