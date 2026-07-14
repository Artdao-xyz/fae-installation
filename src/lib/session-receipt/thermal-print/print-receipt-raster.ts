import type { SessionReceipt } from "../types";
import {
  parseCupsPrinterName,
  printRawEscPosJobsToCups,
} from "./cups-lp-raw-print";
import {
  buildSessionReceiptRaster,
  type ReceiptRasterSection,
} from "./raster-receipt-layout";
import { buildEscPosRasterBands, buildEscPosRasterCommand } from "./star-raster";
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

/**
 * Cheap ESC/POS-clone controllers (common on kiosk printers) can desync mid-raster
 * when a whole receipt's image bytes stream through in one uninterrupted burst — the
 * printer's receive buffer overflows and it falls back to printing raw pixel bytes as
 * text (see star-raster.ts). A single CUPS job has no gaps once it starts sending, so
 * the fix is small bands sent as *separate* jobs with a real pause between them —
 * giving the printer wall-clock time to actually drain each one. Slower, but removes
 * the failure mode outright.
 */
const CUPS_RASTER_BAND_HEIGHT_DOTS = 48;
const CUPS_RASTER_JOB_DELAY_MS = 250;

function buildControlBuffer(
  printer: ThermalPrinterInstance,
  build: () => void,
): Buffer {
  printer.clear();
  build();
  return printer.getBuffer() ?? Buffer.alloc(0);
}

/** Ordered list of small CUPS jobs — control bytes ride along with the band that follows them. */
function buildPacedRasterJobs(
  printer: ThermalPrinterInstance,
  sections: ReceiptRasterSection[],
): Buffer[] {
  const jobs: Buffer[] = [];
  let pendingControl = buildControlBuffer(printer, () => {
    printer.newLine();
    printer.alignLeft();
  });

  for (const section of sections) {
    const alignControl = buildControlBuffer(printer, () => {
      if (section.align === "center") {
        printer.alignCenter();
      } else {
        printer.alignLeft();
      }
    });
    pendingControl = Buffer.concat([pendingControl, alignControl]);

    const bands = buildEscPosRasterBands(section.raster, CUPS_RASTER_BAND_HEIGHT_DOTS);
    jobs.push(Buffer.concat([pendingControl, bands[0]!]));
    pendingControl = Buffer.alloc(0);
    for (let i = 1; i < bands.length; i++) {
      jobs.push(bands[i]!);
    }
  }

  const trailer = buildControlBuffer(printer, () => {
    printer.alignLeft();
    printer.cut();
  });
  jobs[jobs.length - 1] = Buffer.concat([jobs[jobs.length - 1]!, trailer]);

  return jobs;
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
    const jobs = buildPacedRasterJobs(printer, sections);
    console.info(
      `[print] CUPS paced raster → ${printerName} (${jobs.length} jobs, ` +
        `${CUPS_RASTER_BAND_HEIGHT_DOTS}dot bands, ${CUPS_RASTER_JOB_DELAY_MS}ms apart)`,
    );
    await printRawEscPosJobsToCups(printerName, jobs, CUPS_RASTER_JOB_DELAY_MS);
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
