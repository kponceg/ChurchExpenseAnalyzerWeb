import Link from "next/link";
import { listTransactions } from "@/server/accounting/list-transactions";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function ActivityPage() {
  const result = await listTransactions();
  const locale = await getLocale();
  const text = getMessages(locale);
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <p className="eyebrow">{text.activity.eyebrow}</p>
      <div className="page-heading">
        <div><h1>{text.activity.title}</h1><p className="lede">{text.activity.lede}</p></div>
        <div className="page-actions"><Link className="primary" href="/transactions/new">{text.nav.income}</Link><Link className="secondary-link" href="/transactions/expense/new">{text.nav.expense}</Link></div>
      </div>

      {!result.ok ? (
        <section className="state-panel" role="alert"><h2>{text.activity.unavailable}</h2><p>{result.error}</p></section>
      ) : result.transactions.length === 0 ? (
        <section className="state-panel"><h2>{text.activity.empty}</h2><p>{text.activity.emptyText}</p></section>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead><tr><th scope="col">{text.activity.date}</th><th scope="col">{text.activity.type}</th><th scope="col">{text.activity.description}</th><th scope="col">{text.activity.category}</th><th scope="col">{text.activity.fund}</th><th scope="col">{text.activity.account}</th><th scope="col">{text.activity.amount}</th></tr></thead>
            <tbody>
              {result.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{date.format(new Date(`${transaction.transactionDate}T00:00:00`))}</td>
                  <td><span className={`transaction-type ${transaction.transactionType}`}>{transaction.transactionType === "income" ? text.activity.incomeType : text.activity.expenseType}</span></td>
                  <td><strong>{transaction.description}</strong><span className="reference">{text.activity.ref} {transaction.id.slice(0, 8).toUpperCase()}{transaction.paymentReference ? ` · ${text.activity.paymentRef}: ${transaction.paymentReference}` : ""}</span></td>
                  <td>{transaction.category}</td>
                  <td>{transaction.fund}</td>
                  <td>{transaction.account}</td>
                  <td className={`amount ${transaction.transactionType === "income" ? "positive" : "negative"}`}>{transaction.transactionType === "income" ? "+" : "−"}{currency.format(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
