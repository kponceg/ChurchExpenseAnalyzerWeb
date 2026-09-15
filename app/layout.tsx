import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Church Finance",
  description: "Church income and expense management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
