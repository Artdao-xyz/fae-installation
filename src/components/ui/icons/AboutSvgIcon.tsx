import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function AboutSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/about.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
