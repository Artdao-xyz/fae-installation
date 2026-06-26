import { THERMAL_CHARS_AT_FULL_BLEED } from "@/lib/session-receipt/thermal-spec";
import {
  padThermalLineLeft,
  thermalDividerLine,
} from "@/lib/session-receipt/thermal-print/margins";

/**
 * Minimal ESC/POS page to verify printer wiring without a full session receipt.
 */
export async function printInstallationTestPage(
  printerInterface: string,
): Promise<void> {
  const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } =
    await import("node-thermal-printer");

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: printerInterface,
    width: THERMAL_CHARS_AT_FULL_BLEED,
    characterSet: CharacterSet.PC437_USA,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    options: { timeout: 10000 },
  });

  printer.clear();
  printer.newLine();
  printer.alignLeft();
  printer.bold(true);
  printer.println(padThermalLineLeft("FAE Installation"));
  printer.bold(false);
  printer.newLine();
  printer.println(padThermalLineLeft("Test print OK"));
  printer.println(padThermalLineLeft(new Date().toISOString()));
  printer.println(thermalDividerLine());
  printer.println(padThermalLineLeft("If you can read this,"));
  printer.println(padThermalLineLeft("the printer is configured."));
  printer.cut();
  await printer.execute();
}
