import Image from "next/image";
import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function FiltersSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/filters.svg"
      alt=""
      width={14}
      height={14}
      unoptimized
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
