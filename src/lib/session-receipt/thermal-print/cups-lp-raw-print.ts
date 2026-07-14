import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** `printer:Printer_POS-80` → `Printer_POS-80` */
export function parseCupsPrinterName(printerInterface: string): string {
  const match = /^printer:(.+)$/i.exec(printerInterface.trim());
  if (!match?.[1]) {
    throw new Error(
      `Expected CUPS interface printer:Name, got "${printerInterface}"`,
    );
  }
  return match[1];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLpJob(printerName: string, data: Buffer): Promise<void> {
  const tmpPath = join(
    tmpdir(),
    `fae-escpos-${randomBytes(8).toString("hex")}.bin`,
  );

  try {
    await writeFile(tmpPath, data);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        "lp",
        ["-d", printerName, "-o", "raw", tmpPath],
        { stdio: ["ignore", "pipe", "pipe"] },
      );

      let stderr = "";
      proc.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(
          new Error(stderr.trim() || `lp failed with exit code ${code ?? "unknown"}`),
        );
      });
    });
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

/**
 * Send a complete ESC/POS byte stream to a macOS CUPS queue in raw mode.
 * Matches manual debugging: write file → `lp -d <name> -o raw <file>`.
 */
export async function printRawEscPosToCups(
  printerName: string,
  data: Buffer,
): Promise<void> {
  if (!data?.length) {
    throw new Error("Empty ESC/POS buffer");
  }
  await runLpJob(printerName, data);
}

/**
 * Send each buffer as its own CUPS job, pausing `delayMs` between jobs so the
 * printer's receive buffer fully drains before the next chunk arrives. A single `lp`
 * job streams start-to-finish with no gaps — which is how cheap ESC/POS-clone
 * controllers desync mid-raster and dump pixel bytes as text once a big image outruns
 * their buffer (see star-raster.ts). Separate, paced jobs remove that failure mode
 * regardless of how fast CUPS/USB would otherwise push the bytes, at the cost of a
 * slower print.
 */
export async function printRawEscPosJobsToCups(
  printerName: string,
  jobs: Buffer[],
  delayMs: number,
): Promise<void> {
  const nonEmptyJobs = jobs.filter((job) => job.length > 0);
  if (nonEmptyJobs.length === 0) {
    throw new Error("Empty ESC/POS buffer");
  }

  for (let i = 0; i < nonEmptyJobs.length; i++) {
    await runLpJob(printerName, nonEmptyJobs[i]!);
    if (i < nonEmptyJobs.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }
}
