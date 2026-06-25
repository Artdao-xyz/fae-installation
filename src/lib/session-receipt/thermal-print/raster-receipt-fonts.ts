import fs from "node:fs";
import path from "node:path";

type FontCache = {
  firaRegular: string;
  firaMedium: string;
  lustBook: string;
};

let cache: FontCache | null = null;

function readFontBase64(filename: string): string {
  const absolutePath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "public/fonts",
    filename,
  );
  return fs.readFileSync(absolutePath).toString("base64");
}

function loadFonts(): FontCache {
  if (!cache) {
    cache = {
      firaRegular: readFontBase64("FiraMono-Regular.woff2"),
      firaMedium: readFontBase64("FiraMono-Medium.woff2"),
      lustBook: readFontBase64("LustTextBook.woff2"),
    };
  }
  return cache;
}

/** Shared @font-face rules for receipt SVG blocks (embedded woff2). */
export function rasterReceiptFontFaceCss(): string {
  const fonts = loadFonts();
  return `
@font-face {
  font-family: "FiraMono";
  src: url(data:font/woff2;base64,${fonts.firaRegular}) format("woff2");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "FiraMono";
  src: url(data:font/woff2;base64,${fonts.firaMedium}) format("woff2");
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: "LustText";
  src: url(data:font/woff2;base64,${fonts.lustBook}) format("woff2");
  font-weight: 400;
  font-style: normal;
}`.trim();
}
