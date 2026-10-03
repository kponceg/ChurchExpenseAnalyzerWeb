"use client";

import { FormEvent, useState } from "react";
import { getMessages, type Locale } from "@/lib/i18n";

type TransactionType = "income" | "expense";
type Preview = { amount: string; transactionDate: string; category: string; fund: string; account: string; description: string; paymentReference?: string; transactionId: string };

export function TransactionForm({ locale, initialType, accounts }: { locale: Locale; initialType: TransactionType; accounts: Array<{ id: string; name: string }> }) {
  const text = getMessages(locale);
  const [transactionType, setTransactionType] = useState<TransactionType>(initialType);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const labels = transactionType === "income" ? text.income : text.expense;

  const incomeGroups = [
    { label: text.transaction.contributions, options: [["Tithe", locale === "es" ? "Diezmo" : "Tithe"], ["Church offering", locale === "es" ? "Ofrenda de la iglesia" : "Church offering"], ["Children's offering", locale === "es" ? "Ofrenda infantil" : "Children’s offering"], ["First fruits", locale === "es" ? "Primicias" : "First fruits"], ["General support", locale === "es" ? "Apoyo general" : "General support"]] },
    { label: text.transaction.earnedIncome, options: [["Talent / food", locale === "es" ? "Talento / alimentos" : "Talent / food"], ["Temple rent", locale === "es" ? "Ingreso por renta del templo (dinero recibido)" : "Temple rental income (money received)"]] },
  ];
  const expenseGroups = [
    { label: text.transaction.facilities, values: ["Building rent", "Utilities", "Church insurance"] },
    { label: text.transaction.operations, values: ["Bank fees", "Essential supplies"] },
    { label: text.transaction.ministry, values: ["Pastor support and travel", "Children's guides", "Magazine and literature", "Presbytery contributions"] },
    { label: text.transaction.other, values: ["Other expense"] },
  ];

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
    form.delete("transactionType");
    const payload = { ...Object.fromEntries(form.entries()), idempotencyKey: crypto.randomUUID() };
    const response = await fetch(`/api/transactions/${transactionType}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setError(locale === "es" ? labels.invalid : (result.error ?? labels.invalid));
    else { setPreview({ ...result.transaction, transactionId: result.transactionId }); formElement.reset(); }
    setSubmitting(false);
  }

  return <section className="panel">
    <form onSubmit={handleSubmit}><div className="form-grid">
      <div className="field full"><label htmlFor="transactionType">{text.transaction.type}</label><select id="transactionType" name="transactionType" value={transactionType} onChange={(event) => changeType(event.target.value as TransactionType)}><option value="income">{text.transaction.income}</option><option value="expense">{text.transaction.expense}</option></select><small className="field-hint">{text.transaction.typeHint}</small></div>
      <div className="field"><label htmlFor="amount">{labels.amount}</label><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required /></div>
      <div className="field"><label htmlFor="transactionDate">{labels.date}</label><input id="transactionDate" name="transactionDate" type="date" required /></div>
      <div className="field"><label htmlFor="category">{labels.category}</label><select key={transactionType} id="category" name="category" required defaultValue=""><option value="" disabled>{labels.selectCategory}</option>{transactionType === "income" ? incomeGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</optgroup>) : expenseGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.values.map((value) => { const index = text.categories.indexOf(value as typeof text.categories[number]); return <option key={value} value={value}>{text.categoryLabels[index]}</option>; })}</optgroup>)}</select><small className="field-hint">{labels.categoryHint}</small></div>
      <div className="field"><label htmlFor="fund">{labels.fund}</label><select id="fund" name="fund" required defaultValue=""><option value="" disabled>{labels.selectFund}</option>{text.funds.map((value, index) => <option key={value} value={value}>{text.fundLabels[index]}</option>)}</select></div>
      <div className="field full"><label htmlFor="accountId">{text.transaction.account}</label><select id="accountId" name="accountId" required defaultValue=""><option value="" disabled>{text.transaction.selectAccount}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><small className="field-hint">{text.transaction.accountHint}</small></div>
      <div className="field full"><label htmlFor="description">{labels.description}</label><textarea id="description" name="description" maxLength={160} required /></div>
      {transactionType === "expense" && <div className="field full"><label htmlFor="paymentReference">{text.expense.reference}</label><input id="paymentReference" name="paymentReference" maxLength={80} /></div>}
    </div><div className="actions"><button className="primary" disabled={submitting}>{submitting ? labels.saving : labels.save}</button>{error && <p className="message error" role="alert">{error}</p>}</div></form>
    {preview && <div className="preview" aria-live="polite"><h2>{labels.saved}</h2><dl><dt>{transactionType === "income" ? text.income.reference : text.expense.transactionReference}</dt><dd>{preview.transactionId.slice(0, 8).toUpperCase()}</dd><dt>{labels.amount}</dt><dd>{preview.amount}</dd><dt>{labels.date}</dt><dd>{preview.transactionDate}</dd><dt>{labels.category}</dt><dd>{preview.category}</dd><dt>{labels.fund}</dt><dd>{preview.fund}</dd><dt>{text.transaction.account}</dt><dd>{preview.account}</dd><dt>{labels.description}</dt><dd>{preview.description}</dd>{transactionType === "expense" && <><dt>{text.expense.paymentReference}</dt><dd>{preview.paymentReference || text.expense.none}</dd></>}</dl></div>}
  </section>;
}
