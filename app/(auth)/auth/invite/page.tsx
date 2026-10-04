import { InvitePasswordForm } from "@/components/forms/invite-password-form";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function InvitePage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  return <main className="auth-page"><section className="auth-panel">
    <div className="auth-heading"><p className="eyebrow">{text.brand}</p><LanguageSwitcher locale={locale} label={text.language} /></div>
    <h1>{text.invitation.title}</h1>
    <p className="lede">{text.invitation.lede}</p>
    <InvitePasswordForm labels={text.invitation} />
  </section></main>;
}
