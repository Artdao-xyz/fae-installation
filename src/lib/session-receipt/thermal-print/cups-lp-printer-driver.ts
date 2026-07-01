import { spawn } from "node:child_process";

/**
 * Minimal `printer` npm driver shape for `node-thermal-printer` CUPS (`printer:Name`) interfaces.
 * Uses macOS `lp -o raw` so we avoid native `printer` bindings in the release package.
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
      const proc = spawn("lp", ["-d", options.printer, "-o", "raw"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stderr = "";
      proc.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      proc.stdin.write(options.data);
      proc.stdin.end();

      proc.on("error", (err) => {
        options.error?.(err);
      });

      proc.on("close", (code) => {
        if (code === 0) {
          options.success?.("lp");
          return;
        }
        const detail = stderr.trim();
        options.error?.(
          new Error(detail || `lp failed with exit code ${code ?? "unknown"}`),
        );
      });
    },
  };
}
