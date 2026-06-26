import QRCode from "qrcode";

const QR_ERROR_CORRECTION = "L" as const;

/** Try to allocate a QR matrix for `url` at installation ECC level L. */
export function receiptUrlFitsInQr(url: string): boolean {
  try {
    QRCode.create(url, { errorCorrectionLevel: QR_ERROR_CORRECTION });
    return true;
  } catch {
    return false;
  }
}
