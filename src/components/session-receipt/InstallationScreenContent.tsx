import type { ReactNode } from "react";
import { installationScreenContentClass } from "./installation-screen-chrome";

export function InstallationScreenContent({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={installationScreenContentClass}>{children}</div>
  );
}
