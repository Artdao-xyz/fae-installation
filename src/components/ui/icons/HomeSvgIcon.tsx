import { navMarkIconImgClassName } from "./navChrome";

export function HomeSvgIcon({ className }: { className?: string }) {
  return (
    <img
      src="/svg/home.svg"
      alt=""
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
