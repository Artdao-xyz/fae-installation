import type { CSSProperties, ReactNode } from "react";

type ReceiptDigitalCardFrameProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Fluid digital receipt container — children use `cqw` units from {@link globals.css}. */
export function ReceiptDigitalCardFrame({
  children,
  className = "",
  style,
}: ReceiptDigitalCardFrameProps) {
  return (
    <div
      className={`receipt-digital-host ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
