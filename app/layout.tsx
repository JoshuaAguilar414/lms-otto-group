import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otto Group Academy",
  description: "VECTRA International learning management system",
  icons: {
    icon: "/otto-logo.svg",
    shortcut: "/otto-logo.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
