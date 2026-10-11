"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { AccountReconciliation } from "@/server/accounting/list-account-reconciliations";

type Labels = {
  createTitle: string; createText: string; account: string; selectAccount: string; startDate: string; endDate: string;
  endingBalance: string; endingBalanceHint: string; notes: string; notesHint: string; start: string; starting: string;
  started: string; error: string; readOnly: string; noHistory: string; draft: string; completed: string;
  beginningBalance: string; statementBalance: string; period: string; continueDraft: string; view: string;
};

export function ReconciliationsPanel({ locale, accounts, reconciliations, canReconcile, labels }: { locale: Locale; accounts: Array<{ id: string; name: string; active: boolean }>; reconciliations: AccountReconciliation[]; canReconcile: boolean; labels: Labels }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const currency = new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", { style: "currency", currency: "USD" });
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = event.currentTarget;
    const response = await fetch("/api/reconciliations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    const result = await response.json();
    if (response.ok) {
      setMessage({ type: "success", text: labels.started });
      form.reset();
      router.push(`/reconciliations/${result.reconciliationId}`);
    } else setMessage({ type: "error", text: result.error ?? labels.error });
    setSaving(false);
  }

  return <>
    {canReconcile ? <section className="add-member-panel"><div><h2>{labels.createTitle}</h2><p>{labels.createText}</p></div><form className="add-member-form" onSubmit={start}>
      <div className="field"><label htmlFor="reconciliation-account">{labels.account}</label><select id="reconciliation-account" name="accountId" defaultValue="" required><option value="" disabled>{labels.selectAccount}</option>{accounts.filter((account) => account.active).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
      <div className="form-grid"><div className="field"><label htmlFor="reconciliation-start">{labels.startDate}</label><input id="reconciliation-start" name="periodStart" type="date" required /></div><div className="field"><label htmlFor="reconciliation-end">{labels.endDate}</label><input id="reconciliation-end" name="periodEnd" type="date" required /></div></div>
      <div className="field"><label htmlFor="reconciliation-balance">{labels.endingBalance}</label><input id="reconciliation-balance" name="statementEndingBalance" inputMode="decimal" placeholder="0.00" required /><small className="field-hint">{labels.endingBalanceHint}</small></div>
      <div className="field"><label htmlFor="reconciliation-notes">{labels.notes}</label><textarea id="reconciliation-notes" name="notes" maxLength={500} /><small className="field-hint">{labels.notesHint}</small></div>
      <button className="primary" disabled={saving}>{saving ? labels.starting : labels.start}</button>
    </form></section> : <p className="settings-notice">{labels.readOnly}</p>}
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    {reconciliations.length === 0 ? <section className="state-panel"><p>{labels.noHistory}</p></section> : <div className="reconciliation-grid">{reconciliations.map((item) => <article className="reconciliation-card" key={item.id}><div><span className={`transaction-status ${item.status}`}>{item.status === "draft" ? labels.draft : labels.completed}</span><h2>{item.accountName}</h2><p>{labels.period}: {date.format(new Date(`${item.periodStart}T00:00:00Z`))} – {date.format(new Date(`${item.periodEnd}T00:00:00Z`))}</p></div><dl><div><dt>{labels.beginningBalance}</dt><dd>{currency.format(item.beginningBalance)}</dd></div><div><dt>{labels.statementBalance}</dt><dd>{currency.format(item.statementEndingBalance)}</dd></div></dl>{item.notes && <p className="reconciliation-notes">{item.notes}</p>}<Link className="secondary-link" href={`/reconciliations/${item.id}`}>{item.status === "draft" ? labels.continueDraft : labels.view}</Link></article>)}</div>}
  </>;
}
