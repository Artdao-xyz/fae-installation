import { formatTagFortuneLine } from "@/lib/session-receipt/journey-prompt";

type ReceiptJourneyPromptProps = {
  prompt: string;
  className?: string;
};

export function ReceiptJourneyPrompt({
  prompt,
  className = "",
}: ReceiptJourneyPromptProps) {
  return (
    <div
      className={`border-y border-solid border-black py-3 ${className}`.trim()}
    >
      <p className="m-0">{formatTagFortuneLine(prompt)}</p>
    </div>
  );
}
