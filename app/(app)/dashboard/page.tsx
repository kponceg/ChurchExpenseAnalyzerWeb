import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      <p className="eyebrow">September 2026</p>
      <h1>Financial overview</h1>
      <p className="lede">The accounting foundation begins with verified income entry. Balances will connect after database persistence is approved.</p>
      <section className="summary" aria-label="Financial summary">
        <div className="metric"><span>Available balance</span><strong>—</strong></div>
        <div className="metric"><span>Income this month</span><strong className="positive">—</strong></div>
        <div className="metric"><span>Expenses this month</span><strong className="negative">—</strong></div>
      </section>
      <Link className="primary" href="/transactions/new">Record income</Link>
    </>
  );
}
