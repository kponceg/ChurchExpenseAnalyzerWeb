import Link from "next/link";
import { InvitedAccountForm } from "@/components/forms/invited-account-form";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function SignupPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  return <main className="auth-page"><section className="auth-panel">
    <div className="auth-heading"><p className="eyebrow">{text.brand}</p><LanguageSwitcher locale={locale} label={text.language} /></div>
    <h1>{text.signup.title}</h1>
    <p className="lede">{text.signup.lede}</p>
    <InvitedAccountForm labels={text.signup} />
    <p className="auth-alternate"><Link href="/login">{text.signup.backToLogin}</Link></p>
  </section></main>;
}
