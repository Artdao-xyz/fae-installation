import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function booleanField(
  body: Record<string, unknown>,
  key: string,
  expectedValue: string,
): boolean {
  return body[key] === true || body[key] === "true" || body[key] === expectedValue;
}

/**
 * Hidden inputs from your FormAssembly embed (Publish → Embed HTML / view page source).
 * Typical keys: `tfa_dbFormId`, `tfa_dbControl`. JSON object, e.g.
 * `{"tfa_dbFormId":"1234567","tfa_dbControl":"abcdef..."}`.
 *
 * Docs:
 * - Server-side / REST view: https://help.formassembly.com/help/340360-use-a-server-side-script-api
 * - Embed HTML: https://help.formassembly.com/help/340358-embed-your-forms-html
 * - POST shape (community): https://stackoverflow.com/questions/49757033/submit-formassembly-form-via-api
 *
 * If the form uses reCAPTCHA, save & resume, or similar, server-side POST may be blocked until those
 * features are adjusted—see FormAssembly publishing options.
 */
function formAssemblyMetaFromEnv(): Record<string, string> {
  const raw = process.env.FORMASSEMBLY_FORM_META_JSON;
  if (!raw?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number") {
        out[k] = String(v);
      }
    }
    return out;
  } catch {
    return {};
  }
}

function isFormAssemblySuccess(status: number): boolean {
  if (status >= 200 && status < 400) return true;
  /** Thank-you redirects from the processor */
  if (status === 302 || status === 303 || status === 307 || status === 308) return true;
  return false;
}

/**
 * 1) FormAssembly: `FORMASSEMBLY_FORM_ACTION` (+ optional field-name overrides)
 * 2) Fallback webhook: `NEWSLETTER_SUBSCRIBE_WEBHOOK_URL`
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Try again." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Try again." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const firstName = stringField(payload, "firstName") || stringField(payload, "tfa_2");
  const lastName = stringField(payload, "lastName") || stringField(payload, "tfa_4");
  const email = (
    stringField(payload, "email") || stringField(payload, "tfa_6")
  ).toLowerCase();
  const newsletterOptIn =
    booleanField(payload, "newsletterOptIn", "tfa_11") ||
    booleanField(payload, "tfa_11", "tfa_11");
  const marketingOptIn =
    booleanField(payload, "marketingOptIn", "tfa_31") ||
    booleanField(payload, "tfa_31", "tfa_31");

  if (!firstName) {
    return NextResponse.json({ error: "Add first name." }, { status: 400 });
  }
  if (!lastName) {
    return NextResponse.json({ error: "Add last name." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!newsletterOptIn) {
    return NextResponse.json(
      { error: "Tick both consent boxes." },
      { status: 400 },
    );
  }
  if (!marketingOptIn) {
    return NextResponse.json(
      { error: "Tick both consent boxes." },
      { status: 400 },
    );
  }

  const faAction = process.env.FORMASSEMBLY_FORM_ACTION?.trim();
  const faFirstNameField = process.env.FORMASSEMBLY_FIRST_NAME_FIELD?.trim() || "tfa_2";
  const faLastNameField = process.env.FORMASSEMBLY_LAST_NAME_FIELD?.trim() || "tfa_4";
  const faEmailField = process.env.FORMASSEMBLY_EMAIL_FIELD?.trim() || "tfa_6";
  const faNewsletterOptInField =
    process.env.FORMASSEMBLY_NEWSLETTER_OPT_IN_FIELD?.trim() || "tfa_11";
  const faMarketingOptInField =
    process.env.FORMASSEMBLY_MARKETING_OPT_IN_FIELD?.trim() || "tfa_31";

  if (faAction) {
    const meta = formAssemblyMetaFromEnv();
    const params = new URLSearchParams({
      ...meta,
      [faFirstNameField]: firstName,
      [faLastNameField]: lastName,
      [faEmailField]: email,
      [faNewsletterOptInField]: faNewsletterOptInField,
      [faMarketingOptInField]: faMarketingOptInField,
    });

    try {
      const upstream = await fetch(faAction, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: params.toString(),
        redirect: "manual",
      });

      if (!isFormAssemblySuccess(upstream.status)) {
        return NextResponse.json(
          { error: "Couldn’t subscribe. Try again." },
          { status: 502 },
        );
      }

      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "Couldn’t subscribe. Try again." },
        { status: 502 },
      );
    }
  }

  const webhook = process.env.NEWSLETTER_SUBSCRIBE_WEBHOOK_URL;

  if (!webhook) {
    return NextResponse.json(
      {
        error: "Signup unavailable.",
      },
      { status: 503 },
    );
  }

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    const secret = process.env.NEWSLETTER_SUBSCRIBE_WEBHOOK_SECRET;
    if (secret) {
      headers.Authorization = `Bearer ${secret}`;
    }

    const upstream = await fetch(webhook, {
      method: "POST",
      headers,
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        newsletterOptIn,
        marketingOptIn,
      }),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Couldn’t subscribe. Try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Couldn’t subscribe. Try again." },
      { status: 502 },
    );
  }
}
