import { toPng } from "html-to-image";

export function receiptImageFilename(sessionStart: string): string {
  const d = new Date(sessionStart);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `journey-artifact-${y}-${m}-${day}.png`;
}

/** Capture the digital receipt card and trigger a PNG download on the visitor's device. */
export async function downloadReceiptImage(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
