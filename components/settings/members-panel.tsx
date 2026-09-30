"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { OrganizationMember, OrganizationRole } from "@/server/organizations/get-organization-members";

const roles: OrganizationRole[] = ["administrator", "treasurer", "data_entry", "approver", "viewer"];

type Labels = {
  member: string;
  role: string;
  joined: string;
  currentUser: string;
  save: string;
  saving: string;
  saved: string;
  administratorOnly: string;
  finalAdministrator: string;
  addTitle: string;
  addText: string;
  email: string;
  addRole: string;
  add: string;
  adding: string;
  added: string;
  addError: string;
  errors: string;
  roleLabels: Record<OrganizationRole, string>;
};

export function MembersPanel({ locale, members, canManage, labels }: { locale: Locale; members: OrganizationMember[]; canManage: boolean; labels: Labels }) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, OrganizationRole>>(() => Object.fromEntries(members.map((member) => [member.userId, member.role])));
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { dateStyle: "medium" });
  const administratorCount = members.filter((member) => member.role === "administrator").length;

  async function saveRole(member: OrganizationMember) {
    setSavingId(member.userId);
    setMessage(null);
    const response = await fetch(`/api/members/${member.userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: selectedRoles[member.userId] }) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: locale === "es" ? labels.errors : (result.error ?? labels.errors) });
    else {
      setMessage({ type: "success", text: labels.saved });
      router.refresh();
    }
    setSavingId("");
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setAdding(true);
    setMessage(null);
    const form = new FormData(formElement);
    const response = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: locale === "es" ? labels.addError : (result.error ?? labels.addError) });
    else {
      setMessage({ type: "success", text: labels.added });
      formElement.reset();
      router.refresh();
    }
    setAdding(false);
  }

  return <>
    {canManage && <section className="add-member-panel"><div><h2>{labels.addTitle}</h2><p>{labels.addText}</p></div><form className="add-member-form" onSubmit={addMember}><div className="field"><label htmlFor="member-email">{labels.email}</label><input id="member-email" name="email" type="email" autoComplete="email" required /></div><div className="field"><label htmlFor="member-role">{labels.addRole}</label><select id="member-role" name="role" defaultValue="viewer">{roles.map((role) => <option key={role} value={role}>{labels.roleLabels[role]}</option>)}</select></div><button className="primary" disabled={adding}>{adding ? labels.adding : labels.add}</button></form></section>}
    {!canManage && <p className="settings-notice">{labels.administratorOnly}</p>}
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    <div className="members-list">
      {members.map((member) => { const isFinalAdministrator = member.role === "administrator" && administratorCount === 1; return <article className="member-card" key={member.userId}>
        <div className="member-identity"><strong>{member.email}</strong>{member.isCurrentUser && <span>{labels.currentUser}</span>}<small>{labels.joined}: {date.format(new Date(member.joinedAt))}</small></div>
        <div className="member-role"><label htmlFor={`role-${member.userId}`}>{labels.role}</label>{canManage ? <><select id={`role-${member.userId}`} value={selectedRoles[member.userId]} onChange={(event) => setSelectedRoles((current) => ({ ...current, [member.userId]: event.target.value as OrganizationRole }))}>{roles.map((role) => <option key={role} value={role} disabled={isFinalAdministrator && role !== "administrator"}>{labels.roleLabels[role]}</option>)}</select><button className="primary" type="button" disabled={savingId === member.userId || selectedRoles[member.userId] === member.role} onClick={() => saveRole(member)}>{savingId === member.userId ? labels.saving : labels.save}</button>{isFinalAdministrator && <small className="member-role-hint">{labels.finalAdministrator}</small>}</> : <strong className="role-badge">{labels.roleLabels[member.role]}</strong>}</div>
      </article>; })}
    </div>
  </>;
}
