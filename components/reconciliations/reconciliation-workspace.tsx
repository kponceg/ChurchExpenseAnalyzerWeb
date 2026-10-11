"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { calculateReconciliation, decimalToCents } from "@/lib/reconciliation-calculations";
import type { ReconciliationTransaction } from "@/server/accounting/get-account-reconciliation";

type Reconciliation = { id: string; accountName: string; periodStart: string; periodEnd: string; beginningBalance: string; statementEndingBalance: string; status: "draft" | "completed"; notes: string | null; completedAt: string | null };
type Labels = { back: string; draft: string; completed: string; period: string; beginningBalance: string; clearedActivity: string; clearedBalance: string; statementBalance: string; difference: string; instructions: string; date: string; description: string; reference: string; amount: string; cleared: string; noTransactions: string; complete: string; completing: string; completeHint: string; completedMessage: string; cancel: string; cancelling: string; cancelConfirm: string; error: string };

export function ReconciliationWorkspace({ locale, reconciliation, transactions, canReconcile, labels }: { locale: Locale; reconciliation: Reconciliation; transactions: ReconciliationTransaction[]; canReconcile: boolean; labels: Labels }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const currency = new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", { style: "currency", currency: "USD" });
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const { clearedActivity, clearedBalance, difference } = calculateReconciliation(reconciliation.beginningBalance, reconciliation.statementEndingBalance, transactions);
  const format = (cents: bigint) => currency.format(Number(cents) / 100);
  const editable = reconciliation.status === "draft" && canReconcile;

  async function toggle(transaction: ReconciliationTransaction) {
    setBusy(transaction.id); setError("");
    const response = await fetch(`/api/reconciliations/${reconciliation.id}/transactions/${transaction.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cleared: !transaction.cleared }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? labels.error); else router.refresh();
    setBusy(null);
  }
  async function complete() {
    setBusy("complete"); setError("");
    const response = await fetch(`/api/reconciliations/${reconciliation.id}/complete`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? labels.error); else router.refresh();
    setBusy(null);
  }
  async function cancel() {
    if (!window.confirm(labels.cancelConfirm)) return;
    setBusy("cancel"); setError("");
    const response = await fetch(`/api/reconciliations/${reconciliation.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? labels.error); setBusy(null); return; }
    router.push("/reconciliations"); router.refresh();
  }

  return <>
    <section className="reconciliation-summary"><div><span className={`transaction-status ${reconciliation.status}`}>{reconciliation.status === "draft" ? labels.draft : labels.completed}</span><h2>{reconciliation.accountName}</h2><p>{labels.period}: {date.format(new Date(`${reconciliation.periodStart}T00:00:00Z`))} – {date.format(new Date(`${reconciliation.periodEnd}T00:00:00Z`))}</p>{reconciliation.notes && <p>{reconciliation.notes}</p>}</div><dl><div><dt>{labels.beginningBalance}</dt><dd>{format(decimalToCents(reconciliation.beginningBalance))}</dd></div><div><dt>{labels.clearedActivity}</dt><dd>{format(clearedActivity)}</dd></div><div><dt>{labels.clearedBalance}</dt><dd>{format(clearedBalance)}</dd></div><div><dt>{labels.statementBalance}</dt><dd>{format(decimalToCents(reconciliation.statementEndingBalance))}</dd></div><div className="reconciliation-difference"><dt>{labels.difference}</dt><dd className={difference === 0n ? "positive" : "negative"}>{format(difference)}</dd></div></dl></section>
    <p className="settings-notice">{labels.instructions}</p>
    {transactions.length === 0 ? <section className="state-panel"><p>{labels.noTransactions}</p></section> : <div className="table-wrap"><table className="activity-table reconciliation-table"><thead><tr><th scope="col">{labels.cleared}</th><th scope="col">{labels.date}</th><th scope="col">{labels.description}</th><th scope="col">{labels.reference}</th><th scope="col">{labels.amount}</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td><input type="checkbox" checked={transaction.cleared} disabled={!editable || busy !== null} onChange={() => toggle(transaction)} aria-label={`${labels.cleared}: ${transaction.description}`} /></td><td>{date.format(new Date(`${transaction.transactionDate}T00:00:00Z`))}</td><td><strong>{transaction.description}</strong><span className="reference">{transaction.id.slice(0, 8).toUpperCase()}</span></td><td>{transaction.paymentReference ?? "—"}</td><td className={`amount ${transaction.transactionType === "income" ? "positive" : "negative"}`}>{transaction.transactionType === "income" ? "+" : "−"}{currency.format(Number(transaction.amount))}</td></tr>)}</tbody></table></div>}
    {error && <p className="message error reconciliation-error" role="alert">{error}</p>}
    {editable && <div className="reconciliation-controls"><div><button className="primary" disabled={difference !== 0n || busy !== null} onClick={complete}>{busy === "complete" ? labels.completing : labels.complete}</button><small>{labels.completeHint}</small></div><button className="danger-button" disabled={busy !== null} onClick={cancel}>{busy === "cancel" ? labels.cancelling : labels.cancel}</button></div>}
    {reconciliation.status === "completed" && <p className="message success reconciliation-error" role="status">{labels.completedMessage}</p>}
  </>;
}
