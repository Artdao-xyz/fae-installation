export function FilterMenuFiltersIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/filters.svg"
      alt=""
      width={19}
      height={13}
      className={`pointer-events-none shrink-0 select-none ${className ?? ""}`}
      aria-hidden
    />
  );
}
