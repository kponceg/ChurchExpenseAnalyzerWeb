"use client";

import { FormEvent, useState } from "react";
import { getCategoryLabel, getFundLabel, getMessages, type Locale } from "@/lib/i18n";
import type { CategoryTransactionType } from "@/server/accounting/list-financial-categories";

type TransactionType = "income" | "expense";
type Preview = { amount: string; transactionDate: string; category: string; fund: string; account: string; description: string; paymentReference?: string; transactionId: string; attachmentName?: string };

export function TransactionForm({ locale, initialType, accounts, categories, funds }: { locale: Locale; initialType: TransactionType; accounts: Array<{ id: string; name: string }>; categories: Array<{ id: string; name: string; transactionType: CategoryTransactionType }>; funds: Array<{ id: string; name: string }> }) {
  const text = getMessages(locale);
  const [transactionType, setTransactionType] = useState<TransactionType>(initialType);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const labels = transactionType === "income" ? text.income : text.expense;

  const availableCategories = categories.filter((category) => category.transactionType === transactionType);

  function changeType(value: TransactionType) {
    setTransactionType(value);
    setPreview(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError("");
    setPreview(null);
    const form = new FormData(formElement);
    const attachment = form.get("attachment");
    form.delete("attachment");
    form.delete("transactionType");
    const payload = { ...Object.fromEntries(form.entries()), idempotencyKey: crypto.randomUUID() };
    const response = await fetch(`/api/transactions/${transactionType}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setError(locale === "es" ? labels.invalid : (result.error ?? labels.invalid));
    else {
      let attachmentName: string | undefined;
      if (attachment instanceof File && attachment.size > 0) {
        const uploadForm = new FormData();
        uploadForm.set("file", attachment);
        const uploadResponse = await fetch(`/api/transactions/${result.transactionId}/attachments`, { method: "POST", body: uploadForm });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) setError(locale === "es" ? text.transaction.attachmentUploadFailed : (uploadResult.error ?? text.transaction.attachmentUploadFailed));
        else attachmentName = uploadResult.attachment.original_filename;
      }
      setPreview({ ...result.transaction, transactionId: result.transactionId, attachmentName });
      formElement.reset();
    }
    setSubmitting(false);
  }

  return <section className="panel">
    <form onSubmit={handleSubmit}><div className="form-grid">
      <div className="field full"><label htmlFor="transactionType">{text.transaction.type}</label><select id="transactionType" name="transactionType" value={transactionType} onChange={(event) => changeType(event.target.value as TransactionType)}><option value="income">{text.transaction.income}</option><option value="expense">{text.transaction.expense}</option></select><small className="field-hint">{text.transaction.typeHint}</small></div>
      <div className="field"><label htmlFor="amount">{labels.amount}</label><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required /></div>
      <div className="field"><label htmlFor="transactionDate">{labels.date}</label><input id="transactionDate" name="transactionDate" type="date" required /></div>
      <div className="field"><label htmlFor="category">{labels.category}</label><select key={transactionType} id="category" name="category" required defaultValue=""><option value="" disabled>{labels.selectCategory}</option>{availableCategories.map((category) => <option key={category.id} value={category.name}>{getCategoryLabel(locale, category.name)}</option>)}</select><small className="field-hint">{labels.categoryHint}</small></div>
      <div className="field"><label htmlFor="fund">{labels.fund}</label><select id="fund" name="fund" required defaultValue=""><option value="" disabled>{labels.selectFund}</option>{funds.map((fund) => <option key={fund.id} value={fund.name}>{getFundLabel(locale, fund.name)}</option>)}</select></div>
      <div className="field full"><label htmlFor="accountId">{text.transaction.account}</label><select id="accountId" name="accountId" required defaultValue=""><option value="" disabled>{text.transaction.selectAccount}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><small className="field-hint">{text.transaction.accountHint}</small></div>
      <div className="field full"><label htmlFor="description">{labels.description}</label><textarea id="description" name="description" maxLength={160} required /></div>
      {transactionType === "expense" && <div className="field full"><label htmlFor="paymentReference">{text.expense.reference}</label><input id="paymentReference" name="paymentReference" maxLength={80} /></div>}
      <div className="field full"><label htmlFor="attachment">{text.transaction.attachment}</label><input id="attachment" name="attachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /><small className="field-hint">{text.transaction.attachmentHint}</small></div>
    </div><div className="actions"><button className="primary" disabled={submitting}>{submitting ? labels.saving : labels.save}</button>{error && <p className="message error" role="alert">{error}</p>}</div></form>
    {preview && <div className="preview" aria-live="polite"><h2>{labels.saved}</h2><dl><dt>{transactionType === "income" ? text.income.reference : text.expense.transactionReference}</dt><dd>{preview.transactionId.slice(0, 8).toUpperCase()}</dd><dt>{labels.amount}</dt><dd>{preview.amount}</dd><dt>{labels.date}</dt><dd>{preview.transactionDate}</dd><dt>{labels.category}</dt><dd>{preview.category}</dd><dt>{labels.fund}</dt><dd>{preview.fund}</dd><dt>{text.transaction.account}</dt><dd>{preview.account}</dd><dt>{labels.description}</dt><dd>{preview.description}</dd>{transactionType === "expense" && <><dt>{text.expense.paymentReference}</dt><dd>{preview.paymentReference || text.expense.none}</dd></>}{preview.attachmentName && <><dt>{text.transaction.attachment}</dt><dd>{preview.attachmentName}</dd></>}</dl></div>}
  </section>;
}
