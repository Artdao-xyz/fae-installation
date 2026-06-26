import { deriveTagFortune } from "./journey-prompt";
import { clonePath, hasPathActivity } from "./path-grid";
import { computeSessionSeed } from "./seed";
import type { SessionEvent, SessionReceipt } from "./types";

export function buildSessionReceipt(
  sessionStart: string,
  events: readonly SessionEvent[],
  sessionEnd?: string,
  path?: SessionReceipt["path"],
): SessionReceipt {
  const pathSnapshot =
    path && hasPathActivity(path) ? clonePath(path) : undefined;
  const seed = computeSessionSeed(sessionStart, events, pathSnapshot);
  const prompt = deriveTagFortune(events, seed);
  return {
    sessionStart,
    sessionEnd,
    events: [...events],
    path: pathSnapshot,
    seed,
    prompt,
  };
}
