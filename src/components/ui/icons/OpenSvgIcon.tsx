import { navMarkIconImgClassName } from "./navChrome";

/**
 * Standard render for `public/svg/open.svg`; same box as other nav mark icons.
 */
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
