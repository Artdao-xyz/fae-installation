"use client";

import {
  buildReceiptViewUrl,
  encodeReceiptPayload,
} from "@/lib/session-receipt/encode";
import { isLocalReceiptOrigin } from "@/lib/session-receipt/resolve-view-origin";
import { hasPathActivity } from "@/lib/session-receipt/path-grid";
import {
  formatReceiptDate,
  formatSessionTranscript,
} from "@/lib/session-receipt/format-transcript";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { RECEIPT_LINE_WIDTH, RECEIPT_TITLE } from "@/lib/session-receipt/types";
import {
  RECEIPT_DIGITAL_SCALE,
  RECEIPT_DIGITAL_WIDTH_PX,
  RECEIPT_PAPER_WIDTH_PX,
  RECEIPT_QR_PX,
} from "@/lib/session-receipt/thermal-spec";
import { ReceiptDigitalQr, ReceiptDigitalStars } from "./ReceiptDigitalAssets";
import { ReceiptJourneyPrompt } from "./ReceiptJourneyPrompt";
import { ReceiptPathStars } from "./ReceiptPathStars";
import { ReceiptQrCode } from "./ReceiptQrCode";
import { useReceiptViewOrigin } from "@/lib/session-receipt/use-receipt-view-origin";

export type ReceiptPaperVariant = "thermal" | "digital";

type ReceiptPaperProps = {
  receipt: SessionReceipt;
  className?: string;
  /** `thermal` = 58mm fidelity; `digital` = larger on-screen twin. */
  variant?: ReceiptPaperVariant;
  /** Override QR target (used on kiosk preview). */
  qrUrl?: string;
  /** Raw `d` payload — used on /v; preview derives from receipt when omitted. */
  encoded?: string | null;
};

/**
 * Single receipt layout — preview modal, digital /v page, and future print
 * all render this same component.
 */
export function ReceiptPaper({
  receipt,
  className = "",
  variant = "thermal",
  qrUrl: qrUrlOverride,
  encoded,
}: ReceiptPaperProps) {
  const isDigital = variant === "digital";
  const scale = isDigital ? RECEIPT_DIGITAL_SCALE : 1;
  const paperWidth = isDigital ? RECEIPT_DIGITAL_WIDTH_PX : RECEIPT_PAPER_WIDTH_PX;
  const transcript = formatSessionTranscript(receipt.events);
  const showPath =
    receipt.path && hasPathActivity(receipt.path) ? receipt.path : null;
  const { origin: viewOrigin, ready: originReady } = useReceiptViewOrigin();
  const qrUrl =
    qrUrlOverride ?? buildReceiptViewUrl(receipt, viewOrigin);
  const canShowThermalQr =
    originReady && qrUrl.length > 0 && !isLocalReceiptOrigin(qrUrl);
  const payload = encoded ?? encodeReceiptPayload(receipt);

  return (
    <article
      className={`mx-auto bg-white font-mono text-black ${
        isDigital
          ? "box-border w-full min-w-0 px-4 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.14)] text-[12px] leading-[15px]"
          : "px-3 py-4 text-[11px] leading-[14px]"
      } ${className}`}
      style={
        isDigital ? { maxWidth: RECEIPT_DIGITAL_WIDTH_PX } : { width: paperWidth }
      }
      aria-label="Session receipt"
    >
      <p
        className={`text-center font-bold tracking-wide ${
          isDigital ? "text-sm" : "text-xs"
        }`}
      >
        {RECEIPT_TITLE}
      </p>
      <p className="mt-2 text-center">
        {formatReceiptDate(receipt.sessionStart)}
      </p>
      <p className="my-2 text-center">
        {"-".repeat(Math.min(RECEIPT_LINE_WIDTH, 24))}
      </p>
      {transcript.length === 0 ? (
        <p className="text-center text-[10px]">No activity recorded</p>
      ) : (
        <div className="space-y-1">
          {transcript.map((line, i) => (
            <p key={`${line.time}-${i}`} className="wrap-break-word">
              {line.time} {line.text}
            </p>
          ))}
        </div>
      )}
      <p className="my-2 text-center">
        {"-".repeat(Math.min(RECEIPT_LINE_WIDTH, 24))}
      </p>
      {isDigital ? (
        <ReceiptDigitalQr payload={payload} scale={scale} />
      ) : canShowThermalQr ? (
        <ReceiptQrCode value={qrUrl} scale={scale} />
      ) : (
        <div
          className="mx-auto bg-white py-2"
          style={{
            width: Math.round(RECEIPT_QR_PX * scale),
            height: Math.round(RECEIPT_QR_PX * scale),
          }}
          aria-hidden
        />
      )}
      <ReceiptJourneyPrompt prompt={receipt.prompt} />
      {isDigital && showPath ? (
        <ReceiptDigitalStars payload={payload} scale={scale} />
      ) : null}
      {!isDigital && showPath ? (
        <div className="mt-3">
          <ReceiptPathStars path={showPath} scale={scale} />
        </div>
      ) : null}
    </article>
  );
}
