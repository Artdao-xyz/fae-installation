"use client";

import { useMemo } from "react";
import {
  buildReceiptQrPayload,
  buildReceiptViewUrlFromEncoded,
} from "@/lib/session-receipt/encode";
import { isLocalReceiptOrigin } from "@/lib/session-receipt/resolve-view-origin";
import { hasPathActivity } from "@/lib/session-receipt/path-grid";
import {
  formatReceiptDate,
  formatSessionTranscript,
} from "@/lib/session-receipt/format-transcript";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import {
  RECEIPT_ACTIVITY_HEADING,
  RECEIPT_ARTIFACT_TITLE,
  RECEIPT_BRAND,
} from "@/lib/session-receipt/types";
import {
  RECEIPT_DIGITAL_SCALE,
  RECEIPT_DIGITAL_MAX_WIDTH_PX,
  RECEIPT_PAPER_WIDTH_PX,
  RECEIPT_QR_PX,
  THERMAL_HORIZONTAL_MARGIN_RATIO,
  thermalReceiptHorizontalPaddingPx,
} from "@/lib/session-receipt/thermal-spec";
import { ReceiptDigitalQr, ReceiptDigitalStars } from "./ReceiptDigitalAssets";
import { ReceiptFooter } from "./ReceiptFooter";
import { ReceiptJourneyPrompt } from "./ReceiptJourneyPrompt";
import { ReceiptPathStars } from "./ReceiptPathStars";
import { ReceiptQrCode } from "./ReceiptQrCode";
import { useReceiptViewOrigin } from "@/lib/session-receipt/use-receipt-view-origin";

export type ReceiptPaperVariant = "thermal" | "digital" | "confirm";

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
  const isConfirm = variant === "confirm";
  const isScaledPreview = isDigital || isConfirm;
  const scale = isScaledPreview ? RECEIPT_DIGITAL_SCALE : 1;
  const paperWidth = RECEIPT_PAPER_WIDTH_PX;
  const transcript = formatSessionTranscript(receipt.events);
  const showPath =
    receipt.path && hasPathActivity(receipt.path) ? receipt.path : null;
  const { origin: viewOrigin, ready: originReady } = useReceiptViewOrigin();
  const qrPayload = useMemo(() => {
    if (encoded) return null;
    return buildReceiptQrPayload(receipt, viewOrigin);
  }, [encoded, receipt, viewOrigin]);
  const qrUrl =
    qrUrlOverride ??
    (qrPayload
      ? buildReceiptViewUrlFromEncoded(qrPayload.encoded, viewOrigin)
      : "");
  const canShowThermalQr =
    originReady && qrUrl.length > 0 && !isLocalReceiptOrigin(qrUrl);
  const payload = encoded ?? qrPayload?.encoded ?? "";
  const omittedInteractionCount =
    receipt.qrOmittedInteractionCount ?? qrPayload?.omittedInteractionCount ?? 0;
  const horizontalPad = thermalReceiptHorizontalPaddingPx();
  const horizontalMargin = `${THERMAL_HORIZONTAL_MARGIN_RATIO * 100}%`;

  return (
    <article
      className={`mx-auto bg-white font-mono text-black ${
        isScaledPreview
          ? "box-border w-full min-w-0 border-hairline border-solid border-border py-5 text-[12px] leading-[15px] shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
          : "py-4 text-[11px] leading-[14px]"
      } ${className}`}
      style={
        isScaledPreview
          ? {
              width: "100%",
              maxWidth: RECEIPT_DIGITAL_MAX_WIDTH_PX,
              paddingLeft: horizontalMargin,
              paddingRight: horizontalMargin,
            }
          : {
              width: paperWidth,
              paddingLeft: horizontalPad,
              paddingRight: horizontalPad,
            }
      }
      aria-label="Session receipt"
    >
      {isScaledPreview && showPath ? (
        <ReceiptDigitalStars payload={payload} scale={scale} />
      ) : null}
      {!isScaledPreview && showPath ? (
        <ReceiptPathStars path={showPath} scale={scale} />
      ) : null}

      <header className={showPath ? "mt-4" : undefined}>
        <p
          className={`font-bold tracking-wide ${
            isScaledPreview ? "text-sm" : "text-xs"
          }`}
        >
          {RECEIPT_BRAND}
        </p>
        <p className="mt-1">{RECEIPT_ARTIFACT_TITLE}</p>
        <p className="mt-1">{formatReceiptDate(receipt.sessionStart)}</p>
      </header>

      <section className="mt-8">
        <p className="mb-4">{RECEIPT_ACTIVITY_HEADING}</p>
        {transcript.length === 0 ? (
          <p className="text-[10px]">No activity recorded</p>
        ) : (
          <div className="space-y-1">
            {transcript.map((line, i) => (
              <p key={`${line.time}-${i}`} className="wrap-break-word">
                {line.time} {line.text}
              </p>
            ))}
          </div>
        )}
      </section>

      <ReceiptJourneyPrompt prompt={receipt.prompt} className="mt-8 mb-4" />

      {isDigital && omittedInteractionCount > 0 ? (
        <p className="mb-4 text-[10px] leading-[13px] text-black/50">
          Digital summary — {omittedInteractionCount} more interaction
          {omittedInteractionCount === 1 ? "" : "s"} on your printed receipt.
        </p>
      ) : null}

      <div className="mt-4">
        {isScaledPreview ? (
          <ReceiptDigitalQr payload={payload} scale={scale} />
        ) : canShowThermalQr ? (
          <ReceiptQrCode value={qrUrl} scale={scale} />
        ) : (
          <div
            className="bg-white py-2"
            style={{
              width: Math.round(RECEIPT_QR_PX * scale),
              height: Math.round(RECEIPT_QR_PX * scale),
            }}
            aria-hidden
          />
        )}
      </div>

      <ReceiptFooter />
    </article>
  );
}
