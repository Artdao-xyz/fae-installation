import { IDLE_TEXT_TILE_SCRAMBLE_ENABLED } from "./config";
import { seededRand } from "./particle-system";

/** Words for one title only (idle text tiles pick from this row’s list). */
export function extractWordsFromTitle(title: string): string[] {
  return title
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
    .filter(Boolean);
}

/** Flattened words from all titles (e.g. debug / legacy). */
export function extractTextChunks(titles: string[]): string[] {
  const chunks: string[] = [];
  for (const title of titles) {
    for (const word of extractWordsFromTitle(title)) {
      chunks.push(word);
    }
  }
  return chunks;
}

const SCRAMBLE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?`~\\\"\\\\¡¿§¶¢£¥©®™†‡•…∞≈≠±÷√∑∏∆ΩΨЖЯ中々";
/** Longer = less frequent scramble “bursts” (per-tile period is base + random variance). */
const SCRAMBLE_BASE_PERIOD_SEC = 9.5;
const SCRAMBLE_PERIOD_VARIANCE_SEC = 5.0;
/** Only the top of the wave counts — higher = shorter, rarer visible scramble. */
const SCRAMBLE_INTENSITY_THRESHOLD = 0.32;
/** How fast glyphs shuffle during a burst (updates per second). Lower = calmer. */
const SCRAMBLE_TICK_HZ = 5;

export function scrambleWord(
  word: string,
  seed: number,
  time: number,
): string {
  if (!word) return word;
  if (!IDLE_TEXT_TILE_SCRAMBLE_ENABLED) return word;
  const period =
    SCRAMBLE_BASE_PERIOD_SEC +
    seededRand(seed * 0.73) * SCRAMBLE_PERIOD_VARIANCE_SEC;
  const phase = seededRand(seed * 1.91) * Math.PI * 2;

  const wave = Math.max(0, Math.sin((time / period) * Math.PI * 2 + phase));
  const intensity = Math.pow(wave, 4.0);
  if (intensity < SCRAMBLE_INTENSITY_THRESHOLD) return word;

  const timeStep = Math.floor(time * SCRAMBLE_TICK_HZ);

  let output = "";
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (!/[a-zA-Z0-9]/.test(char)) {
      output += char;
      continue;
    }

    const slotRand = seededRand(seed * 17.3 + i * 11.7 + timeStep * 3.1);
    if (slotRand < intensity * 0.95) {
      const rand = seededRand(seed * 23.9 + i * 19.1 + timeStep * 5.7);
      const randomChar =
        SCRAMBLE_ALPHABET[Math.floor(rand * SCRAMBLE_ALPHABET.length)];
      output += randomChar;
    } else {
      output += char;
    }
  }

  return output;
}
