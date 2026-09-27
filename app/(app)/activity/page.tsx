import Link from "next/link";
import { listIncomeTransactions } from "@/server/accounting/list-income-transactions";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function ActivityPage() {
  const result = await listIncomeTransactions();
  const locale = await getLocale();
  const text = getMessages(locale);

  return (
    <>
      <p className="eyebrow">{text.activity.eyebrow}</p>
      <div className="page-heading">
        <div><h1>{text.activity.title}</h1><p className="lede">{text.activity.lede}</p></div>
        <Link className="primary" href="/transactions/new">{text.nav.income}</Link>
      </div>

      {!result.ok ? (
        <section className="state-panel" role="alert"><h2>{text.activity.unavailable}</h2><p>{result.error}</p></section>
      ) : result.transactions.length === 0 ? (
        <section className="state-panel"><h2>{text.activity.empty}</h2><p>{text.activity.emptyText}</p></section>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead><tr><th scope="col">{text.activity.date}</th><th scope="col">{text.activity.description}</th><th scope="col">{text.activity.category}</th><th scope="col">{text.activity.fund}</th><th scope="col">{text.activity.account}</th><th scope="col">{text.activity.amount}</th></tr></thead>
            <tbody>
              {result.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{date.format(new Date(`${transaction.transactionDate}T00:00:00`))}</td>
                  <td><strong>{transaction.description}</strong><span className="reference">{text.activity.ref} {transaction.id.slice(0, 8).toUpperCase()}</span></td>
                  <td>{transaction.category}</td>
                  <td>{transaction.fund}</td>
                  <td>{transaction.account}</td>
                  <td className="amount positive">+{currency.format(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
