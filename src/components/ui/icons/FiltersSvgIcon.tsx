import Image from "next/image";
import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function FiltersSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/filters.svg"
      alt=""
      width={16}
      height={16}
      unoptimized
      className={`${navMarkIconImgClassName} ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
