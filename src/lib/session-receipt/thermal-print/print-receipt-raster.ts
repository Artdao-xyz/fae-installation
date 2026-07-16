import type { SessionReceipt } from "../types";
import {
  parseCupsPrinterName,
  printRawEscPosToCups,
} from "./cups-lp-raw-print";
import {
  buildSessionReceiptRaster,
  type ReceiptRasterSection,
} from "./raster-receipt-layout";
import { buildEscPosRasterCommand } from "./star-raster";
import { createThermalPrinter, usesCupsPrinterDriver } from "./thermal-printer-factory";

type ThermalPrinterInstance = {
  clear: () => void;
  newLine: () => void;
  alignLeft: () => void;
  alignCenter: () => void;
  add: (buffer: Buffer) => void;
  cut: () => void;
  execute: () => Promise<unknown>;
  getBuffer: () => Buffer | null;
  setBuffer: (buffer: Buffer) => void;
};

const DUMMY_PRINTER_INTERFACE =
  process.platform === "win32" ? "\\\\.\\NUL" : "/dev/null";

async function openThermalPrinter(interfacePath: string) {
  const { CharacterSet, BreakLine } = await import("node-thermal-printer");

  return (await createThermalPrinter(interfacePath, {
    characterSet: CharacterSet.PC437_USA,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    options: { timeout: 10000 },
  })) as ThermalPrinterInstance;
}

function appendRasterReceiptToPrinter(
  printer: ThermalPrinterInstance,
  sections: ReceiptRasterSection[],
): void {
  printer.clear();
  printer.newLine();
  printer.alignLeft();

  for (const section of sections) {
    if (section.align === "center") {
      printer.alignCenter();
    } else {
      printer.alignLeft();
    }
    printer.add(buildEscPosRasterCommand(section.raster));
  }

  printer.alignLeft();
  printer.cut();
}

/** Build ESC/POS bytes for a fully rasterized session receipt. */
export async function buildSessionReceiptEscPosBufferRaster(
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<Buffer> {
  const printer = await openThermalPrinter(DUMMY_PRINTER_INTERFACE);
  const sections = await buildSessionReceiptRaster(receipt, viewOrigin);
  appendRasterReceiptToPrinter(printer, sections);
  const buffer = printer.getBuffer();
  if (!buffer?.length) {
    throw new Error("Empty ESC/POS buffer");
  }
  return buffer;
}

/** Print a fully rasterized session receipt to a local thermal printer. */
export async function printSessionReceiptToInterfaceRaster(
  receipt: SessionReceipt,
  printerInterface: string,
  viewOrigin?: string,
): Promise<void> {
  const sections = await buildSessionReceiptRaster(receipt, viewOrigin);

  if (usesCupsPrinterDriver(printerInterface)) {
    const printerName = parseCupsPrinterName(printerInterface);
    const printer = await openThermalPrinter(DUMMY_PRINTER_INTERFACE);

    appendRasterReceiptToPrinter(printer, sections);
    const buffer = printer.getBuffer();
    if (!buffer?.length) {
      throw new Error("Empty ESC/POS buffer");
    }
    console.info(
      `[print] CUPS raster → ${printerName} (1 job, ${buffer.length} bytes)`,
    );
    await printRawEscPosToCups(printerName, buffer);
    return;
  }

  const printer = await openThermalPrinter(printerInterface);
  appendRasterReceiptToPrinter(printer, sections);
  const buffer = printer.getBuffer();
  if (!buffer?.length) {
    throw new Error("Empty ESC/POS buffer");
  }
  printer.setBuffer(buffer);
  await printer.execute();
}
