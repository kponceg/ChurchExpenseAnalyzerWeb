"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryLabel, type Locale } from "@/lib/i18n";
import type { CategoryTransactionType, FinancialCategory } from "@/server/accounting/list-financial-categories";

type Labels = {
  createTitle: string; createText: string; name: string; type: string; income: string; expense: string; create: string; creating: string;
  created: string; createError: string; administratorOnly: string; status: string; active: string; inactive: string; manage: string;
  saveChanges: string; savingChanges: string; updated: string; updateError: string; noCategories: string;
};

export function CategoriesPanel({ locale, categories, canManage, labels }: { locale: Locale; categories: FinancialCategory[]; canManage: boolean; labels: Labels }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setCreating(true); setMessage(null);
    const form = new FormData(formElement);
    const response = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: result.error ?? labels.createError });
    else { setMessage({ type: "success", text: labels.created }); formElement.reset(); router.refresh(); }
    setCreating(false);
  }

  async function updateCategory(event: React.FormEvent<HTMLFormElement>, category: FinancialCategory) {
    event.preventDefault();
    setSavingId(category.id); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/categories/${category.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), active: form.get("active") === "true" }) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: result.error ?? labels.updateError });
    else { setMessage({ type: "success", text: labels.updated }); router.refresh(); }
    setSavingId("");
  }

  const typeLabel = (type: CategoryTransactionType) => type === "income" ? labels.income : labels.expense;
  return <>
    {canManage ? <section className="add-member-panel"><div><h2>{labels.createTitle}</h2><p>{labels.createText}</p></div><form className="add-member-form" onSubmit={createCategory}><div className="field"><label htmlFor="category-name">{labels.name}</label><input id="category-name" name="name" maxLength={80} required /></div><div className="field"><label htmlFor="category-type">{labels.type}</label><select id="category-type" name="transactionType" defaultValue="expense"><option value="income">{labels.income}</option><option value="expense">{labels.expense}</option></select></div><button className="primary" disabled={creating}>{creating ? labels.creating : labels.create}</button></form></section> : <p className="settings-notice">{labels.administratorOnly}</p>}
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    {categories.length === 0 ? <section className="state-panel"><p>{labels.noCategories}</p></section> : <div className="category-grid">{categories.map((category) => <article className="category-card" key={category.id}><div><span className={`transaction-type ${category.transactionType}`}>{typeLabel(category.transactionType)}</span><h2>{getCategoryLabel(locale, category.name)}</h2><small>{category.active ? labels.active : labels.inactive}</small></div>{canManage && <form className="category-manage-form" onSubmit={(event) => updateCategory(event, category)}><strong>{labels.manage}</strong><div className="field"><label htmlFor={`category-name-${category.id}`}>{labels.name}</label><input id={`category-name-${category.id}`} name="name" defaultValue={category.name} maxLength={80} required /></div><div className="field"><label htmlFor={`category-active-${category.id}`}>{labels.status}</label><select id={`category-active-${category.id}`} name="active" defaultValue={String(category.active)}><option value="true">{labels.active}</option><option value="false">{labels.inactive}</option></select></div><button className="secondary-button" disabled={savingId === category.id}>{savingId === category.id ? labels.savingChanges : labels.saveChanges}</button></form>}</article>)}</div>}
  </>;
}
