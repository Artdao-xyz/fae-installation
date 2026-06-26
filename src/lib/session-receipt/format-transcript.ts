import type { SessionEvent } from "./types";
import { RECEIPT_LINE_WIDTH } from "./types";

const TAXONOMY_LABEL: Record<string, string> = {
  focus: "Focus",
  activity: "Activity",
  format: "Mode",
  network: "Network",
  artist: "Artist",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function wrapLine(text: string, width = RECEIPT_LINE_WIDTH): string[] {
  if (text.length <= width) return [text];
  const lines: string[] = [];
  let rest = text;
  while (rest.length > width) {
    let breakAt = rest.lastIndexOf(" ", width);
    if (breakAt <= 0) breakAt = width;
    lines.push(rest.slice(0, breakAt).trimEnd());
    rest = rest.slice(breakAt).trimStart();
  }
  if (rest.length > 0) lines.push(rest);
  return lines;
}

export type TranscriptLine = {
  time: string;
  text: string;
};

export function formatSessionTranscript(
  events: readonly SessionEvent[],
): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const event of events) {
    const time = formatTime(event.ts);
    if (event.type === "tag") {
      const prefix = `${TAXONOMY_LABEL[event.taxonomy] ?? event.taxonomy}: `;
      const action = event.action === "on" ? "+" : "-";
      const body = `${action} ${prefix}${event.label}`;
      for (const part of wrapLine(body)) {
        lines.push({ time, text: part });
      }
    } else {
      for (const part of wrapLine(event.title)) {
        lines.push({ time, text: part });
      }
    }
  }
  return lines;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatReceiptDate(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
