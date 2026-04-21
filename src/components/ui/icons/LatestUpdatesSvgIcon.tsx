import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function LatestUpdatesSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/latest-updates-panel.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
