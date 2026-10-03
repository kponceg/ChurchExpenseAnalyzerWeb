"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FinancialAccount, FinancialAccountType } from "@/server/accounting/list-financial-accounts";

const accountTypes: FinancialAccountType[] = ["checking", "savings", "cash", "petty_cash", "other"];

type Labels = {
  createTitle: string; createText: string; name: string; type: string; openingBalance: string; openingBalanceHint: string;
  create: string; creating: string; created: string; createError: string; administratorOnly: string; currentBalance: string;
  opening: string; noAccounts: string; status: string; active: string; inactive: string; typeLabels: Record<FinancialAccountType, string>;
  manage: string; saveChanges: string; savingChanges: string; updated: string; updateError: string; finalActive: string;
};

export function AccountsPanel({ accounts, canManage, labels }: { accounts: FinancialAccount[]; canManage: boolean; labels: Labels }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingId, setSavingId] = useState("");

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setCreating(true);
    setMessage(null);
    const form = new FormData(formElement);
    const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: result.error ?? labels.createError });
    else {
      setMessage({ type: "success", text: labels.created });
      formElement.reset();
      router.refresh();
    }
    setCreating(false);
  }

  async function updateAccount(event: React.FormEvent<HTMLFormElement>, account: FinancialAccount) {
    event.preventDefault();
    setSavingId(account.id);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/accounts/${account.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), active: form.get("active") === "true" }) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: result.error ?? labels.updateError });
    else {
      setMessage({ type: "success", text: labels.updated });
      router.refresh();
    }
    setSavingId("");
  }

  return <>
    {canManage ? <section className="add-member-panel"><div><h2>{labels.createTitle}</h2><p>{labels.createText}</p></div><form className="add-member-form" onSubmit={createAccount}>
      <div className="field"><label htmlFor="account-name">{labels.name}</label><input id="account-name" name="name" maxLength={80} required /></div>
      <div className="form-grid"><div className="field"><label htmlFor="account-type">{labels.type}</label><select id="account-type" name="accountType" defaultValue="checking">{accountTypes.map((type) => <option key={type} value={type}>{labels.typeLabels[type]}</option>)}</select></div>
      <div className="field"><label htmlFor="opening-balance">{labels.openingBalance}</label><input id="opening-balance" name="openingBalance" type="number" inputMode="decimal" step="0.01" defaultValue="0.00" required /><small className="field-hint">{labels.openingBalanceHint}</small></div></div>
      <button className="primary" disabled={creating}>{creating ? labels.creating : labels.create}</button>
    </form></section> : <p className="settings-notice">{labels.administratorOnly}</p>}
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    {accounts.length === 0 ? <section className="state-panel"><p>{labels.noAccounts}</p></section> : <div className="account-grid">{accounts.map((account) => <article className="financial-account-card" key={account.id}>
      <div><span className="account-type-label">{labels.typeLabels[account.accountType]}</span><h2>{account.name}</h2></div>
      <div className="account-balance"><span>{labels.currentBalance}</span><strong>{account.balance}</strong></div>
      <dl><div><dt>{labels.opening}</dt><dd>{account.openingBalance}</dd></div><div><dt>{labels.status}</dt><dd>{account.active ? labels.active : labels.inactive}</dd></div></dl>
      {canManage && <form className="account-manage-form" onSubmit={(event) => updateAccount(event, account)}><strong>{labels.manage}</strong><div className="field"><label htmlFor={`account-name-${account.id}`}>{labels.name}</label><input id={`account-name-${account.id}`} name="name" defaultValue={account.name} maxLength={80} required /></div><div className="field"><label htmlFor={`account-active-${account.id}`}>{labels.status}</label><select id={`account-active-${account.id}`} name="active" defaultValue={String(account.active)}><option value="true">{labels.active}</option><option value="false">{labels.inactive}</option></select></div><button className="secondary-button" disabled={savingId === account.id}>{savingId === account.id ? labels.savingChanges : labels.saveChanges}</button></form>}
    </article>)}</div>}
  </>;
}
