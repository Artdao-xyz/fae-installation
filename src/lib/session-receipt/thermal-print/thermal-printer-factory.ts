import { createCupsLpPrinterDriver } from "./cups-lp-printer-driver";

/** CUPS system printer via `node-thermal-printer` (`printer:Name`). */
export function usesCupsPrinterDriver(printerInterface: string): boolean {
  return /^printer:/i.test(printerInterface.trim());
}

type CreateThermalPrinterConfig = {
  width?: number;
  characterSet: import("node-thermal-printer").CharacterSet;
  breakLine: import("node-thermal-printer").BreakLine;
  removeSpecialCharacters?: boolean;
  options?: { timeout?: number };
};

/** `node-thermal-printer` instance; CUPS `printer:` interfaces get an `lp -o raw` driver. */
export async function createThermalPrinter(
  interfacePath: string,
  config: CreateThermalPrinterConfig,
) {
  const { ThermalPrinter, PrinterTypes } = await import("node-thermal-printer");

  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: interfacePath,
    ...config,
    ...(usesCupsPrinterDriver(interfacePath)
      ? { driver: createCupsLpPrinterDriver() }
      : {}),
  });
}
