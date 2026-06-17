import type { ReactNode } from "react";
import {
  ReceiptViewScroll,
  ReceiptViewScrollScript,
} from "../view/ReceiptViewScroll";

export default function VLayout({ children }: { children: ReactNode }) {
  return (
    <ReceiptViewScroll>
      <ReceiptViewScrollScript />
      {children}
    </ReceiptViewScroll>
  );
}
