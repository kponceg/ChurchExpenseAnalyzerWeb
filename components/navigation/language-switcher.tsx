"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  async function changeLanguage() {
    setChanging(true);
    await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: locale === "en" ? "es" : "en" }) });
    router.refresh();
    setChanging(false);
  }
  return <button className="language-switcher" type="button" onClick={changeLanguage} disabled={changing}>{label}</button>;
}
