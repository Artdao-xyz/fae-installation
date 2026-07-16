type ReceiptFooterProps = {
  logoHeightPx?: number;
  /** Scale logo with the digital receipt container (`cqw`). */
  digital?: boolean;
};

/** Serpentine logo at the bottom of the receipt. */
export function ReceiptFooter({
  logoHeightPx = 12,
  digital = false,
}: ReceiptFooterProps) {
  return (
    <footer className="mt-4">
      <div className="flex w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- receipt partner logo */}
        <img
          src="/svg/serpentine.svg"
          alt="Serpentine"
          className={`block w-auto shrink-0 object-contain ${
            digital ? "receipt-digital-logo" : ""
          }`}
          style={digital ? undefined : { height: logoHeightPx }}
        />
      </div>
    </footer>
  );
}
