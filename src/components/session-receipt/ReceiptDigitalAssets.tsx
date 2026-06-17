"use client";

import {
  RECEIPT_DIGITAL_QR_DISPLAY_PX,
  RECEIPT_QR_RENDER_PX,
} from "@/lib/session-receipt/thermal-spec";

type ReceiptDigitalQrProps = {
  payload: string;
  scale?: number;
};

export function ReceiptDigitalQr({ payload, scale = 1 }: ReceiptDigitalQrProps) {
  // Render the PNG at high resolution but display at a fixed size so the QR
  // stays crisp and doesn't dominate the receipt.
  const params = `d=${encodeURIComponent(payload)}&px=${RECEIPT_QR_RENDER_PX}`;

  return (
    <div className="flex w-full justify-center py-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered receipt asset */}
      <img
        src={`/api/receipt-qr?${params}`}
        alt="Receipt QR code"
        width={RECEIPT_DIGITAL_QR_DISPLAY_PX}
        height={RECEIPT_DIGITAL_QR_DISPLAY_PX}
        className="block aspect-square h-auto max-w-full"
        style={{ width: RECEIPT_DIGITAL_QR_DISPLAY_PX }}
      />
    </div>
  );
}

type ReceiptDigitalStarsProps = {
  payload: string;
  scale?: number;
};

export function ReceiptDigitalStars({
  payload,
  scale = 1,
}: ReceiptDigitalStarsProps) {
  const params = `d=${encodeURIComponent(payload)}&s=${scale}`;

  return (
    <div className="mt-4 flex w-full justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered receipt asset */}
      <img
        src={`/api/receipt-stars?${params}`}
        alt="Your browsing path"
        className="block h-auto w-full max-w-full"
      />
    </div>
  );
}
