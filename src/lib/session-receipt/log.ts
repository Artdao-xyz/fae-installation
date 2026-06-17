import { describeReceiptPayload } from "./encode";
import type { SessionEvent, SessionReceipt } from "./types";

const LOG_PREFIX = "[session-receipt]";

/** Human-readable summary of what installation mode records. */
export const SESSION_TRACKING_DESCRIPTION = {
  tag: "Tag toggles — Focus, Activity, Format (Mode), Network, Artist (on/off + label)",
  page: "Project opens — title + slug when content preview opens",
  path: "Pointer path — 16×10 grid sampled every 120ms (star map on receipt)",
} as const;

function formatEventTime(ts: number): string {
  return new Date(ts).toISOString();
}

export function formatSessionEventForLog(event: SessionEvent): string {
  const time = formatEventTime(event.ts);
  if (event.type === "tag") {
    const sign = event.action === "on" ? "+" : "-";
    return `${time}  tag:${event.taxonomy} ${sign} "${event.label}"`;
  }
  const slug = event.slug ? ` (${event.slug})` : "";
  return `${time}  page: "${event.title}"${slug}`;
}

export function logSessionTrackingEnabled(): void {
  console.info(`${LOG_PREFIX} Session tracking active`);
  console.info(`${LOG_PREFIX} Capturing:`);
  console.info(`  • ${SESSION_TRACKING_DESCRIPTION.tag}`);
  console.info(`  • ${SESSION_TRACKING_DESCRIPTION.page}`);
  console.info(`  • ${SESSION_TRACKING_DESCRIPTION.path}`);
}

export function logSessionEvent(event: SessionEvent, index: number): void {
  console.log(`${LOG_PREFIX} +event #${index + 1}`, formatSessionEventForLog(event));
}

export function logSessionSnapshot(
  label: string,
  sessionStart: string,
  events: readonly SessionEvent[],
): void {
  console.group(`${LOG_PREFIX} ${label} (${events.length} events)`);
  console.log("sessionStart:", sessionStart);
  if (events.length === 0) {
    console.log("(no events yet)");
  } else {
    events.forEach((event, i) => {
      console.log(`  ${i + 1}. ${formatSessionEventForLog(event)}`);
    });
  }
  console.groupEnd();
}

export function logSessionReceipt(label: string, receipt: SessionReceipt): void {
  console.group(`${LOG_PREFIX} ${label}`);
  console.log("sessionStart:", receipt.sessionStart);
  console.log("sessionEnd:", receipt.sessionEnd ?? "(none)");
  console.log("seed:", receipt.seed);
  console.log("prompt:", receipt.prompt);
  console.log("events:", receipt.events.length);
  console.log("path:", receipt.path ? "yes" : "no");
  console.log("QR payload:", describeReceiptPayload(receipt));
  receipt.events.forEach((event, i) => {
    console.log(`  ${i + 1}. ${formatSessionEventForLog(event)}`);
  });
  console.groupEnd();
}

export function logReceiptQrUrl(url: string): void {
  console.info(`${LOG_PREFIX} QR → /view (${url.length} chars, no database)`);
  console.info(`${LOG_PREFIX} ${url}`);
}

/** Server-side logging (same shape as client). */
export function logSessionReceiptServer(label: string, receipt: SessionReceipt): void {
  logSessionReceipt(label, receipt);
}
