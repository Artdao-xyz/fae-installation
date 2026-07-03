import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import {
  buildReceiptViewUrlFromEncoded,
  decodeReceiptPayload,
} from "@/lib/session-receipt/encode";
import { logSessionReceiptServer } from "@/lib/session-receipt/log";
import { resolveReceiptViewOriginFromHeaders } from "@/lib/session-receipt/resolve-view-origin-server";
import { RECEIPT_ARTIFACT_TITLE } from "@/lib/session-receipt/types";
import { ViewReceiptClient } from "./ViewReceiptClient";

type VPageProps = {
  searchParams: Promise<{ d?: string }>;
};

export const metadata: Metadata = {
  title: RECEIPT_ARTIFACT_TITLE,
  robots: { index: false, follow: false },
};

export default async function VPage({ searchParams }: VPageProps) {
  const { d } = await searchParams;
  const receipt = d ? decodeReceiptPayload(d) : null;
  const shareScanUrl = d
    ? buildReceiptViewUrlFromEncoded(
        d,
        resolveReceiptViewOriginFromHeaders(await headers()),
      )
    : undefined;

  if (receipt) {
    logSessionReceiptServer("GET /v — rebuilt from QR payload", receipt);
  }

  return (
    <Suspense
      fallback={
        <main className="fae-standalone-scroll flex min-h-full items-center justify-center bg-[#e9e9e9] p-6">
          <p className="font-mono text-sm text-black">processing...</p>
        </main>
      }
    >
      <ViewReceiptClient encoded={d ?? undefined} shareScanUrl={shareScanUrl} />
    </Suspense>
  );
}
