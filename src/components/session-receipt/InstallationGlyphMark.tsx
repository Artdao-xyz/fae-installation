import Image from "next/image";
import { installationGlyphMarkClass } from "./installation-screen-chrome";

type InstallationGlyphMarkProps = {
  src: string;
  width: number;
  height: number;
  priority?: boolean;
};

export function InstallationGlyphMark({
  src,
  width,
  height,
  priority = false,
}: InstallationGlyphMarkProps) {
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      priority={priority}
      draggable={false}
      aria-hidden
      className={installationGlyphMarkClass}
      sizes="440px"
    />
  );
}
