import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function FellowshipsSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/fellowships.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
