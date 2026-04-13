import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function OpenSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/open.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
