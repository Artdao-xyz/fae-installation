const RECEIPT_LOGO_HEIGHT_CLASS = "h-3";

/** FAE + Serpentine logos at the bottom of the receipt. */
export function ReceiptFooter() {
  return (
    <footer className="mt-4">
      <div className="flex w-full items-center justify-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- receipt wordmark (no subtitle) */}
        <img
          src="/title-wordmark.svg"
          alt="Future Art Ecosystems"
          className={`block w-auto shrink-0 object-contain ${RECEIPT_LOGO_HEIGHT_CLASS}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- receipt partner logo */}
        <img
          src="/svg/serpentine.svg"
          alt="Serpentine"
          className={`block w-auto shrink-0 object-contain ${RECEIPT_LOGO_HEIGHT_CLASS}`}
        />
      </div>
    </footer>
  );
}
