"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryLabel, type Locale } from "@/lib/i18n";
import type { MonthlyBudget } from "@/server/accounting/list-monthly-budgets";

type Labels = { createTitle: string; createText: string; category: string; month: string; amount: string; save: string; saving: string; saved: string; error: string; administratorOnly: string; noBudgets: string; budgeted: string; actual: string; remaining: string; over: string; viewYear: string };
type Category = { id: string; name: string; active: boolean };

export function BudgetsPanel({ locale, year, budgets, categories, canManage, labels }: { locale: Locale; year: number; budgets: MonthlyBudget[]; categories: Category[]; canManage: boolean; labels: Labels }) {
  const router = useRouter(); const [saving, setSaving] = useState(false); const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const currency = new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", { style: "currency", currency: "USD" });
  const monthLabel = (month: string) => new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(null); const response = await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) }); const result = await response.json(); setMessage(response.ok ? { type: "success", text: labels.saved } : { type: "error", text: result.error ?? labels.error }); if (response.ok) router.refresh(); setSaving(false); }
  return <>
    <form className="report-filters" method="get"><label htmlFor="budget-year">{labels.viewYear}</label><select id="budget-year" name="year" defaultValue={String(year)}>{Array.from({ length: 7 }, (_, index) => year - 3 + index).map((value) => <option key={value} value={value}>{value}</option>)}</select><button className="secondary-button">{labels.viewYear}</button></form>
    {canManage ? <section className="add-member-panel"><div><h2>{labels.createTitle}</h2><p>{labels.createText}</p></div><form className="add-member-form" onSubmit={save}><div className="field"><label htmlFor="budget-category">{labels.category}</label><select id="budget-category" name="categoryId" required defaultValue=""><option value="" disabled>{labels.category}</option>{categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(locale, category.name)}</option>)}</select></div><div className="field"><label htmlFor="budget-month">{labels.month}</label><input id="budget-month" name="month" type="month" defaultValue={`${year}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`} required /></div><div className="field"><label htmlFor="budget-amount">{labels.amount}</label><input id="budget-amount" name="amount" inputMode="decimal" placeholder="0.00" required /></div><button className="primary" disabled={saving}>{saving ? labels.saving : labels.save}</button></form></section> : <p className="settings-notice">{labels.administratorOnly}</p>}
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    {budgets.length === 0 ? <section className="state-panel"><p>{labels.noBudgets}</p></section> : <div className="budget-grid">{budgets.map((budget) => <article className="budget-card" key={budget.id}><div><small>{monthLabel(budget.month)}</small><h2>{getCategoryLabel(locale, budget.categoryName)}</h2></div><dl><div><dt>{labels.budgeted}</dt><dd>{currency.format(budget.amount)}</dd></div><div><dt>{labels.actual}</dt><dd>{currency.format(budget.actual)}</dd></div><div><dt>{budget.remaining < 0 ? labels.over : labels.remaining}</dt><dd className={budget.remaining < 0 ? "negative" : "positive"}>{currency.format(Math.abs(budget.remaining))}</dd></div></dl></article>)}</div>}
  </>;
}
