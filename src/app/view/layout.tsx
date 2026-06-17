import type { ReactNode } from "react";
import { ReceiptViewScroll, ReceiptViewScrollScript } from "./ReceiptViewScroll";

export default function ViewLayout({ children }: { children: ReactNode }) {
  return (
    <ReceiptViewScroll>
      <ReceiptViewScrollScript />
      {children}
    </ReceiptViewScroll>
  );
}
