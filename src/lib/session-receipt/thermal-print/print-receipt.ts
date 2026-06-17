import { buildReceiptViewUrl } from "../encode";
import {
  formatReceiptDate,
  formatSessionTranscript,
} from "../format-transcript";
import { formatTagFortuneLine } from "../journey-prompt";
import { hasPathActivity } from "../path-grid";
import { RECEIPT_TITLE, type SessionReceipt } from "../types";
import { THERMAL_CHARS_PER_LINE } from "../thermal-spec";
import {
  buildEscPosRasterCommand,
  rasterizePathStars,
} from "./star-raster";

function wrapLine(text: string, width = THERMAL_CHARS_PER_LINE): string[] {
  if (text.length <= width) return [text];
  const lines: string[] = [];
  let rest = text;
  while (rest.length > width) {
    let breakAt = rest.lastIndexOf(" ", width);
    if (breakAt <= 0) breakAt = width;
    lines.push(rest.slice(0, breakAt).trimEnd());
    rest = rest.slice(breakAt).trimStart();
  }
  if (rest.length > 0) lines.push(rest);
  return lines;
}

/**
 * Print a session receipt to a locally attached thermal printer (USB / file / TCP).
 * Requires `node-thermal-printer` — only runs on the machine that owns the printer.
 */
export async function printSessionReceiptToInterface(
  receipt: SessionReceipt,
  printerInterface: string,
  viewOrigin?: string,
): Promise<void> {
  const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } =
    await import("node-thermal-printer");

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: printerInterface,
    width: THERMAL_CHARS_PER_LINE,
    characterSet: CharacterSet.PC437_USA,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    options: { timeout: 10000 },
  });

  printer.clear();
  printer.alignCenter();
  printer.bold(true);
  printer.println(RECEIPT_TITLE);
  printer.bold(false);
  printer.newLine();
  printer.println(formatReceiptDate(receipt.sessionStart));
  printer.drawLine();

  const transcript = formatSessionTranscript(receipt.events);
  printer.alignLeft();
  if (transcript.length === 0) {
    printer.alignCenter();
    printer.println("No activity recorded");
  } else {
    for (const line of transcript) {
      printer.println(`${line.time} ${line.text}`);
    }
  }

  printer.alignCenter();
  printer.drawLine();

  const qrUrl = buildReceiptViewUrl(receipt, viewOrigin);
  await printer.printQR(qrUrl, {
    cellSize: 6,
    correction: "L",
  });

  printer.newLine();
  for (const line of wrapLine(formatTagFortuneLine(receipt.prompt))) {
    printer.println(line);
  }

  if (receipt.path && hasPathActivity(receipt.path)) {
    printer.newLine();
    const raster = rasterizePathStars(receipt.path);
    printer.raw(buildEscPosRasterCommand(raster));
    printer.newLine();
  }

  printer.cut();
  await printer.execute();
}
