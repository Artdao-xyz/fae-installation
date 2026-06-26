import { PATH_GRID_SIZE } from "./path-grid";
import type { SessionReceipt } from "./types";

const SESSION_START = "2026-06-19T14:00:00.000Z";
const T0 = Date.parse(SESSION_START);

function buildSamplePath() {
  const visits = Array<number>(PATH_GRID_SIZE).fill(0);
  const cells = [18, 19, 20, 34, 35, 36, 50, 51, 65, 66, 80, 94, 108, 122];
  for (const cell of cells) {
    visits[cell] = 1 + (cell % 4);
  }
  visits[51] = 6;
  visits[66] = 4;
  return { visits, start: cells[0]!, end: cells[cells.length - 1]! };
}

/** Fixed session for thermal preview + ESC/POS export (design / print review). */
export const SAMPLE_SESSION_RECEIPT: SessionReceipt = {
  sessionStart: SESSION_START,
  sessionEnd: "2026-06-19T14:18:00.000Z",
  seed: 42,
  prompt:
    "Trust the detour. The most interesting work happens between categories.",
  path: buildSamplePath(),
  events: [
    {
      type: "tag",
      action: "on",
      label: "AI",
      taxonomy: "focus",
      ts: T0 + 45_000,
    },
    {
      type: "page",
      title: "Worldbuilding with Machine Learning",
      slug: "worldbuilding-ml",
      focusAreas: ["AI"],
      ts: T0 + 120_000,
    },
    {
      type: "tag",
      action: "on",
      label: "Exhibition",
      taxonomy: "activity",
      ts: T0 + 180_000,
    },
    {
      type: "page",
      title: "Serpentine Arts Technologies",
      slug: "serpentine-arts-technologies",
      ts: T0 + 240_000,
    },
    {
      type: "tag",
      action: "on",
      label: "Network",
      taxonomy: "focus",
      ts: T0 + 360_000,
    },
    {
      type: "page",
      title: "Decentralised Cultural Infrastructure",
      slug: "decentralised-cultural-infrastructure",
      focusAreas: ["Network"],
      ts: T0 + 420_000,
    },
  ],
};
