export function Footer() {
  return (
    <footer className="flex justify-between items-center shrink-0 border-t-[0.5px] border-solid border-text-primary bg-white-fae px-3 py-2 h-[40px]">
      <img
        src="/svg/serpentine.svg"
        alt="Serpentine"
        className="pointer-events-none h-[10px] w-[47px] shrink-0 object-contain"
        aria-hidden
      />
      <p className="font-mono text-[8px] leading-3 text-text-caption">
        © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
