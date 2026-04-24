import Image from "next/image";
import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function HomeSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/home.svg"
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
