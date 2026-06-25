import type { SessionReceipt } from "../types";
import { buildSessionReceiptRaster } from "./raster-receipt-layout";
import { buildEscPosRasterCommand } from "./star-raster";

type ThermalPrinterInstance = {
  clear: () => void;
  newLine: () => void;
  add: (buffer: Buffer) => void;
  cut: () => void;
  execute: () => Promise<unknown>;
  getBuffer: () => Buffer | null;
};

const DUMMY_PRINTER_INTERFACE =
  process.platform === "win32" ? "\\\\.\\NUL" : "/dev/null";

async function createThermalPrinter(interfacePath: string) {
  const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } =
    await import("node-thermal-printer");

  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: interfacePath,
    characterSet: CharacterSet.PC437_USA,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    options: { timeout: 10000 },
  }) as ThermalPrinterInstance;
}

async function appendRasterReceiptToPrinter(
  printer: ThermalPrinterInstance,
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<void> {
  printer.clear();
  printer.newLine();

  const raster = await buildSessionReceiptRaster(receipt, viewOrigin);
  printer.add(buildEscPosRasterCommand(raster));
  printer.cut();
}

/** Build ESC/POS bytes for a fully rasterized session receipt. */
export async function buildSessionReceiptEscPosBufferRaster(
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<Buffer> {
  const printer = await createThermalPrinter(DUMMY_PRINTER_INTERFACE);
  await appendRasterReceiptToPrinter(printer, receipt, viewOrigin);
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
  const printer = await createThermalPrinter(printerInterface);
  await appendRasterReceiptToPrinter(printer, receipt, viewOrigin);
  await printer.execute();
}
