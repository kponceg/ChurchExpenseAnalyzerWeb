import Link from "next/link";
import { getDashboardSummary } from "@/server/accounting/get-dashboard-summary";

export default async function DashboardPage() {
  const result = await getDashboardSummary();

  if (!result.ok) {
    return <><p className="eyebrow">Dashboard</p><h1>Financial overview</h1><section className="state-panel" role="alert"><h2>Summary unavailable</h2><p>{result.error}</p></section></>;
  }

  return (
    <>
      <p className="eyebrow">{result.summary.periodLabel}</p>
      <h1>Financial overview</h1>
      <p className="lede">Posted activity across the organization’s financial accounts.</p>
      <section className="summary" aria-label="Financial summary">
        <div className="metric"><span>Available balance</span><strong>{result.summary.availableBalance}</strong></div>
        <div className="metric"><span>Income this month</span><strong className="positive">+{result.summary.monthlyIncome}</strong></div>
        <div className="metric"><span>Expenses this month</span><strong className="negative">-{result.summary.monthlyExpenses}</strong></div>
      </section>
      <div className="page-actions"><Link className="primary" href="/transactions/new">Record income</Link><Link className="secondary-link" href="/activity">View activity</Link></div>
    </>
  );
}
