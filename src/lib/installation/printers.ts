import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type PrinterOption = {
  id: string;
  label: string;
  interface: string;
  source: "cups" | "linux-device";
};

function cupsInterface(name: string): string {
  return `printer:${name}`;
}

async function listCupsPrinters(): Promise<PrinterOption[]> {
  try {
    const { stdout } = await execFileAsync("lpstat", ["-p"], {
      timeout: 5000,
    });
    const options: PrinterOption[] = [];
    for (const line of stdout.split("\n")) {
      const match = /^printer\s+(\S+)\s+/i.exec(line.trim());
      if (!match) continue;
      const name = match[1];
      options.push({
        id: `cups:${name}`,
        label: name,
        interface: cupsInterface(name),
        source: "cups",
      });
    }
    return options;
  } catch {
    return [];
  }
}

function listLinuxDevicePrinters(): PrinterOption[] {
  if (process.platform === "win32") return [];
  const candidates = ["/dev/usb/lp0", "/dev/usb/lp1", "/dev/usb/lp2"] as const;
  const options: PrinterOption[] = [];
  for (const device of candidates) {
    try {
      if (!fs.existsSync(/* turbopackIgnore: true */ device)) continue;
      options.push({
        id: `device:${device}`,
        label: device.slice(device.lastIndexOf("/") + 1),
        interface: device,
        source: "linux-device",
      });
    } catch {
      // ignore
    }
  }
  return options;
}

export async function listAvailablePrinters(): Promise<PrinterOption[]> {
  const cups = await listCupsPrinters();
  const devices = listLinuxDevicePrinters();
  const seen = new Set<string>();
  const merged: PrinterOption[] = [];
  for (const option of [...cups, ...devices]) {
    if (seen.has(option.interface)) continue;
    seen.add(option.interface);
    merged.push(option);
  }
  return merged;
}
