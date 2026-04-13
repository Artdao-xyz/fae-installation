import { navMarkIconImgClassName } from "./navChrome";

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
