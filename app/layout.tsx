import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otto Group Academy",
  description: "VECTRA International learning management system",
  icons: {
    icon: "https://static.ottogroup.com/wLayout22/wGlobal/layout/images/site-icons/favicon-32x32.png",
    shortcut: "https://static.ottogroup.com/wLayout22/wGlobal/layout/images/site-icons/favicon-32x32.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
