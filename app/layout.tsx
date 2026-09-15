import type { Metadata } from "next";
import { getBranding } from "@/lib/branding";
import "./globals.css";

const branding = getBranding();

export const metadata: Metadata = {
  title: branding.productName,
  description: branding.description,
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon-32x32.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
