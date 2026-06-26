import { encodePathField } from "./path-grid";
import type { SessionEvent, SessionReceipt } from "./types";

/** Deterministic 32-bit seed from session data (shared by print + digital receipt). */
export function computeSessionSeed(
  sessionStart: string,
  events: readonly SessionEvent[],
  path?: SessionReceipt["path"],
): number {
  let h = 2166136261;
  const pathPart = path ? encodePathField(path)?.m ?? "" : "";
  const payload = `${sessionStart}|${events.map((e) => JSON.stringify(e)).join(";")}|${pathPart}`;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
