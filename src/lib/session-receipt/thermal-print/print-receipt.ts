import { buildReceiptViewUrl } from "../encode";
import {
  formatReceiptDate,
  formatSessionTranscript,
} from "../format-transcript";
import { formatTagFortuneLine } from "../journey-prompt";
import { hasPathActivity } from "../path-grid";
import {
  RECEIPT_ACTIVITY_HEADING,
  RECEIPT_ARTIFACT_TITLE,
  RECEIPT_BRAND,
  type SessionReceipt,
} from "../types";
import {
  THERMAL_CHARS_AT_FULL_BLEED,
  THERMAL_CONTENT_DOTS,
  THERMAL_HORIZONTAL_MARGIN_DOTS,
} from "../thermal-spec";
import { rasterizeReceiptFooter } from "./footer-raster";
import {
  insetRasterHorizontally,
  padThermalLineLeft,
  padThermalLineStart,
} from "./margins";
import { rasterizeQrCode } from "./qr-raster";
import {
  buildEscPosRasterCommand,
  rasterizePathStars,
} from "./star-raster";
import { createThermalPrinter } from "./thermal-printer-factory";

type ThermalPrinterInstance = {
  clear: () => void;
  newLine: () => void;
  alignLeft: () => void;
  add: (buffer: Buffer) => void;
  bold: (enabled: boolean) => void;
  println: (text: string) => void;
  cut: () => void;
  execute: () => Promise<unknown>;
  getBuffer: () => Buffer | null;
};

const DUMMY_PRINTER_INTERFACE =
  process.platform === "win32" ? "\\\\.\\NUL" : "/dev/null";

async function openThermalPrinter(interfacePath: string) {
  const { CharacterSet, BreakLine } = await import("node-thermal-printer");

  return (await createThermalPrinter(interfacePath, {
    width: THERMAL_CHARS_AT_FULL_BLEED,
    characterSet: CharacterSet.PC437_USA,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    options: { timeout: 10000 },
  })) as ThermalPrinterInstance;
}

async function appendSessionReceiptToPrinter(
  printer: ThermalPrinterInstance,
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<void> {
  printer.clear();
  printer.newLine();
  printer.alignLeft();

  if (receipt.path && hasPathActivity(receipt.path)) {
    const raster = insetRasterHorizontally(
      rasterizePathStars(receipt.path, THERMAL_CONTENT_DOTS),
      THERMAL_HORIZONTAL_MARGIN_DOTS,
    );
    printer.add(buildEscPosRasterCommand(raster));
    printer.newLine();
  }

  printer.bold(true);
  printer.println(padThermalLineLeft(RECEIPT_BRAND));
  printer.bold(false);
  printer.println(padThermalLineLeft(RECEIPT_ARTIFACT_TITLE));
  printer.println(padThermalLineLeft(formatReceiptDate(receipt.sessionStart)));
  printer.newLine();
  printer.newLine();

  printer.println(padThermalLineLeft(RECEIPT_ACTIVITY_HEADING));
  printer.newLine();

  const transcript = formatSessionTranscript(receipt.events);
  if (transcript.length === 0) {
    printer.println(padThermalLineLeft("No activity recorded"));
  } else {
    for (const line of transcript) {
      printer.println(padThermalLineLeft(`${line.time} ${line.text}`));
    }
  }

  printer.newLine();
  printer.newLine();
  printer.println(padThermalLineStart(formatTagFortuneLine(receipt.prompt)));
  printer.newLine();

  const qrUrl = buildReceiptViewUrl(receipt, viewOrigin);
  printer.add(
    buildEscPosRasterCommand(
      insetRasterHorizontally(rasterizeQrCode(qrUrl), THERMAL_HORIZONTAL_MARGIN_DOTS),
    ),
  );

  printer.newLine();
  const footer = await rasterizeReceiptFooter();
  printer.add(
    buildEscPosRasterCommand(
      insetRasterHorizontally(footer, THERMAL_HORIZONTAL_MARGIN_DOTS),
    ),
  );

  printer.cut();
}

/** Build the raw ESC/POS byte stream for a session receipt (export / review). */
export async function buildSessionReceiptEscPosBuffer(
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<Buffer> {
  const printer = await openThermalPrinter(DUMMY_PRINTER_INTERFACE);
  await appendSessionReceiptToPrinter(printer, receipt, viewOrigin);
  const buffer = printer.getBuffer();
  if (!buffer?.length) {
    throw new Error("Empty ESC/POS buffer");
  }
  return buffer;
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
  const printer = await openThermalPrinter(printerInterface);
  await appendSessionReceiptToPrinter(printer, receipt, viewOrigin);
  await printer.execute();
}
