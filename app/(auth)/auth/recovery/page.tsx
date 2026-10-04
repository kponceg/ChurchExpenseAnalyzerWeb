import { RecoveryCodeForm } from "@/components/forms/recovery-code-form";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function RecoveryPage() {
  const locale = await getLocale(); const text = getMessages(locale);
  return <main className="auth-page"><section className="auth-panel">
    <div className="auth-heading"><p className="eyebrow">{text.brand}</p><LanguageSwitcher locale={locale} label={text.language} /></div>
    <h1>{text.recovery.title}</h1><p className="lede">{text.recovery.lede}</p>
    <RecoveryCodeForm labels={text.recovery} />
  </section></main>;
}
