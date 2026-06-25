"use client";

import { useEffect, useState } from "react";
import { isInstallationMode } from "@/lib/installation-mode";
import { InstallationScreenContent } from "./InstallationScreenContent";
import {
  installationModalOverlayClass,
  installationOverlayEnterClass,
  installationScreenStageClass,
} from "./installation-screen-chrome";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

type InstallationHealth = {
  ok: boolean;
  installationMode: boolean;
  catalogPresent: boolean;
  contentSourceReady: boolean;
  contentSource: "fixture" | "local" | "strapi" | "none";
  printerConfigured: boolean;
  mediaFileCount: number;
  visitorReady: boolean;
};

const POLL_MS = 30_000;

async function fetchInstallationHealth(): Promise<InstallationHealth | null> {
  try {
    const res = await fetch("/api/installation/health", {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as InstallationHealth;
  } catch {
    return null;
  }
}

function applyHealthToBlockedState(
  health: InstallationHealth | null,
): { blocked: boolean; detail: string | null } {
  if (!health?.installationMode) {
    return { blocked: false, detail: null };
  }

  if (!health.visitorReady) {
    if (!health.contentSourceReady) {
      return {
        blocked: true,
        detail:
          health.contentSource === "none"
            ? "Content is not configured. Set STRAPI_URL or sync local data (data/catalog.json)."
            : "Content source is not ready yet.",
      };
    }
    return {
      blocked: true,
      detail: "Installation is not ready for visitors.",
    };
  }

  return { blocked: false, detail: null };
}

export function InstallationHealthGuard({ children }: { children: React.ReactNode }) {
  const enabled = isInstallationMode();
  const [blocked, setBlocked] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const { mounted, entered } = useInstallationOverlayTransition(blocked);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      const health = await fetchInstallationHealth();
      if (cancelled) return;
      const next = applyHealthToBlockedState(health);
      setBlocked(next.blocked);
      setDetail(next.detail);
    };

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);

  if (!enabled) return children;

  return (
    <>
      {children}
      {mounted ? (
        <div
          className={`${installationModalOverlayClass} ${installationScreenStageClass} ${installationOverlayEnterClass} ${
            entered ? "opacity-100" : "opacity-0"
          }`}
          role="alertdialog"
          aria-modal="true"
          aria-label="Installation unavailable"
        >
          <InstallationScreenContent>
            <h1 className="font-lust-text text-left text-5xl leading-tight text-black-fae sm:text-6xl sm:leading-[65px]">
              Temporarily unavailable
            </h1>
            <p className="text-left font-fira-mono text-sm font-medium leading-5 text-black-fae/50 sm:text-base">
              This installation is being set up. Please check back shortly.
            </p>
            {detail ? (
              <p className="text-left font-fira-mono text-xs leading-4 text-amber-900 sm:text-sm">
                {detail}
              </p>
            ) : null}
            <p className="text-left font-fira-mono text-xs leading-4 text-black-fae/40 motion-safe:animate-pulse sm:text-sm sm:leading-5">
              Checking again automatically…
            </p>
          </InstallationScreenContent>
        </div>
      ) : null}
    </>
  );
}

export function useInstallationPrinterReady(): boolean | null {
  const enabled = isInstallationMode();
  const [printerReady, setPrinterReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      const health = await fetchInstallationHealth();
      if (cancelled) return;
      setPrinterReady(health?.printerConfigured ?? false);
    };

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);

  if (!enabled) return null;
  return printerReady;
}
