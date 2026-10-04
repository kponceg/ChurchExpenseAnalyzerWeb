import { Suspense } from "react";
import { AuthCodeCallback } from "@/components/forms/auth-code-callback";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function AuthCallbackPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  return <main className="auth-page"><section className="auth-panel">
    <div className="auth-heading"><p className="eyebrow">{text.brand}</p><LanguageSwitcher locale={locale} label={text.language} /></div>
    <h1>{text.callback.title}</h1>
    <p className="lede">{text.callback.lede}</p>
    <Suspense fallback={<p className="message">{text.callback.loading}</p>}><AuthCodeCallback loading={text.callback.loading} invalid={text.callback.invalid} /></Suspense>
  </section></main>;
}
