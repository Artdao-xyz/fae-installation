"use client";

import { useState } from "react";
import { FilterSidebarDomainTrailing } from "../../primitives/FilterSidebarDomainTrailing";
import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";

type SubscribeSubpanelColumnProps = {
  onClose: () => void;
  mergeTopBorder?: boolean;
};

export function SubscribeSubpanelColumn({
  onClose,
  mergeTopBorder,
}: SubscribeSubpanelColumnProps) {
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [updatesConsent, setUpdatesConsent] = useState(false);

  return (
    <div
      className={`flex h-fit min-h-0 max-h-[calc(100dvh-(var(--inset-margin-guide)*2))] w-full shrink-0 flex-col overflow-hidden border-l-0 border-r-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Subscribe"
    >
      <SubpanelCloseBar onClose={onClose} showTopBorder={false} />
      <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-y-auto bg-surface-canvas">
        <section className="w-full bg-surface-canvas px-[15px] py-5">
          <div className="mx-auto flex w-full flex-col items-center">
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="w-full border-0 bg-transparent py-2 text-center font-fira-mono text-xs leading-[17px] text-ink-body placeholder:text-ink-body/60 focus:outline-none"
            />
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="w-full border-0 bg-transparent py-2 text-center font-fira-mono text-xs leading-[17px] text-ink-body placeholder:text-ink-body/60 focus:outline-none"
            />
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full border-0 bg-transparent py-2 text-center font-fira-mono text-xs leading-[17px] text-ink-body placeholder:text-ink-body/60 focus:outline-none"
            />
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <button
              type="button"
              onClick={() => setNewsletterConsent((v) => !v)}
              className="group mt-4 flex w-full items-start gap-2 text-left transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
              aria-pressed={newsletterConsent}
              data-domain-active={newsletterConsent ? "true" : undefined}
            >
              <FilterSidebarDomainTrailing tone="latest-updates" />
              <span className="font-fira-mono text-[10px] leading-[12px] text-ink-body/60">
                Please add me to the Serpentine Arts Technologies newsletter
              </span>
            </button>
            <button
              type="button"
              onClick={() => setUpdatesConsent((v) => !v)}
              className="group mt-[10px] flex w-full items-start gap-2 text-left transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
              aria-pressed={updatesConsent}
              data-domain-active={updatesConsent ? "true" : undefined}
            >
              <FilterSidebarDomainTrailing tone="latest-updates" />
              <span className="font-fira-mono text-[10px] leading-[12px] text-ink-body/60">
                I&apos;d like to receive email updates from Serpentine
              </span>
            </button>
            <button
              type="button"
              className="mt-5 inline-flex w-[200px] items-center justify-center gap-2 border-hairline border-solid border-[#424242] bg-surface-canvas px-[50px] py-2 font-fira-mono text-xs leading-[17px] text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
            >
              <span>Submit</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/svg/blue-arrow.svg"
                alt=""
                width={5}
                height={7}
                className="block h-[7px] w-[5px]"
                aria-hidden
              />
            </button>
          </div>
        </section>

        <div className="w-full border-t-hairline border-solid border-[#424242] bg-surface-muted px-[50px] py-2 text-center font-lust-text text-xs leading-[17px] tracking-[0.05px] text-ink-body">
          Telegram
        </div>

        <section className="w-full border-t-hairline border-dotted border-[#454545] bg-surface-canvas px-[15px] py-5">
          <div className="mx-auto flex w-full flex-col items-center gap-5">
            <p className="text-center font-fira-mono text-xs leading-[17px] text-ink-body/60">
              Get Involved in our community
            </p>
            <a
              href="https://t.me/+RpackhOIPmQyODY0"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-[200px] items-center justify-center gap-2 border-hairline border-solid border-[#424242] bg-surface-canvas px-[50px] py-2 font-fira-mono text-xs leading-[17px] text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
            >
              <span>Join</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/svg/blue-arrow.svg"
                alt=""
                width={5}
                height={7}
                className="block h-[7px] w-[5px]"
                aria-hidden
              />
            </a>
          </div>
        </section>

        <div className="w-full border-t-hairline border-solid border-[#424242] bg-surface-muted px-[50px] py-2 text-center font-lust-text text-xs leading-[17px] tracking-[0.05px] text-ink-body">
          Community Call
        </div>

        <section className="w-full border-t-hairline border-dotted border-[#454545] bg-surface-canvas px-[15px] py-5">
          <div className="mx-auto flex w-full flex-col items-center gap-5">
            <p className="text-center font-fira-mono text-xs leading-[17px] text-ink-body/60">
              Netx Call: 5 March, 2pm (UTC)
            </p>
            <a
              href="https://serpentinegalleries.ticketing.veevartapp.com/tickets/view/list/future-art-ecosystems-community-call-05032026"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-[200px] items-center justify-center gap-2 border-hairline border-solid border-[#424242] bg-surface-canvas px-[50px] py-2 font-fira-mono text-xs leading-[17px] text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
            >
              <span>Join</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/svg/blue-arrow.svg"
                alt=""
                width={5}
                height={7}
                className="block h-[7px] w-[5px]"
                aria-hidden
              />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
