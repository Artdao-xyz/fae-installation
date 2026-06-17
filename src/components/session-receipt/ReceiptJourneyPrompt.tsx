import {
  formatTagFortuneLine,
} from "@/lib/session-receipt/journey-prompt";
import { THERMAL_CHARS_PER_LINE } from "@/lib/session-receipt/thermal-spec";

type ReceiptJourneyPromptProps = {
  prompt: string;
  /** Wrap width in characters — matches 58mm thermal line width. */
  lineWidth?: number;
};

function wrapLine(text: string, width: number): string[] {
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

export function ReceiptJourneyPrompt({
  prompt,
  lineWidth = THERMAL_CHARS_PER_LINE,
}: ReceiptJourneyPromptProps) {
  const lines = wrapLine(formatTagFortuneLine(prompt), lineWidth);

  return (
    <div className="mt-3 space-y-1 text-center text-[10px] leading-[13px]">
      {lines.map((line, i) => (
        <p key={`${i}-${line.slice(0, 12)}`}>{line}</p>
      ))}
    </div>
  );
}
