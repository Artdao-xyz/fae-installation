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
    <html lang="en">
      <body
        className={`subpixel-antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
