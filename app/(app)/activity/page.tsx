import Link from "next/link";
import { listIncomeTransactions } from "@/server/accounting/list-income-transactions";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function ActivityPage() {
  const result = await listIncomeTransactions();

  return (
    <>
      <p className="eyebrow">Activity</p>
      <div className="page-heading">
        <div><h1>Income activity</h1><p className="lede">The latest posted income for your organization.</p></div>
        <Link className="primary" href="/transactions/new">Record income</Link>
      </div>

      {!result.ok ? (
        <section className="state-panel" role="alert"><h2>Activity unavailable</h2><p>{result.error}</p></section>
      ) : result.transactions.length === 0 ? (
        <section className="state-panel"><h2>No income yet</h2><p>Saved income transactions will appear here.</p></section>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead><tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col">Category</th><th scope="col">Fund</th><th scope="col">Account</th><th scope="col">Amount</th></tr></thead>
            <tbody>
              {result.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{date.format(new Date(`${transaction.transactionDate}T00:00:00`))}</td>
                  <td><strong>{transaction.description}</strong><span className="reference">Ref. {transaction.id.slice(0, 8).toUpperCase()}</span></td>
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
