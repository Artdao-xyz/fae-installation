#!/usr/bin/env node
import { SAMPLE_SESSION_RECEIPT } from "../src/lib/session-receipt/sample-receipt.ts";
import { buildSessionReceiptEscPosBuffer } from "../src/lib/session-receipt/thermal-print/receipt-print.ts";
import { buildSessionReceiptRaster } from "../src/lib/session-receipt/thermal-print/raster-receipt-layout.ts";
import { buildEscPosRasterCommand } from "../src/lib/session-receipt/thermal-print/star-raster.ts";

function validateEscPos(buf) {
  const issues = [];
  let i = 0;
  while (i < buf.length - 8) {
    if (buf[i] === 0x1d && buf[i + 1] === 0x76 && buf[i + 2] === 0x30) {
      const bytesPerRow = buf[i + 4] + (buf[i + 5] << 8);
      const height = buf[i + 6] + (buf[i + 7] << 8);
      const expected = 8 + bytesPerRow * height;
      const available = buf.length - i;
      if (available < expected) {
        issues.push(
          `GSv0 at ${i}: need ${expected} bytes, have ${available} (short by ${expected - available})`,
        );
      }
      i += expected;
      continue;
    }
    i++;
  }
  return issues;
}

function checkRaster(label, receipt, origin) {
  const sections = buildSessionReceiptRaster(receipt, origin);
  return sections.then((secs) => {
    console.log(`\n[${label}]`);
    for (const { align, raster: r } of secs) {
      const expected = r.bytesPerRow * r.heightDots;
      const cmd = buildEscPosRasterCommand(r);
      console.log({
        align,
        widthDots: r.widthDots,
        heightDots: r.heightDots,
        bytesPerRow: r.bytesPerRow,
        dataLen: r.data.length,
        expected,
        match: r.data.length === expected,
        cmdLen: cmd.length,
      });
      if (r.data.length !== expected) {
        console.log("ERROR: raster data length mismatch");
      }
    }
    return buildSessionReceiptEscPosBuffer(receipt, origin).then((buf) => {
      const issues = validateEscPos(buf);
      console.log("escpos bytes:", buf.length);
      console.log("GSv0 issues:", issues.length ? issues : "none");
      return { buf, issues };
    });
  });
}

const longReceipt = {
  ...SAMPLE_SESSION_RECEIPT,
  events: [
    ...SAMPLE_SESSION_RECEIPT.events,
    ...Array.from({ length: 30 }, (_, n) => ({
      type: "page",
      title: `Extra page title number ${n} with a longer title for wrapping`,
      slug: `page-${n}`,
      ts: Date.parse(SAMPLE_SESSION_RECEIPT.sessionStart) + 500_000 + n * 60_000,
    })),
  ],
};

await checkRaster("sample", SAMPLE_SESSION_RECEIPT, "http://localhost:3000");
await checkRaster("long journey", longReceipt, "http://192.168.1.50:3000");
