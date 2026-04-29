"use client";

import { EmailSubscription } from "@/components/ui/email-subscription";
import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";

type SubscribeSubpanelColumnProps = {
  onClose: () => void;
  mergeTopBorder?: boolean;
};

export function SubscribeSubpanelColumn({
  onClose,
  mergeTopBorder,
}: SubscribeSubpanelColumnProps) {
  return (
    <div
      className={`flex max-h-full w-full shrink-0 flex-col overflow-hidden border-l-0 border-r-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Newsletter subscription"
    >
      <SubpanelCloseBar onClose={onClose} />
      <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pb-4 pt-2">
        <EmailSubscription
          fluidLayout
          className="w-full max-w-full shrink-0"
          headerLabel="Subscribe to our Newsletter"
          defaultExpanded
        />
      </div>
    </div>
  );
}
