import Link from "next/link";
import { getAccountLabel, getCategoryLabel, getFundLabel, getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getReportDetails } from "@/server/accounting/get-report-details";

export default async function ReportDetailsPage({ params, searchParams }: { params: Promise<{ month: string }>; searchParams: Promise<{ type?: string }> }) {
  const locale = await getLocale();
  const text = getMessages(locale).reports;
  const { month } = await params;
  const transactionType = (await searchParams).type === "expense" ? "expense" : "income";
  const result = await getReportDetails(month, transactionType);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = Number.isFinite(year) && Number.isFinite(monthNumber) ? new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1))) : month;
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" });

  if (!result.ok) return <><Link className="secondary-link" href="/reports">{text.back}</Link><section className="state-panel" role="alert"><h2>{text.unavailable}</h2><p>{result.error}</p></section></>;

  const typeLabel = transactionType === "income" ? text.income : text.expenses;
  return <>
    <Link className="secondary-link" href="/reports">{text.back}</Link>
    <div className="page-heading report-detail-heading">
      <div><p className="eyebrow report-detail-eyebrow">{monthLabel}</p><h1>{typeLabel} · {text.details}</h1></div>
      <a className="primary report-download" href={`/api/reports/pdf?month=${month}&type=${transactionType}`} download>{text.downloadPdf}</a>
    </div>
    <div className="report-type-switch"><Link className={transactionType === "income" ? "active" : ""} href={`/reports/${month}?type=income`}>{text.income}</Link><Link className={transactionType === "expense" ? "active" : ""} href={`/reports/${month}?type=expense`}>{text.expenses}</Link></div>
    <section className="summary report-detail-summary"><div className="metric"><span>{typeLabel}</span><strong className={transactionType === "income" ? "positive" : "negative"}>{result.details.total}</strong></div><div className="metric"><span>{text.transactions}</span><strong>{result.details.transactionCount}</strong></div></section>
    {result.details.categories.length === 0 ? <section className="state-panel"><p>{text.empty}</p></section> : result.details.categories.map((category) => <section className="category-report" key={category.category}>
      <div className="category-report-heading"><h2>{getCategoryLabel(locale, category.category)}</h2><strong className={transactionType === "income" ? "positive" : "negative"}>{category.total}</strong></div>
      <div className="table-wrap"><table className="activity-table report-detail-table"><thead><tr><th scope="col">{text.date}</th><th scope="col">{text.description}</th><th scope="col">{text.fund}</th><th scope="col">{text.account}</th><th scope="col">{text.reference}</th><th scope="col">{text.amount}</th></tr></thead><tbody>{category.transactions.map((transaction) => <tr key={transaction.id}><td>{date.format(new Date(`${transaction.transactionDate}T00:00:00`))}</td><td><strong>{transaction.description}</strong><span className="reference">Ref. {transaction.id.slice(0, 8).toUpperCase()}</span></td><td>{getFundLabel(locale, transaction.fund)}</td><td>{getAccountLabel(locale, transaction.account)}</td><td>{transaction.paymentReference ?? "—"}</td><td className={`amount ${transactionType === "income" ? "positive" : "negative"}`}>{transactionType === "income" ? "+" : "−"}{transaction.amount}</td></tr>)}</tbody></table></div>
    </section>)}
  </>;
}
