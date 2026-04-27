"use client";

import { FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Figma: top + right hairline, canvas fill (`#e8e8e8`). */
const SUBSCRIBE_CELL_CLASS =
  "box-border h-filter-chrome-bar w-[230px] border-t-hairline border-r-hairline border-solid border-[#454545] bg-surface-canvas";

const HEADER_BUTTON_FOCUS =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";

export type EmailSubscriptionProps = {
  className?: string;
  /** Visually matches Figma header line; also used for the accessible section title. */
  headerLabel?: string;
  /** Optional extra copy below the widget (Suisse body). */
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  /** When set, called instead of POST `/api/newsletter/subscribe`. */
  onSubscribe?: (email: string) => Promise<void>;
  /** If true, email + Send rows start open. */
  defaultExpanded?: boolean;
  /** Forces the expandable form closed when true. */
  forceCollapsed?: boolean;
};

export function EmailSubscription({
  className = "",
  headerLabel = "Subscribe to our Newsletter",
  description,
  placeholder = "Type your email here",
  submitLabel = "Send",
  onSubscribe,
  defaultExpanded = false,
  forceCollapsed = false,
}: EmailSubscriptionProps) {
  const id = useId();
  const fieldId = `${id}-email`;
  const feedbackTitleId = `${id}-feedback-title`;
  const feedbackMessageId = `${id}-feedback-message`;
  const feedbackCloseRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    feedbackCloseRef.current?.focus();
  }, [message]);

  useEffect(() => {
    if (!forceCollapsed) return;
    setExpanded(false);
  }, [forceCollapsed]);

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isValidEmail(email)) {
        setStatus("error");
        setMessage("Enter a valid email address.");
        return;
      }

      setStatus("loading");
      setMessage(null);

      try {
        if (onSubscribe) {
          await onSubscribe(email.trim());
        } else {
          const res = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() }),
          });
          const data: unknown = await res.json().catch(() => null);
          const errMsg =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Something went wrong. Try again later.";

          if (!res.ok) {
            throw new Error(errMsg);
          }
        }

        setStatus("success");
        setMessage("Thanks — you’re subscribed.");
        setEmail("");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong.");
      }
    },
    [email, onSubscribe],
  );

  return (
    <section
      className={`shrink-0 text-ink-body ${
        expanded
          ? "flex h-[calc(var(--height-filter-chrome-bar)*2)] w-[460px] flex-col"
          : "flex h-filter-chrome-bar w-[230px] items-stretch"
      } ${className}`}
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="sr-only">
        {headerLabel}
      </h2>

      {description ? (
        <p className="sr-only">{description}</p>
      ) : null}

      {!expanded ? (
        <button
          type="button"
          className={`${SUBSCRIBE_CELL_CLASS} flex cursor-pointer items-center justify-center gap-2.5 px-[15px] py-2 ${HEADER_BUTTON_FOCUS}`}
          aria-expanded={false}
          onClick={() => setExpanded(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small static mark from Figma */}
          <img
            src="/svg/subscribe.svg"
            alt=""
            width={14}
            height={14}
            className="m-0 block size-[14px] shrink-0"
            aria-hidden
            draggable={false}
          />
          <span className="min-w-0 flex-1 truncate text-left font-suisseintl text-xs font-normal leading-[15px] text-ink-body">
            {headerLabel}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/svg/open.svg"
            alt=""
            width={9}
            height={7}
            className="m-0 block h-[7px] w-[9px] shrink-0 -rotate-90"
            aria-hidden
            draggable={false}
          />
        </button>
      ) : (
        <form
          className="flex h-full flex-col items-start"
          onSubmit={submit}
          noValidate
          aria-busy={status === "loading"}
        >
          <div className="flex h-filter-chrome-bar items-stretch">
            <button
              type="button"
              className={`${SUBSCRIBE_CELL_CLASS} flex cursor-pointer items-center justify-center gap-2.5 px-[15px] py-2 ${HEADER_BUTTON_FOCUS}`}
              aria-expanded={true}
              onClick={() => setExpanded(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small static mark from Figma */}
              <img
                src="/svg/subscribe.svg"
                alt=""
                width={14}
                height={14}
                className="m-0 block size-[14px] shrink-0"
                aria-hidden
                draggable={false}
              />
              <span className="min-w-0 flex-1 truncate text-left font-suisseintl text-xs font-normal leading-[15px] text-ink-body">
                {headerLabel}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/svg/open.svg"
                alt=""
                width={9}
                height={7}
              className="m-0 block h-[7px] w-[9px] shrink-0 rotate-90"
                aria-hidden
                draggable={false}
              />
            </button>
            <div className="h-filter-chrome-bar w-[230px]" aria-hidden />
          </div>

          <div className="flex h-filter-chrome-bar items-stretch">
            <label className="sr-only" htmlFor={fieldId}>
              Email address
            </label>
            <input
              id={fieldId}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder={placeholder}
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                if (status !== "idle") {
                  setStatus("idle");
                  setMessage(null);
                }
              }}
              disabled={status === "loading"}
              className={`${SUBSCRIBE_CELL_CLASS} min-w-0 px-[15px] py-2 text-center font-fira-mono text-[10px] leading-[15px] text-ink-body placeholder:text-[10px] placeholder:leading-[15px] placeholder:text-ink-body/60 focus:outline-none`}
            />

            <button
              type="submit"
              className={`${SUBSCRIBE_CELL_CLASS} border-t-0 flex cursor-pointer items-center justify-center gap-2 border-[#424242] px-[50px] py-2 font-fira-mono text-[10px] leading-[15px] text-ink-body ${HEADER_BUTTON_FOCUS} disabled:pointer-events-none disabled:opacity-50`}
              disabled={status === "loading"}
            >
              <span>{status === "loading" ? "Sending…" : submitLabel}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/svg/blue-arrow.svg"
                alt=""
                width={5}
                height={7}
                className="m-0 block h-[7px] w-[5px] shrink-0"
                aria-hidden
                draggable={false}
              />
            </button>
          </div>
        </form>
      )}

      {message ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={feedbackTitleId}
          aria-describedby={feedbackMessageId}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 px-4"
        >
          <div className="w-full max-w-[230px] border-hairline border-solid border-ink-primary bg-surface-canvas p-3 shadow-none">
            <h3
              id={feedbackTitleId}
              className="mb-2 font-suisseintl text-xs font-normal leading-[15px] text-ink-body"
            >
              {status === "error" ? "Subscription error" : "Subscription received"}
            </h3>
            <p
              id={feedbackMessageId}
              className={`mb-3 font-fira-mono text-[10px] leading-[15px] ${
                status === "error" ? "text-(--color-filter-pill-selection)" : "text-ink-caption"
              }`}
            >
              {message}
            </p>
            <button
              ref={feedbackCloseRef}
              type="button"
              onClick={() => setMessage(null)}
              className={`${SUBSCRIBE_CELL_CLASS} flex h-[30px] w-full cursor-pointer items-center justify-center px-[15px] py-2 font-fira-mono text-[10px] leading-[15px] text-ink-body ${HEADER_BUTTON_FOCUS}`}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
