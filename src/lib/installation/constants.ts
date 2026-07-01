/** Header sent by /admin for authenticated API calls. */
export const INSTALLATION_ADMIN_PIN_HEADER = "x-installation-admin-pin";

export type ReceiptPrintMode = "escpos-text" | "raster";

export const DEFAULT_RECEIPT_PRINT_MODE: ReceiptPrintMode = "raster";

export const RECEIPT_PRINT_MODE_OPTIONS: {
  value: ReceiptPrintMode;
  label: string;
}[] = [
  { value: "raster", label: "Raster (recommended)" },
  { value: "escpos-text", label: "ESC/POS text" },
];
