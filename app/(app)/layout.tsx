import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/navigation/sign-out-button";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const locale = await getLocale();
  const text = getMessages(locale);
  const membership = await getCurrentMembership();

  const navigation = (
    <nav className="nav" aria-label={text.nav.primary}>
      <Link href="/dashboard">{text.nav.dashboard}</Link>
      <Link href="/accounts">{text.nav.accounts}</Link>
      <Link href="/categories">{text.nav.categories}</Link>
      <Link href="/funds">{text.nav.funds}</Link>
      <Link href="/budgets">{text.nav.budgets}</Link>
      <Link href="/activity">{text.nav.activity}</Link>
      <Link href="/reconciliations">{text.nav.reconciliations}</Link>
      {membership?.canReviewTransactions && <Link href="/approvals">{text.nav.approvals}</Link>}
      {membership?.canRecordTransactions && <Link href="/transactions/new">{text.nav.transaction}</Link>}
      <Link href="/reports">{text.nav.reports}</Link>
      {membership?.canViewAuditLog && <Link href="/audit">{text.nav.audit}</Link>}
      {membership?.canManage && <Link href="/settings">{text.nav.settings}</Link>}
    </nav>
  );

  const account = (
    <div className="account-summary"><span>{text.account.signedIn}</span><strong>{user.email}</strong><SignOutButton labels={text.account} /><LanguageSwitcher locale={locale} label={text.language} /></div>
  );

  return (
    <div className="shell">
      <aside className="sidebar desktop-sidebar">
        <p className="brand">{text.brand}</p>
        {navigation}
        {account}
      </aside>
      <details className="mobile-sidebar">
        <summary><span className="brand">{text.brand}</span><span className="mobile-menu-label">{text.nav.menu}</span></summary>
        <div className="mobile-menu-panel">{navigation}{account}</div>
      </details>
      <main className="content">{children}</main>
    </div>
  );
}
