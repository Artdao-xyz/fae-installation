import { isInstallationMode } from "@/lib/installation-mode";
import { HomePageClient } from "./HomePageClient";
import { HomeTopPopUpStrip } from "./HomeTopPopUpStrip";

export default function Home() {
  return (
    <>
      {isInstallationMode() ? null : <HomeTopPopUpStrip />}
      <HomePageClient />
    </>
  );
}
