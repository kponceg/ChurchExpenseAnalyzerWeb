"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFundLabel, type Locale } from "@/lib/i18n";
import type { FinancialFund } from "@/server/accounting/list-financial-funds";

type Labels = { createTitle: string; createText: string; name: string; create: string; creating: string; created: string; createError: string; administratorOnly: string; status: string; active: string; inactive: string; manage: string; saveChanges: string; savingChanges: string; updated: string; updateError: string; noFunds: string };

export function FundsPanel({ locale, funds, canManage, labels }: { locale: Locale; funds: FinancialFund[]; canManage: boolean; labels: Labels }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function createFund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; setCreating(true); setMessage(null);
    const response = await fetch("/api/funds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(formElement).entries())) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: result.error ?? labels.createError });
    else { setMessage({ type: "success", text: labels.created }); formElement.reset(); router.refresh(); }
    setCreating(false);
  }

  async function updateFund(event: React.FormEvent<HTMLFormElement>, fund: FinancialFund) {
    event.preventDefault(); setSavingId(fund.id); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/funds/${fund.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), active: form.get("active") === "true" }) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: result.error ?? labels.updateError });
    else { setMessage({ type: "success", text: labels.updated }); router.refresh(); }
    setSavingId("");
  }

  return <>{canManage ? <section className="add-member-panel"><div><h2>{labels.createTitle}</h2><p>{labels.createText}</p></div><form className="add-member-form" onSubmit={createFund}><div className="field"><label htmlFor="fund-name">{labels.name}</label><input id="fund-name" name="name" maxLength={80} required /></div><button className="primary" disabled={creating}>{creating ? labels.creating : labels.create}</button></form></section> : <p className="settings-notice">{labels.administratorOnly}</p>}{message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}{funds.length === 0 ? <section className="state-panel"><p>{labels.noFunds}</p></section> : <div className="category-grid">{funds.map((fund) => <article className="category-card" key={fund.id}><div><h2>{getFundLabel(locale, fund.name)}</h2><small>{fund.active ? labels.active : labels.inactive}</small></div>{canManage && <form className="category-manage-form" onSubmit={(event) => updateFund(event, fund)}><strong>{labels.manage}</strong><div className="field"><label htmlFor={`fund-name-${fund.id}`}>{labels.name}</label><input id={`fund-name-${fund.id}`} name="name" defaultValue={fund.name} maxLength={80} required /></div><div className="field"><label htmlFor={`fund-active-${fund.id}`}>{labels.status}</label><select id={`fund-active-${fund.id}`} name="active" defaultValue={String(fund.active)}><option value="true">{labels.active}</option><option value="false">{labels.inactive}</option></select></div><button className="secondary-button" disabled={savingId === fund.id}>{savingId === fund.id ? labels.savingChanges : labels.saveChanges}</button></form>}</article>)}</div>}</>;
}
