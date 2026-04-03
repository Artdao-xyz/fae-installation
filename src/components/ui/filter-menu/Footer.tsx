export function Footer() {
  return (
    <footer className="flex justify-between items-center shrink-0 border-t-[0.5px] border-solid border-text-primary bg-white-fae px-3 py-2 h-[40px]">
      {/* add serpentine logo svg */}
      <img
        src="/svg/serpentine.svg"
        alt="Serpentine"
        width={47}
        height={10}
        className="pointer-events-none h-[10px] w-auto shrink-0"
        aria-hidden
      />
      <p className="font-mono text-[8px] leading-3 text-text-caption">
        © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
