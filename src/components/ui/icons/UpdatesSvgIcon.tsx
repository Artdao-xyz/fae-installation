import { navMarkIconImgClassName } from "./navChrome";

export function UpdatesSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/updates.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
