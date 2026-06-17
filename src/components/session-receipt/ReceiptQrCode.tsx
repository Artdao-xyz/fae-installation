"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";
import { RECEIPT_QR_PX } from "@/lib/session-receipt/thermal-spec";

type ReceiptQrCodeProps = {
  /** Full scan URL (must use a phone-reachable host, not localhost). */
  value?: string;
  scale?: number;
  /** JPEG img instead of SVG (digital surfaces + mobile Safari). */
  asImage?: boolean;
};

export function ReceiptQrCode({
  value = "",
  scale = 1,
  asImage = false,
}: ReceiptQrCodeProps) {
  const size = Math.round(RECEIPT_QR_PX * scale);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!asImage || !value) return;

    let cancelled = false;
    void QRCodeLib.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "L",
      type: "image/jpeg",
      quality: 0.92,
    }).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [asImage, value, size]);

  if (asImage) {
    return (
      <div className="flex justify-center py-2" aria-hidden>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- client-generated JPEG for mobile Safari
          <img
            src={src}
            alt=""
            width={size}
            height={size}
            className="block"
            style={{ width: size, height: size, maxWidth: "100%" }}
          />
        ) : (
          <div
            className="bg-white"
            style={{ width: size, height: size }}
            aria-hidden
          />
        )}
      </div>
    );
  }

  if (!value) {
    return (
      <div
        className="mx-auto bg-white py-2"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <div className="flex justify-center py-2" aria-hidden>
      <QRCode
        value={value}
        size={size}
        level="L"
        bgColor="#ffffff"
        fgColor="#000000"
        style={{ height: "auto", maxWidth: "100%", width: size }}
      />
    </div>
  );
}
