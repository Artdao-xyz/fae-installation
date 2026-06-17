"use client";

import { useEffect, type ReactNode } from "react";
import { isInstallationMode } from "@/lib/installation-mode";

export function InstallationLinkGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isInstallationMode()) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href") ?? "";
      if (/^https?:\/\//i.test(href) || href.startsWith("//")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return children;
}
