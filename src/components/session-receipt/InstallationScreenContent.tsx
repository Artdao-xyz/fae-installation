import type { ReactNode } from "react";
import { installationScreenContentClass } from "./installation-screen-chrome";

export function InstallationScreenContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${installationScreenContentClass} ${className ?? ""}`}>
      {children}
    </div>
  );
}
