import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
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
 * 1) FormAssembly: `FORMASSEMBLY_FORM_ACTION` + `FORMASSEMBLY_EMAIL_FIELD` (+ optional `FORMASSEMBLY_FORM_META_JSON`)
 * 2) Fallback webhook: `NEWSLETTER_SUBSCRIBE_WEBHOOK_URL` (JSON body `{ email }`)
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("email" in body)) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  const raw = (body as { email: unknown }).email;
  if (typeof raw !== "string" || !isValidEmail(raw)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = raw.trim().toLowerCase();

  const faAction = process.env.FORMASSEMBLY_FORM_ACTION?.trim();
  const faEmailField = process.env.FORMASSEMBLY_EMAIL_FIELD?.trim();

  if (faAction && faEmailField) {
    const meta = formAssemblyMetaFromEnv();
    const params = new URLSearchParams({ ...meta, [faEmailField]: email });

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
          { error: "Could not complete signup. Try again later." },
          { status: 502 },
        );
      }

      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "Could not complete signup. Try again later." },
        { status: 502 },
      );
    }
  }

  const webhook = process.env.NEWSLETTER_SUBSCRIBE_WEBHOOK_URL;

  if (!webhook) {
    return NextResponse.json(
      {
        error:
          "Newsletter signup is not configured. Set FORMASSEMBLY_FORM_ACTION and FORMASSEMBLY_EMAIL_FIELD (see .env.example), or NEWSLETTER_SUBSCRIBE_WEBHOOK_URL.",
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
      body: JSON.stringify({ email }),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Could not complete signup. Try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not complete signup. Try again later." },
      { status: 502 },
    );
  }
}
