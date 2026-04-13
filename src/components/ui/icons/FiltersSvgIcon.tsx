import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function FiltersSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/filters.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
