import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function LoginPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-heading"><p className="eyebrow">{text.brand}</p><LanguageSwitcher locale={locale} label={text.language} /></div>
        <h1>{text.login.title}</h1>
        <p className="lede">{text.login.lede}</p>
        <Suspense fallback={<p className="message">{text.login.loading}</p>}><LoginForm labels={text.login} /></Suspense>
        <p className="auth-alternate"><Link href="/forgot-password">{text.login.forgotPassword}</Link></p>
        <p className="auth-alternate"><span>{text.login.invited}</span> <Link href="/signup">{text.login.createAccount}</Link></p>
      </section>
    </main>
  );
}
