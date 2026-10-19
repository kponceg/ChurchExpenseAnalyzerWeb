import Link from "next/link";
import { listTransactions } from "@/server/accounting/list-transactions";
import { getAccountLabel, getCategoryLabel, getFundLabel, getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string; start?: string; end?: string; account?: string; category?: string; fund?: string }> }) {
  const { q, type, status, start, end, account, category, fund } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const selectedType = type === "income" || type === "expense" ? type : "";
  const selectedStatus = status === "posted" || status === "reversed" ? status : "";
  const startDate = typeof start === "string" ? start : "";
  const endDate = typeof end === "string" ? end : "";
  const accountId = typeof account === "string" ? account : "";
  const categoryId = typeof category === "string" ? category : "";
  const fundId = typeof fund === "string" ? fund : "";
  const hasFilters = Boolean(search || selectedType || selectedStatus || startDate || endDate || accountId || categoryId || fundId);
  const result = await listTransactions({ search, type: selectedType || undefined, status: selectedStatus || undefined, startDate, endDate, accountId, categoryId, fundId });
  const locale = await getLocale();
  const text = getMessages(locale);
  const membership = await getCurrentMembership();
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const dateTime = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <p className="eyebrow">{text.activity.eyebrow}</p>
      <div className="page-heading">
        <div><h1>{text.activity.title}</h1><p className="lede">{text.activity.lede}</p></div>
        {membership?.canRecordTransactions && <Link className="primary" href="/transactions/new">{text.nav.transaction}</Link>}
      </div>

      <form className="activity-filters" method="get">
        <div className="field">
          <label htmlFor="activity-search">{text.activity.search}</label>
          <input id="activity-search" name="q" type="search" defaultValue={search} placeholder={text.activity.searchPlaceholder} maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="activity-start">{text.activity.startDate}</label>
          <input id="activity-start" name="start" type="date" defaultValue={startDate} />
        </div>
        <div className="field">
          <label htmlFor="activity-end">{text.activity.endDate}</label>
          <input id="activity-end" name="end" type="date" defaultValue={endDate} />
        </div>
        <div className="field">
          <label htmlFor="activity-account">{text.activity.filterAccount}</label>
          <select id="activity-account" name="account" defaultValue={accountId}>
            <option value="">{text.activity.allAccounts}</option>
            {result.ok && result.accounts.map((item) => <option key={item.id} value={item.id}>{getAccountLabel(locale, item.name)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="activity-category">{text.activity.filterCategory}</label>
          <select id="activity-category" name="category" defaultValue={categoryId}>
            <option value="">{text.activity.allCategories}</option>
            {result.ok && result.categories.map((item) => <option key={item.id} value={item.id}>{getCategoryLabel(locale, item.name)} — {item.transaction_type === "income" ? text.activity.incomeType : text.activity.expenseType}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="activity-fund">{text.activity.filterFund}</label>
          <select id="activity-fund" name="fund" defaultValue={fundId}>
            <option value="">{text.activity.allFunds}</option>
            {result.ok && result.funds.map((item) => <option key={item.id} value={item.id}>{getFundLabel(locale, item.name)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="activity-type">{text.activity.filterType}</label>
          <select id="activity-type" name="type" defaultValue={selectedType}>
            <option value="">{text.activity.allTypes}</option>
            <option value="income">{text.activity.incomeType}</option>
            <option value="expense">{text.activity.expenseType}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="activity-status">{text.activity.filterStatus}</label>
          <select id="activity-status" name="status" defaultValue={selectedStatus}>
            <option value="">{text.activity.allStatuses}</option>
            <option value="posted">{text.activity.posted}</option>
            <option value="reversed">{text.activity.voided}</option>
          </select>
        </div>
        <button className="secondary-button" type="submit">{text.activity.applyFilters}</button>
        {hasFilters && <Link className="table-action" href="/activity">{text.activity.clearFilters}</Link>}
      </form>

      {!result.ok ? (
        <section className="state-panel" role="alert"><h2>{text.activity.unavailable}</h2><p>{result.error}</p></section>
      ) : result.transactions.length === 0 ? (
        <section className="state-panel"><h2>{hasFilters ? text.activity.noMatches : text.activity.empty}</h2><p>{hasFilters ? text.activity.noMatchesText : text.activity.emptyText}</p></section>
      ) : (
        <div className="table-wrap activity-table-wrap">
          <table className="activity-table activity-register">
            <thead><tr><th scope="col">{text.activity.date}</th><th scope="col">{text.activity.type}</th><th scope="col">{text.activity.status}</th><th scope="col">{text.activity.description}</th><th scope="col">{text.activity.category}</th><th scope="col">{text.activity.fund}</th><th scope="col">{text.activity.account}</th><th scope="col">{text.activity.amount}</th><th scope="col">{text.activity.actions}</th></tr></thead>
            <tbody>
              {result.transactions.map((transaction) => (
                <tr key={transaction.id} className={transaction.status === "reversed" ? "voided-row" : undefined}>
                  <td data-label={text.activity.date}>{date.format(new Date(`${transaction.transactionDate}T00:00:00`))}</td>
                  <td data-label={text.activity.type}><span className={`transaction-type ${transaction.transactionType}`}>{transaction.transactionType === "income" ? text.activity.incomeType : text.activity.expenseType}</span></td>
                  <td data-label={text.activity.status}><span className={`transaction-status ${transaction.status}`}>{transaction.status === "posted" ? text.activity.posted : text.activity.voided}</span></td>
                  <td data-label={text.activity.description}><strong>{transaction.description}</strong><span className="reference">{text.activity.ref} {transaction.id.slice(0, 8).toUpperCase()}{transaction.paymentReference ? ` · ${text.activity.paymentRef}: ${transaction.paymentReference}` : ""}</span>{transaction.status === "reversed" && <span className="void-details">{text.activity.voidReason}: {transaction.voidReason}<br />{transaction.voidedAt ? `${text.activity.voidedOn}: ${dateTime.format(new Date(transaction.voidedAt))}` : ""}</span>}</td>
                  <td data-label={text.activity.category}>{getCategoryLabel(locale, transaction.category)}</td>
                  <td data-label={text.activity.fund}>{getFundLabel(locale, transaction.fund)}</td>
                  <td data-label={text.activity.account}>{getAccountLabel(locale, transaction.account)}</td>
                  <td data-label={text.activity.amount} className={`amount ${transaction.transactionType === "income" ? "positive" : "negative"}`}>{transaction.transactionType === "income" ? "+" : "−"}{currency.format(transaction.amount)}</td>
                  <td data-label={text.activity.actions}><div className="activity-actions">{transaction.status === "posted" && membership?.canRecordTransactions && <Link className="table-action" href={`/transactions/${transaction.id}/edit`}>{text.activity.edit}</Link>}{transaction.attachments.map((attachment) => <a className="table-action" href={`/api/transactions/${transaction.id}/attachments/${attachment.id}`} target="_blank" rel="noreferrer" title={attachment.filename} key={attachment.id}>{text.activity.viewAttachment}</a>)}{transaction.status !== "posted" && transaction.attachments.length === 0 && "—"}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
