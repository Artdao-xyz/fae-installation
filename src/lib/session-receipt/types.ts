import type { SessionPath } from "./path-grid";

export type { SessionPath };

export type SessionTagTaxonomy =
  | "focus"
  | "activity"
  | "format"
  | "network"
  | "artist";

export type SessionEvent =
  | {
      type: "tag";
      action: "on" | "off";
      label: string;
      taxonomy: SessionTagTaxonomy;
      ts: number;
    }
  | {
      type: "page";
      title: string;
      slug?: string;
      /** Focus tags on the opened project — used for tag fortune tally. */
      focusAreas?: string[];
      ts: number;
    };

export type SessionReceipt = {
  sessionStart: string;
  sessionEnd?: string;
  events: SessionEvent[];
  /** Sampled 16×10 pointer journey for star map (optional). */
  path?: SessionPath;
  seed: number;
  /** Tag Fortune suffix only; max 150 characters. */
  prompt: string;
};

export { THERMAL_CHARS_PER_LINE as RECEIPT_LINE_WIDTH } from "./thermal-spec";
export const RECEIPT_TITLE = "processing...";
