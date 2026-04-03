"use client";

type SubpanelCloseBarProps = {
  onClose: () => void;
};

export function SubpanelCloseBar({ onClose }: SubpanelCloseBarProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="flex h-[22px] w-full shrink-0 items-center border-t-[0.5px] border-solid border-text-primary bg-white-fae px-3 text-text-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-text-primary"
      aria-label="Close panel"
    >
      <img
        src="/svg/sidebar.svg"
        alt=""
        width={7}
        height={10}
        className="pointer-events-none block h-[10px] w-auto shrink-0 rotate-180 select-none"
        aria-hidden
      />
    </button>
  );
}
