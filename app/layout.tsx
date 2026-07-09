import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tossa Gebaya",
  description: "Simple Telegram marketplace for Dessie"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2f6f5e"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am">
      <body>{children}</body>
    </html>
  );
}
