"use client";

import { FormEvent, useState } from "react";
import { FilterSidebarDomainTrailing } from "../../primitives/FilterSidebarDomainTrailing";
import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeSubpanelColumnProps = {
  onClose: () => void;
  mergeTopBorder?: boolean;
};

export function SubscribeSubpanelColumn({
  onClose,
  mergeTopBorder,
}: SubscribeSubpanelColumnProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [updatesConsent, setUpdatesConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function submitSubscribeForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      setStatus("error");
      setMessage("Add first name.");
      return;
    }
    if (!trimmedLastName) {
      setStatus("error");
      setMessage("Add last name.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }
    if (!newsletterConsent || !updatesConsent) {
      setStatus("error");
      setMessage("Tick both consent boxes.");
      return;
    }

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          newsletterOptIn: newsletterConsent,
          marketingOptIn: updatesConsent,
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      const error =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Couldn’t subscribe. Try again.";

      if (!res.ok) throw new Error(error);

      setStatus("success");
      setMessage("Subscribed. Thank you.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setNewsletterConsent(false);
      setUpdatesConsent(false);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Couldn’t subscribe. Try again.");
    }
  }

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
        <form
          className="w-full bg-surface-canvas px-[15px] py-5"
          onSubmit={submitSubscribeForm}
          noValidate
        >
          <div className="mx-auto flex w-full flex-col items-center">
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <input
              type="text"
              name="tfa_2"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full border-0 bg-transparent py-2 text-center font-fira-mono text-xs leading-[17px] text-ink-body placeholder:text-ink-body/60 focus:outline-none"
            />
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <input
              type="text"
              name="tfa_4"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full border-0 bg-transparent py-2 text-center font-fira-mono text-xs leading-[17px] text-ink-body placeholder:text-ink-body/60 focus:outline-none"
            />
            <div className="w-full border-t-hairline border-dotted border-ink-primary" />
            <input
              type="email"
              name="tfa_6"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            {message ? (
              <p
                role={status === "error" ? "alert" : "status"}
                className={`mt-4 text-center font-fira-mono text-[10px] leading-[12px] ${
                  status === "error"
                    ? "text-(--color-filter-pill-selection)"
                    : "text-ink-body/60"
                }`}
              >
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-5 inline-flex w-[200px] items-center justify-center gap-2 border-hairline border-solid border-[#424242] bg-surface-canvas px-[50px] py-2 font-fira-mono text-xs leading-[17px] text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
            >
              <span>{status === "loading" ? "Sending..." : "Submit"}</span>
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
        </form>

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
