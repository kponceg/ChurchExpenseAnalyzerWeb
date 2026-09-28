import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getMonthlyReport } from "@/server/accounting/get-monthly-report";
import Link from "next/link";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const locale = await getLocale();
  const text = getMessages(locale).reports;
  const { year } = await searchParams;
  const result = await getMonthlyReport(locale, year);

  if (!result.ok) return <><p className="eyebrow">{text.eyebrow}</p><h1>{text.title}</h1><section className="state-panel" role="alert"><h2>{text.unavailable}</h2><p>{result.error}</p></section></>;

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">{text.eyebrow} · {result.report.year}</p><h1>{text.title}</h1></div>
      <a className="primary report-download" href={`/api/reports/pdf?year=${result.report.year}`} download>{text.downloadPdf}</a>
    </div>
    <p className="lede">{text.lede}</p>
    <form className="report-filters" method="get">
      <label htmlFor="report-year">{text.year}</label>
      <select id="report-year" name="year" defaultValue={result.report.year}>
        {result.report.availableYears.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
      </select>
      <button className="primary" type="submit">{text.viewReport}</button>
    </form>
    <section className="summary" aria-label={text.title}>
      <div className="metric"><span>{text.income}</span><strong className="positive">+{result.report.totalIncome}</strong></div>
      <div className="metric"><span>{text.expenses}</span><strong className="negative">−{result.report.totalExpenses}</strong></div>
      <div className="metric"><span>{text.net}</span><strong className={result.report.netDirection}>{result.report.net}</strong></div>
    </section>
    <div className="table-wrap">
      <table className="activity-table report-table">
        <thead><tr><th scope="col">{text.month}</th><th scope="col">{text.income}</th><th scope="col">{text.expenses}</th><th scope="col">{text.net}</th></tr></thead>
        <tbody>
          {result.report.months.map((month) => <tr key={month.key}><td className="month-name">{month.label}</td><td className="amount positive"><Link className="report-detail-link" href={`/reports/${month.key}?type=income`}>+{month.income}</Link></td><td className="amount negative"><Link className="report-detail-link" href={`/reports/${month.key}?type=expense`}>−{month.expenses}</Link></td><td className={`amount ${month.netDirection}`}>{month.net}</td></tr>)}
          <tr className="report-total"><td>{text.total}</td><td className="amount positive">+{result.report.totalIncome}</td><td className="amount negative">−{result.report.totalExpenses}</td><td className={`amount ${result.report.netDirection}`}>{result.report.net}</td></tr>
        </tbody>
      </table>
    </div>
  </>;
}
