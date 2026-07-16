"use client";

import { useLayoutEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  RECEIPT_DIGITAL_QR_DISPLAY_PX,
  RECEIPT_QR_MAX_RENDER_PX,
  RECEIPT_QR_RENDER_PX,
  receiptDigitalQrDisplayPx,
  receiptDigitalStarsWidthPx,
} from "@/lib/session-receipt/thermal-spec";

type ReceiptDigitalQrProps = {
  payload: string;
  scale?: number;
  /** Full `/v?d=` URL — rendered inline as SVG (reliable on mobile Safari). */
  scanUrl?: string;
};

function qrRenderPx(displayWidth: number): number {
  if (displayWidth <= 0) return RECEIPT_QR_RENDER_PX;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.min(
    RECEIPT_QR_MAX_RENDER_PX,
    Math.max(120, Math.round(displayWidth * dpr * 2)),
  );
}

function useReceiptDigitalQrSizing() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [displayWidth, setDisplayWidth] = useState(RECEIPT_DIGITAL_QR_DISPLAY_PX);
  const [renderPx, setRenderPx] = useState(RECEIPT_QR_RENDER_PX);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const host =
      wrap.closest<HTMLElement>(".receipt-digital-host") ?? wrap.parentElement;
    if (!host) return;

    const update = () => {
      const width = receiptDigitalQrDisplayPx(
        host.getBoundingClientRect().width,
      );
      if (width > 0) {
        setDisplayWidth(width);
        setRenderPx(qrRenderPx(width));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return { wrapRef, displayWidth, renderPx };
}

export function ReceiptDigitalQr({
  payload,
  scanUrl,
}: ReceiptDigitalQrProps) {
  const { wrapRef, displayWidth, renderPx } = useReceiptDigitalQrSizing();
  const params = `d=${encodeURIComponent(payload)}&px=${renderPx}`;

  return (
    <div className="flex w-full flex-col items-center py-2">
      <p className="mb-2 text-center text-black/50">share</p>
      <div
        ref={wrapRef}
        className="receipt-digital-qr-wrap mx-auto"
        style={{ width: displayWidth }}
      >
        {scanUrl ? (
          <QRCode
            value={scanUrl}
            size={displayWidth}
            level="L"
            bgColor="#ffffff"
            fgColor="#000000"
            className="receipt-digital-qr"
            style={{ height: "auto", width: "100%" }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- server-rendered receipt asset */
          <img
            src={`/api/receipt-qr?${params}`}
            alt="Receipt QR code"
            className="receipt-digital-qr"
          />
        )}
      </div>
    </div>
  );
}

type ReceiptDigitalStarsProps = {
  payload: string;
  scale?: number;
};

export function ReceiptDigitalStars({
  payload,
}: ReceiptDigitalStarsProps) {
  const params = `d=${encodeURIComponent(payload)}&w=${receiptDigitalStarsWidthPx()}`;

  return (
    <div className="flex w-full justify-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered receipt asset */}
      <img
        src={`/api/receipt-stars?${params}`}
        alt="Your browsing path"
        className="block h-auto w-full max-w-full"
      />
    </div>
  );
}
