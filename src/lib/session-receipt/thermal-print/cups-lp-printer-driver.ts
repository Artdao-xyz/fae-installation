import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Minimal `printer` npm driver shape for `node-thermal-printer` CUPS (`printer:Name`) interfaces.
 * Writes the full ESC/POS payload to a temp file, then `lp -o raw <file>` — same as manual
 * debugging with curl. Piping large raster buffers on stdin can truncate when the pipe backs up.
 */
export function createCupsLpPrinterDriver() {
  return {
    getPrinters(): { name: string; status: string }[] {
      return [];
    },

    getPrinter(name: string): { name: string; status: string } {
      return { name, status: "idle" };
    },

    printDirect(options: {
      data: Buffer;
      printer: string;
      type: string;
      docname?: string | false;
      success?: (jobID: string) => void;
      error?: (err: Error) => void;
    }): void {
      void (async () => {
        const tmpPath = join(
          tmpdir(),
          `fae-escpos-${randomBytes(8).toString("hex")}.bin`,
        );

        try {
          await writeFile(tmpPath, options.data);

          const proc = spawn(
            "lp",
            ["-d", options.printer, "-o", "raw", tmpPath],
            { stdio: ["ignore", "pipe", "pipe"] },
          );

          let stderr = "";
          proc.stderr.on("data", (chunk: Buffer | string) => {
            stderr += chunk.toString();
          });

          proc.on("error", (err) => {
            void unlink(tmpPath).catch(() => {});
            options.error?.(err);
          });

          proc.on("close", (code) => {
            void unlink(tmpPath).catch(() => {});
            if (code === 0) {
              options.success?.("lp");
              return;
            }
            const detail = stderr.trim();
            options.error?.(
              new Error(detail || `lp failed with exit code ${code ?? "unknown"}`),
            );
          });
        } catch (err) {
          void unlink(tmpPath).catch(() => {});
          options.error?.(err instanceof Error ? err : new Error(String(err)));
        }
      })();
    },
  };
}
