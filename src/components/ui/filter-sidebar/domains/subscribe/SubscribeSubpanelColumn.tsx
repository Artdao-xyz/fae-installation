"use client";

import { FormEvent, useState } from "react";
import { FilterSidebarDomainTrailing } from "../../primitives/FilterSidebarDomainTrailing";
import { filterSubpanelGuideViewportHeightClass } from "../../shell/layout-classes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeSubpanelColumnProps = {
  mergeTopBorder?: boolean;
  splitHeight?: boolean;
};

type SubscribePanelContentProps = {
  className?: string;
  tabbed?: boolean;
};

export function SubscribePanelContent({
  className = "scrollbar-hide flex min-h-0 min-w-0 flex-col overflow-y-auto bg-surface-canvas",
  tabbed = false,
}: SubscribePanelContentProps) {
  const [activeTab, setActiveTab] = useState<"newsletter" | "telegram" | "community">(
    "newsletter",
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [updatesConsent, setUpdatesConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const bodyTextClass = tabbed ? "text-base leading-6" : "text-xs leading-[17px]";
  const consentTextClass = tabbed
    ? "text-xs leading-[16px]"
    : "text-[10px] leading-[12px]";
  const consentRowClass = tabbed
    ? "group mt-4 flex w-full items-start gap-2 text-left transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
    : "group mt-5 flex w-full items-center gap-2 text-left transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";
  const consentRowSecondaryClass = tabbed
    ? "group mt-[10px] flex w-full items-start gap-2 text-left transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
    : "group mt-4 flex w-full items-center gap-2 text-left transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";
  const newsletterFormClass = tabbed
    ? "flex h-full min-h-full w-full flex-col justify-between bg-surface-canvas px-[15px] pb-5 pt-12"
    : "w-full bg-surface-canvas px-[15px] py-7";
  const inputPaddingClass = tabbed ? "py-4" : "py-5";
  const ctaButtonClass = "w-full";
  const ctaButtonPaddingClass = tabbed ? "py-2" : "py-3";

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

  const newsletterInputs = (
    <div className="mx-auto flex w-full flex-col items-center">
      <div className="w-full border-t-hairline border-dotted border-border" />
      <input
        type="text"
        name="tfa_2"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
        className={`w-full border-0 bg-transparent ${inputPaddingClass} text-center font-fira-mono ${bodyTextClass} text-ink-body placeholder:text-ink-body/60 focus:outline-none`}
      />
      <div className="w-full border-t-hairline border-dotted border-border" />
      <input
        type="text"
        name="tfa_4"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
        className={`w-full border-0 bg-transparent ${inputPaddingClass} text-center font-fira-mono ${bodyTextClass} text-ink-body placeholder:text-ink-body/60 focus:outline-none`}
      />
      <div className="w-full border-t-hairline border-dotted border-border" />
      <input
        type="email"
        name="tfa_6"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={`w-full border-0 bg-transparent ${inputPaddingClass} text-center font-fira-mono ${bodyTextClass} text-ink-body placeholder:text-ink-body/60 focus:outline-none`}
      />
      <div className="w-full border-t-hairline border-dotted border-border" />
    </div>
  );

  const newsletterConsentControls = (
    <div className="mx-auto flex w-full flex-col items-center">
      <button
        type="button"
        onClick={() => setNewsletterConsent((v) => !v)}
        className={consentRowClass}
        aria-pressed={newsletterConsent}
        data-domain-active={newsletterConsent ? "true" : undefined}
      >
        <FilterSidebarDomainTrailing tone="latest-updates" />
        <span className={`min-w-0 flex-1 font-fira-mono ${consentTextClass} text-ink-body/60`}>
          Please add me to the Serpentine Arts Technologies newsletter
        </span>
      </button>
      <button
        type="button"
        onClick={() => setUpdatesConsent((v) => !v)}
        className={consentRowSecondaryClass}
        aria-pressed={updatesConsent}
        data-domain-active={updatesConsent ? "true" : undefined}
      >
        <FilterSidebarDomainTrailing tone="latest-updates" />
        <span className={`min-w-0 flex-1 font-fira-mono ${consentTextClass} text-ink-body/60`}>
          I&apos;d like to receive email updates from Serpentine
        </span>
      </button>
      {message ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`mt-4 text-center font-fira-mono ${consentTextClass} ${
            status === "error"
              ? "text-(--color-filter-pill-selection)"
              : "text-ink-body/60"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );

  const newsletterSubmitButton = (
    <button
      type="submit"
      disabled={status === "loading"}
      className={`inline-flex ${ctaButtonClass} items-center justify-center gap-2 border-hairline border-solid border-border bg-surface-canvas px-[50px] ${ctaButtonPaddingClass} font-fira-mono ${bodyTextClass} text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
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
  );

  const newsletterForm = (
    <form
      className={newsletterFormClass}
      onSubmit={submitSubscribeForm}
      noValidate
    >
      {newsletterInputs}
      {tabbed ? (
        <div className="flex w-full flex-col gap-5">
          {newsletterConsentControls}
          <div className="flex justify-center">{newsletterSubmitButton}</div>
        </div>
      ) : (
        <>
          {newsletterConsentControls}
          <div className="mt-6 flex justify-center">{newsletterSubmitButton}</div>
        </>
      )}
    </form>
  );

  const bottomLinks = (
    <div className="flex w-full flex-col border-t-hairline border-solid border-border bg-surface-canvas px-[15px] py-2">
      <p className="m-0 mb-2 text-left font-lust-text text-xs font-normal leading-4 text-ink-body">
        Resources
      </p>
      <a
        href="https://t.me/+RpackhOIPmQyODY0"
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full min-w-0 items-center justify-start gap-2 py-1 text-left font-fira-mono text-xs leading-4 text-ink-body transition-colors underline decoration-solid underline-offset-2 hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
      >
        <span className="min-w-0">Join the Telegram Group</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/blue-arrow.svg"
          alt=""
          width={5}
          height={7}
          className="block h-[7px] w-[5px] shrink-0"
          aria-hidden
        />
      </a>
      <a
        href="https://serpentinegalleries.ticketing.veevartapp.com/tickets/view/list/future-art-ecosystems-community-call-05032026"
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full min-w-0 items-center justify-start gap-2 py-1 underline decoration-solid underline-offset-2 text-left font-fira-mono text-xs leading-4 text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
      >
        <span className="min-w-0">Join our monthly Community Call</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/blue-arrow.svg"
          alt=""
          width={5}
          height={7}
          className="block h-[7px] w-[5px] shrink-0"
          aria-hidden
        />
      </a>
    </div>
  );

  const telegramContent = (
    <section className="flex h-full min-h-full flex-col justify-between bg-surface-canvas px-[15px] py-5">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className={`text-center font-fira-mono ${bodyTextClass} text-ink-body/60`}>
          Get Involved in our community
        </p>
      </div>
      <div className="flex justify-center">
        <a
          href="https://t.me/+RpackhOIPmQyODY0"
          target="_blank"
          rel="noreferrer"
          className={`inline-flex ${ctaButtonClass} items-center justify-center gap-2 border-hairline border-solid border-border bg-surface-canvas px-[50px] py-2 font-fira-mono ${bodyTextClass} text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
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
  );

  const communityCallContent = (
    <section className="flex h-full min-h-full flex-col justify-between bg-surface-canvas px-[15px] py-5">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className={`text-center font-fira-mono ${bodyTextClass} text-ink-body/60`}>
          Netx Call: 5 March, 2pm (UTC)
        </p>
      </div>
      <div className="flex justify-center">
        <a
          href="https://serpentinegalleries.ticketing.veevartapp.com/tickets/view/list/future-art-ecosystems-community-call-05032026"
          target="_blank"
          rel="noreferrer"
          className={`inline-flex ${ctaButtonClass} items-center justify-center gap-2 border-hairline border-solid border-border bg-surface-canvas px-[50px] py-2 font-fira-mono ${bodyTextClass} text-ink-body transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
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
  );

  if (tabbed) {
    return (
      <div className={className}>
        <div
          className="grid w-full shrink-0 grid-cols-3 border-b-hairline border-solid border-border"
          role="tablist"
          aria-label="Subscribe sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "newsletter"}
            onClick={() => setActiveTab("newsletter")}
            className={`h-11 border-r-hairline border-r-solid border-r-border px-2 font-lust-text text-sm font-normal leading-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
              activeTab === "newsletter"
                ? "border-t-[3px] border-t-solid border-t-(--color-filter-pill-selection) text-(--color-filter-pill-selection)"
                : "border-t-hairline border-t-solid border-t-border text-ink-body/70 hover:bg-surface-hover/60"
            }`}
          >
            Newsletter
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "telegram"}
            onClick={() => setActiveTab("telegram")}
            className={`h-11 border-r-hairline border-r-solid border-r-border px-2 font-lust-text text-sm font-normal leading-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
              activeTab === "telegram"
                ? "border-t-[3px] border-t-solid border-t-(--color-filter-pill-selection) text-(--color-filter-pill-selection)"
                : "border-t-hairline border-t-solid border-t-border text-ink-body/70 hover:bg-surface-hover/60"
            }`}
          >
            Telegram
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "community"}
            onClick={() => setActiveTab("community")}
            className={`h-11 px-2 font-lust-text text-sm font-normal leading-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
              activeTab === "community"
                ? "border-t-[3px] border-t-solid border-t-(--color-filter-pill-selection) text-(--color-filter-pill-selection)"
                : "border-t-hairline border-t-solid border-t-border text-ink-body/70 hover:bg-surface-hover/60"
            }`}
          >
            Community Call
          </button>
        </div>
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto bg-surface-canvas">
          {activeTab === "newsletter" ? newsletterForm : null}
          {activeTab === "telegram" ? telegramContent : null}
          {activeTab === "community" ? communityCallContent : null}
        </div>
      </div>
    );
  }

  /** Desktop sidebar subscribe panel (`SubscribeSubpanelColumn`): newsletter + footer links only. */
  return (
    <div className={className}>
      <div className="px-[15px] pt-4 pb-2">
        <p className="m-0 text-left font-lust-text text-sm font-normal leading-4 text-ink-body">
          Newsletter
        </p>
      </div>
      {newsletterForm}
      {bottomLinks}
    </div>
  );
}

export function SubscribeSubpanelColumn({
  mergeTopBorder,
  splitHeight = false,
}: SubscribeSubpanelColumnProps) {
  return (
    <div
      className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-l-0 border-r-0 border-solid border-border bg-surface-canvas ${filterSubpanelGuideViewportHeightClass(splitHeight)} ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Subscribe"
    >
      <SubscribePanelContent />
    </div>
  );
}
