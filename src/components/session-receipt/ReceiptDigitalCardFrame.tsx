import { forwardRef, type CSSProperties, type ReactNode } from "react";

type ReceiptDigitalCardFrameProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Fluid digital receipt container — children use `cqw` units from {@link globals.css}. */
export const ReceiptDigitalCardFrame = forwardRef<
  HTMLDivElement,
  ReceiptDigitalCardFrameProps
>(function ReceiptDigitalCardFrame({ children, className = "", style }, ref) {
  return (
    <div
      ref={ref}
      className={`receipt-digital-host ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
});
