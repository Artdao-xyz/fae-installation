"use client";

import { useCallback, useEffect, useState } from "react";
import { INSTALLATION_ADMIN_PIN_HEADER } from "@/lib/installation/constants";
import { isReceiptOriginOverride } from "@/lib/session-receipt/resolve-view-origin";

const PIN_STORAGE_KEY = "fae-installation-admin-pin";

type PrinterOption = {
  id: string;
  label: string;
  interface: string;
  source: "cups" | "linux-device";
};

type InstallationStatus = {
  installationMode: boolean;
  catalogPresent: boolean;
  contentSourceReady: boolean;
  contentSource: "local" | "strapi" | "none";
  configuredDataSource: "local" | "strapi" | null;
  mediaFileCount: number;
  printerConfigured: boolean;
  printerInterface: string | null;
  printerUrlConfigured: boolean;
  receiptViewBaseUrl: string | null;
  lanIp: string | null;
  nodeVersion: string;
  config: {
    printerInterface?: string;
    receiptViewBaseUrl?: string;
    adminPin?: string;
    lastPrintError?: string;
    lastPrintAt?: string;
    lastPrintOk?: boolean;
  };
};

type StatusResponse = {
  ok: boolean;
  status: InstallationStatus;
  urls: {
    kiosk: string;
    admin: string;
    receiptViewOrigin: string;
    savedReceiptViewOrigin?: string | null;
    savedLanOverrideIgnored?: boolean;
  };
};

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-solid border-border py-3 text-sm">
      <span className="text-ink-caption">{label}</span>
      <div className="text-right">
        <span className={ok ? "text-green-700" : "text-red-700"}>
          {ok ? "OK" : "Missing"}
        </span>
        {detail ? (
          <p className="mt-1 max-w-xs break-all font-mono text-xs text-ink-body">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function adminFetch(pin: string, path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set(INSTALLATION_ADMIN_PIN_HEADER, pin);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}

export function AdminPanel() {
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [printers, setPrinters] = useState<PrinterOption[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [receiptViewBaseUrl, setReceiptViewBaseUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(PIN_STORAGE_KEY);
    if (saved) setStoredPin(saved);
  }, []);

  const refresh = useCallback(async (activePin: string) => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, printersRes, configRes] = await Promise.all([
        adminFetch(activePin, "/api/admin/status"),
        adminFetch(activePin, "/api/admin/printers"),
        adminFetch(activePin, "/api/admin/config"),
      ]);

      if (statusRes.status === 401) {
        sessionStorage.removeItem(PIN_STORAGE_KEY);
        setStoredPin(null);
        setError("Session expired. Log in again.");
        return;
      }

      const statusJson = (await statusRes.json()) as StatusResponse & {
        error?: string;
      };
      const printersJson = (await printersRes.json()) as {
        printers?: PrinterOption[];
      };
      const configJson = (await configRes.json()) as {
        config?: InstallationStatus["config"];
        printerInterface?: string | null;
      };

      if (!statusRes.ok || !statusJson.ok) {
        throw new Error(statusJson.error ?? "Failed to load status");
      }

      setStatusData(statusJson);
      setPrinters(printersJson.printers ?? []);
      setSelectedPrinter(
        configJson.printerInterface ??
          statusJson.status.printerInterface ??
          "",
      );
      const savedQrUrl =
        configJson.config?.receiptViewBaseUrl ??
        statusJson.status.receiptViewBaseUrl ??
        "";
      setReceiptViewBaseUrl(
        isReceiptOriginOverride(savedQrUrl) ? savedQrUrl : "",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storedPin) void refresh(storedPin);
  }, [storedPin, refresh]);

  const qrUrlStale = statusData?.urls.savedLanOverrideIgnored === true;

  const login = async () => {
    setLoginError(null);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setLoginError(data.error ?? "Invalid PIN");
      return;
    }
    sessionStorage.setItem(PIN_STORAGE_KEY, pin);
    setStoredPin(pin);
    setPin("");
  };

  const savePrinter = async () => {
    if (!storedPin) return;
    setMessage(null);
    setError(null);
    const res = await adminFetch(storedPin, "/api/admin/config", {
      method: "PATCH",
      body: JSON.stringify({ printerInterface: selectedPrinter }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Failed to save printer");
      return;
    }
    setMessage("Printer saved");
    await refresh(storedPin);
  };

  const saveQrUrl = async (override = receiptViewBaseUrl) => {
    if (!storedPin) return;
    setMessage(null);
    setError(null);
    const res = await adminFetch(storedPin, "/api/admin/config", {
      method: "PATCH",
      body: JSON.stringify({ receiptViewBaseUrl: override }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Failed to save QR URL");
      return;
    }
    setMessage(override ? "Override saved" : "Using automatic LAN detection");
    await refresh(storedPin);
  };

  const testPrint = async () => {
    if (!storedPin) return;
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await adminFetch(storedPin, "/api/admin/test-print", {
        method: "POST",
        body: JSON.stringify(
          selectedPrinter ? { printerInterface: selectedPrinter } : {},
        ),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Test print failed");
      } else {
        setMessage("Test print sent");
      }
      await refresh(storedPin);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    setStoredPin(null);
    setStatusData(null);
  };

  if (!storedPin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <h1 className="font-serif text-2xl text-ink-primary">Installation admin</h1>
        <p className="mt-2 text-sm text-ink-caption">
          Staff access for printer setup and status. Default PIN:{" "}
          <span className="font-mono">fae</span>
        </p>
        <label className="mt-8 block text-sm text-ink-caption" htmlFor="admin-pin">
          PIN
        </label>
        <input
          id="admin-pin"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void login();
          }}
          className="mt-2 w-full border border-solid border-border bg-white px-3 py-2 font-mono text-sm"
          autoComplete="current-password"
        />
        {loginError ? (
          <p className="mt-3 text-sm text-red-700">{loginError}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void login()}
          className="mt-6 border border-solid border-border bg-surface-canvas px-4 py-2 text-sm hover:bg-surface-hover"
        >
          Log in
        </button>
      </main>
    );
  }

  const status = statusData?.status;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink-primary">Installation admin</h1>
          <p className="mt-1 text-sm text-ink-caption">
            Printer setup, QR URL, and health checks.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 border border-solid border-border px-3 py-1.5 text-sm hover:bg-surface-hover"
        >
          Log out
        </button>
      </div>

      {message ? <p className="mt-6 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

      <section className="mt-8 border border-solid border-border bg-white p-4">
        <h2 className="text-sm font-medium text-ink-primary">Status</h2>
        {status ? (
          <div className="mt-2">
            <StatusRow label="Installation mode" ok={status.installationMode} />
            <StatusRow
              label="Content source"
              ok={status.contentSourceReady}
              detail={
                status.contentSource === "local"
                  ? `Local catalog (${status.mediaFileCount} media files)${
                      status.configuredDataSource
                        ? ""
                        : " — auto (FAE_DATA_SOURCE unset)"
                    }`
                  : status.contentSource === "strapi"
                    ? `Live Strapi API${
                        status.configuredDataSource === "strapi"
                          ? ""
                          : " — auto (FAE_DATA_SOURCE unset)"
                      }`
                    : status.configuredDataSource === "local"
                        ? "FAE_DATA_SOURCE=local but catalog missing"
                        : "Set FAE_DATA_SOURCE and STRAPI_URL or sync local data"
              }
            />
            <StatusRow
              label="Printer configured"
              ok={status.printerConfigured}
              detail={status.printerInterface ?? undefined}
            />
            <StatusRow
              label="QR origin"
              ok={Boolean(statusData?.urls.receiptViewOrigin) && !qrUrlStale}
              detail={
                qrUrlStale
                  ? `${statusData?.urls.receiptViewOrigin} (saved: ${statusData?.urls.savedReceiptViewOrigin})`
                  : statusData?.urls.receiptViewOrigin
              }
            />
            <StatusRow label="LAN IP" ok={Boolean(status.lanIp)} detail={status.lanIp ?? undefined} />
            <StatusRow label="Node" ok detail={status.nodeVersion} />
            {status.config.lastPrintAt ? (
              <StatusRow
                label="Last print"
                ok={status.config.lastPrintOk === true}
                detail={
                  status.config.lastPrintOk
                    ? status.config.lastPrintAt
                    : `${status.config.lastPrintAt} — ${status.config.lastPrintError ?? "failed"}`
                }
              />
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-caption">
            {loading ? "Loading…" : "No status yet"}
          </p>
        )}
      </section>

      <section className="mt-6 border border-solid border-border bg-white p-4">
        <h2 className="text-sm font-medium text-ink-primary">URLs</h2>
        <div className="mt-3 space-y-2 text-sm">
          {statusData ? (
            <>
              <CopyRow label="Kiosk" value={statusData.urls.kiosk} />
              <CopyRow label="Admin" value={statusData.urls.admin} />
            </>
          ) : null}
        </div>
      </section>

      <section className="mt-6 border border-solid border-border bg-white p-4">
        <h2 className="text-sm font-medium text-ink-primary">Printer</h2>
        <p className="mt-1 text-sm text-ink-caption">
          Plug in the printer via USB, then pick it from the list.
        </p>
        <label className="mt-4 block text-sm text-ink-caption" htmlFor="printer-select">
          Printer
        </label>
        <select
          id="printer-select"
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="mt-2 w-full border border-solid border-border bg-white px-3 py-2 font-mono text-sm"
        >
          <option value="">— Select printer —</option>
          {printers.map((printer) => (
            <option key={printer.id} value={printer.interface}>
              {printer.label} ({printer.source})
            </option>
          ))}
        </select>
        {printers.length === 0 ? (
          <p className="mt-2 text-xs text-ink-caption">
            No printers detected. Check USB connection and OS printer settings.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void savePrinter()}
            className="border border-solid border-border px-4 py-2 text-sm hover:bg-surface-hover"
          >
            Save printer
          </button>
          <button
            type="button"
            onClick={() => void testPrint()}
            disabled={!selectedPrinter || loading}
            className="border border-solid border-border px-4 py-2 text-sm hover:bg-surface-hover disabled:opacity-50"
          >
            Test print
          </button>
          <button
            type="button"
            onClick={() => storedPin && void refresh(storedPin)}
            className="border border-solid border-border px-4 py-2 text-sm hover:bg-surface-hover"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="mt-6 border border-solid border-border bg-white p-4">
        <h2 className="text-sm font-medium text-ink-primary">QR code (receipt scans)</h2>
        <p className="mt-1 text-sm text-ink-caption">
          Phones scan receipts to open the digital version. The LAN address is
          detected automatically — no setup needed.
        </p>
        {statusData?.urls.receiptViewOrigin ? (
          <p className="mt-3 font-mono text-sm text-ink-body">
            {statusData.urls.receiptViewOrigin}
          </p>
        ) : null}
        {qrUrlStale ? (
          <p className="mt-2 text-sm text-amber-800">
            A saved LAN IP ({statusData?.urls.savedReceiptViewOrigin}) is
            ignored. QR codes use the current address above.
          </p>
        ) : null}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-ink-caption">
            Custom hostname override (optional)
          </summary>
          <p className="mt-2 text-xs text-ink-caption">
            Only needed for a fixed domain (e.g. https://fae.example.com). Leave
            empty for automatic LAN detection.
          </p>
          <label className="mt-3 block text-sm text-ink-caption" htmlFor="qr-url">
            Override origin
          </label>
          <input
            id="qr-url"
            type="url"
            value={receiptViewBaseUrl}
            onChange={(e) => setReceiptViewBaseUrl(e.target.value)}
            placeholder="https://fae.example.com"
            className="mt-2 w-full border border-solid border-border bg-white px-3 py-2 font-mono text-sm"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveQrUrl()}
              className="border border-solid border-border px-4 py-2 text-sm hover:bg-surface-hover"
            >
              Save override
            </button>
            {receiptViewBaseUrl ? (
              <button
                type="button"
                onClick={() => {
                  setReceiptViewBaseUrl("");
                  void saveQrUrl("");
                }}
                className="border border-solid border-border px-4 py-2 text-sm hover:bg-surface-hover"
              >
                Clear override
              </button>
            ) : null}
          </div>
        </details>
      </section>
    </main>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-caption">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <code className="truncate font-mono text-xs">{value}</code>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 border border-solid border-border px-2 py-1 text-xs hover:bg-surface-hover"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
