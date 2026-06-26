import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/site-metadata";
import "./globals.css";

export const metadata: Metadata = buildSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `suppressHydrationWarning`: the receipt view routes add a scroll-unlock
    // class to <html> via an inline pre-hydration script (see ReceiptViewScroll).
    <html lang="en" suppressHydrationWarning>
      <body
        className={`subpixel-antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
