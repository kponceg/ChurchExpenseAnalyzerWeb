import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/navigation/sign-out-button";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const locale = await getLocale();
  const text = getMessages(locale);

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">{text.brand}</p>
        <nav className="nav" aria-label={text.nav.primary}>
          <Link href="/dashboard">{text.nav.dashboard}</Link>
          <Link href="/activity">{text.nav.activity}</Link>
          <Link href="/transactions/new">{text.nav.income}</Link>
          <Link href="/transactions/expense/new">{text.nav.expense}</Link>
          <Link href="/reports">{text.nav.reports}</Link>
        </nav>
        <div className="account-summary"><span>{text.account.signedIn}</span><strong>{user.email}</strong><SignOutButton labels={text.account} /><LanguageSwitcher locale={locale} label={text.language} /></div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
