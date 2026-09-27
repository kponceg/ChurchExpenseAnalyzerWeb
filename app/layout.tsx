import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Church Finance",
  description: "Church income and expense management",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
