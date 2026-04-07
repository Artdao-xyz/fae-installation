import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Future Art Ecosystems",
  description: "Cultural Infrastructure Research",
};

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
