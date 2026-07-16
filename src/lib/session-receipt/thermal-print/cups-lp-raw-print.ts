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

/**
 * Parser-flush preamble prepended to every print: a run of NUL bytes, then ESC @
 * (reset). A garbled print can leave the clone's parser mid-`GS v 0`, still owed
 * pixel bytes — in that state it silently eats the next job's opening commands and
 * garbles that print too (bad prints cluster). The NULs satisfy any leftover deficit
 * (worst case one full 240-row band = ~17KB, printed as blank white rows), so the
 * reset lands as a real command. On a clean parser NULs are ignored — no visible
 * output. RECEIPT_PRINT_FLUSH_KB overrides the size; 0 disables.
 */
const DEFAULT_FLUSH_PREAMBLE_KB = 18;

function flushPreambleBuffer(): Buffer {
  const raw = process.env.RECEIPT_PRINT_FLUSH_KB?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  const kb =
    Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_FLUSH_PREAMBLE_KB;
  if (kb === 0) return Buffer.alloc(0);
  return Buffer.concat([Buffer.alloc(kb * 1024, 0), Buffer.from([0x1b, 0x40])]);
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
  await waitForPrinterSettled(printerName);
  const spoolStart = Date.now();
  await runLpJob(printerName, Buffer.concat([flushPreambleBuffer(), data]));
  const spoolMs = Date.now() - spoolStart;
  const drainMs = await waitForQueueDrain(printerName);
  console.info(
    `[print] single job (${data.length}B): spooled ${spoolMs}ms, ` +
      `drained ${drainMs < 0 ? "TIMEOUT" : `${drainMs}ms`}`,
  );
  recordJobSent(printerName);
}

/**
 * The POS-80 clone can garble a job that arrives while it is still physically
 * printing the previous one (its receive buffer is busiest then — back-to-back
 * test prints reproduced this; spaced prints never did). CUPS marks a job done
 * once bytes are handed to USB, before the paper stops moving, so queue-idle
 * alone is not enough: also enforce a settle gap after the last job we sent.
 */
const PRINTER_SETTLE_MS = 8_000;
const QUEUE_IDLE_TIMEOUT_MS = 30_000;
const QUEUE_POLL_MS = 500;

const lastJobSentAtByPrinter = new Map<string, number>();

function recordJobSent(printerName: string): void {
  lastJobSentAtByPrinter.set(printerName, Date.now());
}

function queueHasPendingJobs(printerName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("lpstat", ["-o", printerName], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let stdout = "";
    proc.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    proc.on("error", () => resolve(false));
    proc.on("close", () => resolve(stdout.trim().length > 0));
  });
}

async function waitForPrinterSettled(printerName: string): Promise<void> {
  const deadline = Date.now() + QUEUE_IDLE_TIMEOUT_MS;
  while (await queueHasPendingJobs(printerName)) {
    if (Date.now() >= deadline) {
      console.warn(
        `[print] CUPS queue for ${printerName} still busy after ${QUEUE_IDLE_TIMEOUT_MS}ms — printing anyway`,
      );
      return;
    }
    await sleep(QUEUE_POLL_MS);
  }

  const lastSentAt = lastJobSentAtByPrinter.get(printerName);
  if (lastSentAt === undefined) return;
  const remaining = PRINTER_SETTLE_MS - (Date.now() - lastSentAt);
  if (remaining > 0) {
    console.info(`[print] settling ${remaining}ms before next job`);
    await sleep(remaining);
  }
}

/**
 * Wait until the CUPS queue is empty and report how long it took. Drain time is
 * the USB hand-off: it stretches exactly when the printer's receive buffer is
 * full and flow control stalls the transfer — a per-job pressure gauge for
 * diagnosing the clone's drop-under-saturation bug. Returns -1 on timeout.
 */
async function waitForQueueDrain(printerName: string): Promise<number> {
  const start = Date.now();
  while (await queueHasPendingJobs(printerName)) {
    if (Date.now() - start >= QUEUE_IDLE_TIMEOUT_MS) return -1;
    await sleep(QUEUE_POLL_MS);
  }
  return Date.now() - start;
}
