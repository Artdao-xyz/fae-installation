"use client";

import {
  RECEIPT_DIGITAL_QR_DISPLAY_PX,
  RECEIPT_QR_RENDER_PX,
} from "@/lib/session-receipt/thermal-spec";

type ReceiptDigitalQrProps = {
  payload: string;
  scale?: number;
};

export function ReceiptDigitalQr({ payload }: ReceiptDigitalQrProps) {
  const params = `d=${encodeURIComponent(payload)}&px=${RECEIPT_QR_RENDER_PX}`;

  return (
    <div className="py-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered receipt asset */}
      <img
        src={`/api/receipt-qr?${params}`}
        alt="Receipt QR code"
        width={RECEIPT_DIGITAL_QR_DISPLAY_PX}
        height={RECEIPT_DIGITAL_QR_DISPLAY_PX}
        className="block aspect-square h-auto"
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
