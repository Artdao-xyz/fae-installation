/** When `1`, exhibition install: stripped UI, session receipt, print controls. */
export function isInstallationMode(): boolean {
  return process.env.NEXT_PUBLIC_FAE_INSTALLATION_MODE === "1";
}
