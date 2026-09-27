"use client";
import { FormEvent, useState } from "react";
import { getMessages, type Locale } from "@/lib/i18n";
type Preview = { amount: string; transactionDate: string; category: string; fund: string; description: string; paymentReference: string; transactionId: string };
export function ExpenseTransactionForm({ locale }: { locale: Locale }) {
  const text = getMessages(locale);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true); setError(""); setPreview(null);
    const form = new FormData(formElement);
    const payload = { ...Object.fromEntries(form.entries()), idempotencyKey: crypto.randomUUID() };
    const response = await fetch("/api/transactions/expense", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setError(locale === "es" ? text.expense.invalid : (result.error ?? text.expense.invalid));
    else { setPreview({ ...result.transaction, transactionId: result.transactionId }); formElement.reset(); }
    setSubmitting(false);
  }
  return <section className="panel">
    <form onSubmit={handleSubmit}><div className="form-grid">
      <div className="field"><label htmlFor="amount">{text.expense.amount}</label><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required /></div>
      <div className="field"><label htmlFor="transactionDate">{text.expense.date}</label><input id="transactionDate" name="transactionDate" type="date" required /></div>
      <div className="field"><label htmlFor="category">{text.expense.category}</label><select id="category" name="category" required defaultValue=""><option value="" disabled>{text.expense.selectCategory}</option>{text.categories.map((value, index) => <option key={value} value={value}>{text.categoryLabels[index]}</option>)}</select><small className="field-hint">{text.expense.categoryHint}</small></div>
      <div className="field"><label htmlFor="fund">{text.expense.fund}</label><select id="fund" name="fund" required defaultValue=""><option value="" disabled>{text.expense.selectFund}</option>{text.funds.map((value, index) => <option key={value} value={value}>{text.fundLabels[index]}</option>)}</select></div>
      <div className="field full"><label htmlFor="description">{text.expense.description}</label><textarea id="description" name="description" maxLength={160} required /></div>
      <div className="field full"><label htmlFor="paymentReference">{text.expense.reference}</label><input id="paymentReference" name="paymentReference" maxLength={80} /></div>
    </div><div className="actions"><button className="primary" disabled={submitting}>{submitting ? text.expense.saving : text.expense.save}</button>{error && <p className="message error" role="alert">{error}</p>}</div></form>
    {preview && <div className="preview" aria-live="polite"><h2>{text.expense.saved}</h2><dl><dt>{text.expense.transactionReference}</dt><dd>{preview.transactionId.slice(0, 8).toUpperCase()}</dd><dt>{text.expense.amount}</dt><dd>{preview.amount}</dd><dt>{text.expense.date}</dt><dd>{preview.transactionDate}</dd><dt>{text.expense.category}</dt><dd>{preview.category}</dd><dt>{text.expense.fund}</dt><dd>{preview.fund}</dd><dt>{text.expense.description}</dt><dd>{preview.description}</dd><dt>{text.expense.paymentReference}</dt><dd>{preview.paymentReference || text.expense.none}</dd></dl></div>}
  </section>;
}
