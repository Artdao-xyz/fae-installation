import Image from "next/image";
import { navMarkIconImgClassName } from "./nav-sidebar-labels";

export function PrintSvgIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svg/print.svg"
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
