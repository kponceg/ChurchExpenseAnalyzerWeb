import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  return <main className="auth-page"><section className="auth-panel">
    <div className="auth-heading"><p className="eyebrow">{text.brand}</p><LanguageSwitcher locale={locale} label={text.language} /></div>
    <h1>{text.forgotPassword.title}</h1>
    <p className="lede">{text.forgotPassword.lede}</p>
    <ForgotPasswordForm labels={text.forgotPassword} />
    <p className="auth-alternate"><Link href="/login">{text.forgotPassword.backToLogin}</Link></p>
  </section></main>;
}
