#!/usr/bin/env node
/**
 * Download receipt-sample.escpos from a running installation.
 *
 *   npm run dev
 *   npm run export:receipt-escpos
 *
 * Optional: RECEIPT_EXPORT_BASE_URL=http://192.168.1.10:3000 npm run export:receipt-escpos
 */

import fs from "node:fs";
import path from "node:path";

const base = (process.env.RECEIPT_EXPORT_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const out = outArg
  ? outArg.slice("--out=".length)
  : path.join(process.cwd(), "receipt-sample.escpos");

const url = `${base}/api/receipt-sample/escpos`;

let res;
try {
  res = await fetch(url);
} catch {
  console.error(
    `Could not reach ${url}\nStart the app first: npm run dev`,
  );
  process.exit(1);
}

if (!res.ok) {
  const text = await res.text().catch(() => "");
  console.error(
    `Export failed (${res.status})${text ? `: ${text}` : ""}\nIs the app running at ${base}?`,
  );
  process.exit(1);
}

const buffer = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(out, buffer);
console.log(`Wrote ${out} (${buffer.length} bytes)`);
console.log("Mac print test: lp -o raw receipt-sample.escpos  (with printer configured)");
