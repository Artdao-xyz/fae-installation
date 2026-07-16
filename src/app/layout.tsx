import type { Metadata, Viewport } from "next";
import { buildSiteMetadata } from "@/lib/site-metadata";
import "./globals.css";

export const metadata: Metadata = buildSiteMetadata();

/**
 * Light-only design. "only light" opts out of Android/Chrome forced auto-dark,
 * which otherwise inverts the receipt view when phones scan the QR in dark mode.
 */
export const viewport: Viewport = {
  colorScheme: "only light",
};

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
