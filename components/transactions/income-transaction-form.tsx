"use client";

import { FormEvent, useState } from "react";
import { getMessages, type Locale } from "@/lib/i18n";

type Preview = {
  amount: string;
  transactionDate: string;
  category: string;
  fund: string;
  description: string;
  transactionId: string;
};

export function IncomeTransactionForm({ locale }: { locale: Locale }) {
  const text = getMessages(locale);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError("");
    setPreview(null);

    const form = new FormData(formElement);
    const payload = { ...Object.fromEntries(form.entries()), idempotencyKey: crypto.randomUUID() };
    const response = await fetch("/api/transactions/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) setError(locale === "es" ? text.income.invalid : (result.error ?? text.income.invalid));
    else {
      setPreview({ ...result.transaction, transactionId: result.transactionId });
      formElement.reset();
    }

    setSubmitting(false);
  }

  return (
    <section className="panel">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field"><label htmlFor="amount">{text.income.amount}</label><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required /></div>
          <div className="field"><label htmlFor="transactionDate">{text.income.date}</label><input id="transactionDate" name="transactionDate" type="date" required /></div>
          <div className="field"><label htmlFor="category">{text.income.category}</label><select id="category" name="category" required defaultValue=""><option value="" disabled>{text.income.selectCategory}</option><option value="Tithe">{locale === "es" ? "Diezmo" : "Tithe"}</option><option value="Church offering">{locale === "es" ? "Ofrenda de la iglesia" : "Church offering"}</option><option value="Children's offering">{locale === "es" ? "Ofrenda infantil" : "Children’s offering"}</option><option value="First fruits">{locale === "es" ? "Primicias" : "First fruits"}</option><option value="Talent / food">{locale === "es" ? "Talento / alimentos" : "Talent / food"}</option><option value="Temple rent">{locale === "es" ? "Renta del templo" : "Temple rent"}</option><option value="General support">{locale === "es" ? "Apoyo general" : "General support"}</option></select></div>
          <div className="field"><label htmlFor="fund">{text.income.fund}</label><select id="fund" name="fund" required defaultValue=""><option value="" disabled>{text.income.selectFund}</option>{text.funds.map((value, index) => <option key={value} value={value}>{text.fundLabels[index]}</option>)}</select></div>
          <div className="field full"><label htmlFor="description">{text.income.description}</label><textarea id="description" name="description" maxLength={160} required /></div>
        </div>
        <div className="actions"><button className="primary" disabled={submitting}>{submitting ? text.income.saving : text.income.save}</button>{error && <p className="message error" role="alert">{error}</p>}</div>
      </form>
      {preview && <div className="preview" aria-live="polite"><h2>{text.income.saved}</h2><dl><dt>{text.income.reference}</dt><dd>{preview.transactionId.slice(0, 8).toUpperCase()}</dd><dt>{text.income.amount}</dt><dd>{preview.amount}</dd><dt>{text.income.date}</dt><dd>{preview.transactionDate}</dd><dt>{text.income.category}</dt><dd>{preview.category}</dd><dt>{text.income.fund}</dt><dd>{preview.fund}</dd><dt>{text.income.description}</dt><dd>{preview.description}</dd></dl></div>}
    </section>
  );
}
