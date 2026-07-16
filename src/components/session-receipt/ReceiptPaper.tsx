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
} from "@/lib/session-receipt/types";
import {
  RECEIPT_DIGITAL_SCALE,
  RECEIPT_PAPER_WIDTH_PX,
  RECEIPT_QR_PX,
  RECEIPT_THERMAL_BODY_PX,
  RECEIPT_THERMAL_LEADING_PX,
  RECEIPT_THERMAL_TITLE_PX,
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
  /** `thermal` = 80mm fidelity; `digital` = larger on-screen twin. */
  variant?: ReceiptPaperVariant;
  /** Override QR target (used on kiosk preview). */
  qrUrl?: string;
  /** Raw `d` payload — used on /v; preview derives from receipt when omitted. */
  encoded?: string | null;
  /** Client-side share QR target on /v (current scan URL). */
  shareScanUrl?: string;
  /** When false, omits the QR block (e.g. kiosk confirm screen renders it below the fold). */
  showQr?: boolean;
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
  shareScanUrl,
  showQr = true,
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
          ? "receipt-paper-digital box-border min-w-0 border-hairline border-solid border-border py-5 shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
          : "py-4"
      } ${className}`}
      style={
        isScaledPreview
          ? {
              paddingLeft: horizontalMargin,
              paddingRight: horizontalMargin,
            }
          : {
              width: paperWidth,
              paddingLeft: horizontalPad,
              paddingRight: horizontalPad,
              fontSize: RECEIPT_THERMAL_BODY_PX,
              lineHeight: `${RECEIPT_THERMAL_LEADING_PX}px`,
            }
      }
      aria-label="Session receipt"
    >
      {isScaledPreview && showPath ? (
        <ReceiptDigitalStars payload={payload} />
      ) : null}
      {!isScaledPreview && showPath ? (
        <ReceiptPathStars path={showPath} scale={scale} />
      ) : null}

      {showPath ? (
        <p className={`${isScaledPreview ? "mt-4" : "mt-4"} mb-0`}>
          {RECEIPT_ACTIVITY_HEADING}
        </p>
      ) : null}

      <header className={showPath ? "mt-4" : undefined}>
        <p
          className={`font-bold tracking-wide ${
            isScaledPreview ? "receipt-paper-digital__title" : ""
          }`}
          style={
            isScaledPreview
              ? undefined
              : {
                  fontSize: RECEIPT_THERMAL_TITLE_PX,
                  lineHeight: `${RECEIPT_THERMAL_LEADING_PX}px`,
                }
          }
        >
          {RECEIPT_ARTIFACT_TITLE}
        </p>
        <p className="mt-1">{formatReceiptDate(receipt.sessionStart)}</p>
      </header>

      <section className="mt-8">
        {!showPath ? (
          <p className="mb-4">{RECEIPT_ACTIVITY_HEADING}</p>
        ) : null}
        {transcript.length === 0 ? (
          <p>No activity recorded</p>
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
        <p className="mb-4 text-black/50">
          Digital summary — {omittedInteractionCount} more interaction
          {omittedInteractionCount === 1 ? "" : "s"} on your printed receipt.
        </p>
      ) : null}

      {showQr ? (
        <div className="mt-4 flex w-full flex-col items-center">
          {isScaledPreview ? (
            payload ? (
              <ReceiptDigitalQr
                payload={payload}
                scale={scale}
                scanUrl={shareScanUrl}
              />
            ) : null
          ) : canShowThermalQr ? (
            <>
              <p className="mb-2 text-center text-black/50">share</p>
              <ReceiptQrCode value={qrUrl} scale={scale} />
            </>
          ) : payload ? (
            <ReceiptDigitalQr payload={payload} scale={scale} />
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
      ) : null}

      <ReceiptFooter digital={isScaledPreview} />
    </article>
  );
}
