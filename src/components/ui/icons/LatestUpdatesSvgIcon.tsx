import Image from "next/image";
import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function LatestUpdatesSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/latest-updates-panel.svg"
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
