import Link from "next/link";
import { getDashboardSummary } from "@/server/accounting/get-dashboard-summary";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function DashboardPage() {
  const locale = await getLocale();
  const result = await getDashboardSummary(locale);
  const text = getMessages(locale);

  if (!result.ok) {
    return <><p className="eyebrow">{text.nav.dashboard}</p><h1>{text.dashboard.title}</h1><section className="state-panel" role="alert"><h2>{text.dashboard.unavailable}</h2><p>{result.error}</p></section></>;
  }

  return (
    <>
      <p className="eyebrow">{result.summary.periodLabel}</p>
      <h1>{text.dashboard.title}</h1>
      <p className="lede">{text.dashboard.lede}</p>
      <section className="summary" aria-label={text.dashboard.summary}>
        <div className="metric"><span>{text.dashboard.balance}</span><strong>{result.summary.availableBalance}</strong></div>
        <div className="metric"><span>{text.dashboard.income}</span><strong className="positive">+{result.summary.monthlyIncome}</strong></div>
        <div className="metric"><span>{text.dashboard.expenses}</span><strong className="negative">-{result.summary.monthlyExpenses}</strong></div>
      </section>
      <div className="page-actions"><Link className="primary" href="/transactions/new">{text.nav.income}</Link><Link className="secondary-link" href="/transactions/expense/new">{text.nav.expense}</Link><Link className="secondary-link" href="/activity">{text.dashboard.activity}</Link></div>
    </>
  );
}
