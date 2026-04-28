import Image from "next/image";
import { navMarkIconBaseImgClassName } from "./nav-sidebar-labels";

export function OpenSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/open.svg"
      alt=""
      width={10}
      height={10}
      unoptimized
      className={`${navMarkIconBaseImgClassName} size-[10px] ${className ?? ""}`}
      aria-hidden
      draggable={false}
    />
  );
}
