import { deriveTagFortune } from "./journey-prompt";
import { decodePathField } from "./path-grid";
import { computeSessionSeed } from "./seed";
import type { SessionEvent, SessionReceipt } from "./types";

/** Build a complete receipt from decoded QR fields (seed always derived from data). */
export function normalizeSessionReceipt(
  sessionStart: string,
  events: SessionEvent[],
  options?: {
    sessionEnd?: string;
    prompt?: string;
    path?: SessionReceipt["path"];
  },
): SessionReceipt {
  const path = options?.path;
  const seed = computeSessionSeed(sessionStart, events, path);
  const prompt = options?.prompt ?? deriveTagFortune(events, seed);
  return {
    sessionStart,
    sessionEnd: options?.sessionEnd,
    events,
    path,
    seed,
    prompt,
  };
}
