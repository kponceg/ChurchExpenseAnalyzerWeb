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
  inviteTitle: string;
  inviteText: string;
  invite: string;
  inviting: string;
  invited: string;
  inviteError: string;
  setupLink: string;
  sendingSetupLink: string;
  setupLinkSent: string;
  setupLinkError: string;
  activeStatus: string;
  inactiveStatus: string;
  deactivate: string;
  deactivating: string;
  deactivateConfirm: string;
  deactivated: string;
  restore: string;
  restoring: string;
  restored: string;
  accessError: string;
  errors: string;
  roleLabels: Record<OrganizationRole, string>;
};

export function MembersPanel({ locale, members, canManage, labels }: { locale: Locale; members: OrganizationMember[]; canManage: boolean; labels: Labels }) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, OrganizationRole>>(() => Object.fromEntries(members.map((member) => [member.userId, member.role])));
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [sendingSetupId, setSendingSetupId] = useState("");
  const [changingAccessId, setChangingAccessId] = useState("");
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

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setInviting(true);
    setMessage(null);
    const form = new FormData(formElement);
    const response = await fetch("/api/members/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: locale === "es" ? labels.inviteError : (result.error ?? labels.inviteError) });
    else {
      setMessage({ type: "success", text: labels.invited });
      formElement.reset();
      router.refresh();
    }
    setInviting(false);
  }

  async function sendSetupLink(member: OrganizationMember) {
    setSendingSetupId(member.userId);
    setMessage(null);
    const response = await fetch(`/api/members/${member.userId}/setup-link`, { method: "POST" });
    const result = await response.json();
    setMessage(response.ok ? { type: "success", text: labels.setupLinkSent } : { type: "error", text: locale === "es" ? labels.setupLinkError : (result.error ?? labels.setupLinkError) });
    setSendingSetupId("");
  }

  async function changeAccess(member: OrganizationMember) {
    if (member.active && !window.confirm(labels.deactivateConfirm)) return;
    setChangingAccessId(member.userId); setMessage(null);
    const response = await fetch(`/api/members/${member.userId}/access`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !member.active }) });
    const result = await response.json();
    setMessage(response.ok ? { type: "success", text: member.active ? labels.deactivated : labels.restored } : { type: "error", text: locale === "es" ? labels.accessError : (result.error ?? labels.accessError) });
    if (response.ok) router.refresh(); setChangingAccessId("");
  }

  return <>
    {canManage && <section className="add-member-panel"><div><h2>{labels.inviteTitle}</h2><p>{labels.inviteText}</p></div><form className="add-member-form" onSubmit={inviteMember}><div className="field"><label htmlFor="invite-email">{labels.email}</label><input id="invite-email" name="email" type="email" autoComplete="email" required /></div><div className="field"><label htmlFor="invite-role">{labels.addRole}</label><select id="invite-role" name="role" defaultValue="viewer">{roles.map((role) => <option key={role} value={role}>{labels.roleLabels[role]}</option>)}</select></div><button className="primary" disabled={inviting}>{inviting ? labels.inviting : labels.invite}</button></form></section>}
    {canManage && <section className="add-member-panel"><div><h2>{labels.addTitle}</h2><p>{labels.addText}</p></div><form className="add-member-form" onSubmit={addMember}><div className="field"><label htmlFor="member-email">{labels.email}</label><input id="member-email" name="email" type="email" autoComplete="email" required /></div><div className="field"><label htmlFor="member-role">{labels.addRole}</label><select id="member-role" name="role" defaultValue="viewer">{roles.map((role) => <option key={role} value={role}>{labels.roleLabels[role]}</option>)}</select></div><button className="primary" disabled={adding}>{adding ? labels.adding : labels.add}</button></form></section>}
    {!canManage && <p className="settings-notice">{labels.administratorOnly}</p>}
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    <div className="members-list">
      {members.map((member) => { const isFinalAdministrator = member.active && member.role === "administrator" && administratorCount === 1; return <article className={`member-card ${member.active ? "" : "inactive-member"}`} key={member.userId}>
        <div className="member-identity"><strong>{member.email}</strong>{member.isCurrentUser && <span>{labels.currentUser}</span>}<span className={member.active ? "active-access" : "inactive-access"}>{member.active ? labels.activeStatus : labels.inactiveStatus}</span><small>{labels.joined}: {date.format(new Date(member.joinedAt))}</small>{canManage && !member.isCurrentUser && member.active && <button className="secondary-button setup-link-button" type="button" disabled={sendingSetupId === member.userId} onClick={() => sendSetupLink(member)}>{sendingSetupId === member.userId ? labels.sendingSetupLink : labels.setupLink}</button>}{canManage && !member.isCurrentUser && <button className={member.active ? "danger-button setup-link-button" : "secondary-button setup-link-button"} type="button" disabled={changingAccessId === member.userId} onClick={() => changeAccess(member)}>{changingAccessId === member.userId ? (member.active ? labels.deactivating : labels.restoring) : (member.active ? labels.deactivate : labels.restore)}</button>}</div>
        <div className="member-role"><label htmlFor={`role-${member.userId}`}>{labels.role}</label>{canManage ? <><select id={`role-${member.userId}`} value={selectedRoles[member.userId]} disabled={!member.active} onChange={(event) => setSelectedRoles((current) => ({ ...current, [member.userId]: event.target.value as OrganizationRole }))}>{roles.map((role) => <option key={role} value={role} disabled={isFinalAdministrator && role !== "administrator"}>{labels.roleLabels[role]}</option>)}</select><button className="primary" type="button" disabled={!member.active || savingId === member.userId || selectedRoles[member.userId] === member.role} onClick={() => saveRole(member)}>{savingId === member.userId ? labels.saving : labels.save}</button>{isFinalAdministrator && <small className="member-role-hint">{labels.finalAdministrator}</small>}</> : <strong className="role-badge">{labels.roleLabels[member.role]}</strong>}</div>
      </article>; })}
    </div>
  </>;
}
