import Image from "next/image";
import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function HomeSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/home.svg"
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
