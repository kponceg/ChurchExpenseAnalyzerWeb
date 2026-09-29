"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccountLabel, getCategoryLabel, getFundLabel, getMessages, type Locale } from "@/lib/i18n";

type Option = { id: string; name: string };
type EditableTransaction = { id: string; transactionType: "income" | "expense"; transactionDate: string; amount: string; description: string; paymentReference: string; categoryId: string; fundId: string; accountId: string };

export function EditTransactionForm({ locale, transaction, options }: { locale: Locale; transaction: EditableTransaction; options: { accounts: Option[]; categories: Option[]; funds: Option[] } }) {
  const router = useRouter();
  const text = getMessages(locale);
  const labels = text.editTransaction;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), transactionType: transaction.transactionType };
    const response = await fetch(`/api/transactions/${transaction.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setError(locale === "es" ? labels.invalid : (result.error ?? labels.invalid));
    else {
      setSaved(true);
      router.push("/activity");
      router.refresh();
    }
    setSubmitting(false);
  }

  async function handleVoid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVoiding(true);
    setVoidError("");
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    const response = await fetch(`/api/transactions/${transaction.id}/void`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    const result = await response.json();
    if (!response.ok) {
      setVoidError(locale === "es" ? labels.voidInvalid : (result.error ?? labels.voidInvalid));
      setVoiding(false);
      return;
    }
    router.push("/activity");
    router.refresh();
  }

  return <section className="panel">
    <div className="edit-transaction-type"><span>{labels.type}</span><strong className={`transaction-type ${transaction.transactionType}`}>{transaction.transactionType === "income" ? text.activity.incomeType : text.activity.expenseType}</strong><small>{labels.typeLocked}</small></div>
    <form onSubmit={handleSubmit}><div className="form-grid">
      <div className="field"><label htmlFor="amount">{labels.amount}</label><input id="amount" name="amount" inputMode="decimal" defaultValue={transaction.amount} required /></div>
      <div className="field"><label htmlFor="transactionDate">{labels.date}</label><input id="transactionDate" name="transactionDate" type="date" defaultValue={transaction.transactionDate} required /></div>
      <div className="field"><label htmlFor="categoryId">{labels.category}</label><select id="categoryId" name="categoryId" defaultValue={transaction.categoryId} required>{options.categories.map((option) => <option key={option.id} value={option.id}>{getCategoryLabel(locale, option.name)}</option>)}</select></div>
      <div className="field"><label htmlFor="fundId">{labels.fund}</label><select id="fundId" name="fundId" defaultValue={transaction.fundId} required>{options.funds.map((option) => <option key={option.id} value={option.id}>{getFundLabel(locale, option.name)}</option>)}</select></div>
      <div className="field full"><label htmlFor="accountId">{labels.account}</label><select id="accountId" name="accountId" defaultValue={transaction.accountId} required>{options.accounts.map((option) => <option key={option.id} value={option.id}>{getAccountLabel(locale, option.name)}</option>)}</select></div>
      <div className="field full"><label htmlFor="description">{labels.description}</label><textarea id="description" name="description" maxLength={160} defaultValue={transaction.description} required /></div>
      {transaction.transactionType === "expense" && <div className="field full"><label htmlFor="paymentReference">{labels.reference}</label><input id="paymentReference" name="paymentReference" maxLength={80} defaultValue={transaction.paymentReference} /></div>}
    </div><div className="actions"><button className="primary" disabled={submitting}>{submitting ? labels.saving : labels.save}</button><Link className="secondary-link" href="/activity">{labels.cancel}</Link>{error && <p className="message error" role="alert">{error}</p>}{saved && <p className="message success" role="status">{labels.saved}</p>}</div></form>
    <div className="danger-zone"><div><h2>{labels.voidTitle}</h2><p>{labels.voidText}</p></div>{!showVoid && <button className="danger-button" type="button" onClick={() => setShowVoid(true)}>{labels.voidAction}</button>}{showVoid && <form className="void-form" onSubmit={handleVoid}><div className="field"><label htmlFor="void-reason">{labels.voidReason}</label><textarea id="void-reason" name="reason" minLength={3} maxLength={160} required /></div><div className="actions"><button className="danger-button" disabled={voiding}>{voiding ? labels.voiding : labels.confirmVoid}</button><button className="secondary-button" type="button" onClick={() => { setShowVoid(false); setVoidError(""); }}>{labels.keepTransaction}</button></div>{voidError && <p className="message error" role="alert">{voidError}</p>}</form>}</div>
  </section>;
}
