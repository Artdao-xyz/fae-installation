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
    <p className={`text-[10px] leading-[13px] ${className}`.trim()}>
      {formatTagFortuneLine(prompt)}
    </p>
  );
}
