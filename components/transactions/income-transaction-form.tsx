"use client";

import { FormEvent, useState } from "react";

type Preview = {
  amount: string;
  transactionDate: string;
  category: string;
  fund: string;
  description: string;
};

export function IncomeTransactionForm() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setPreview(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/transactions/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) setError(result.error ?? "The transaction could not be validated.");
    else setPreview(result.transaction);

    setSubmitting(false);
  }

  return (
    <section className="panel">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field"><label htmlFor="amount">Amount</label><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required /></div>
          <div className="field"><label htmlFor="transactionDate">Transaction date</label><input id="transactionDate" name="transactionDate" type="date" required /></div>
          <div className="field"><label htmlFor="category">Category</label><select id="category" name="category" required defaultValue=""><option value="" disabled>Select a category</option><option>Tithe</option><option>Church offering</option><option>Children&apos;s offering</option><option>First fruits</option><option>Talent / food</option><option>Temple rent</option><option>General support</option></select></div>
          <div className="field"><label htmlFor="fund">Fund or purpose</label><select id="fund" name="fund" required defaultValue=""><option value="" disabled>Select a fund</option><option>Support of the work</option><option>General congregation</option><option>Children&apos;s commission</option><option>Legal and building</option><option>Presbytery</option></select></div>
          <div className="field full"><label htmlFor="description">Description</label><textarea id="description" name="description" maxLength={160} required /></div>
        </div>
        <div className="actions"><button className="primary" disabled={submitting}>{submitting ? "Validating…" : "Review income"}</button>{error && <p className="message error" role="alert">{error}</p>}</div>
      </form>
      {preview && <div className="preview" aria-live="polite"><h2>Validated transaction preview</h2><dl><dt>Amount</dt><dd>{preview.amount}</dd><dt>Date</dt><dd>{preview.transactionDate}</dd><dt>Category</dt><dd>{preview.category}</dd><dt>Fund</dt><dd>{preview.fund}</dd><dt>Description</dt><dd>{preview.description}</dd></dl></div>}
    </section>
  );
}
