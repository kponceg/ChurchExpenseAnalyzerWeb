import "server-only";
import { getAuditEventDescription } from "@/lib/audit-event-descriptions";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

type AuditSnapshot = Record<string, unknown> | null;

type AuditRow = {
  id: number;
  actor_id: string | null;
  action: string;
  record_type: string;
  record_id: string;
  previous_values: AuditSnapshot;
  new_values: AuditSnapshot;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  action: string;
  description: string;
  actorEmail: string | null;
  recordType: string;
  recordId: string;
  subject: string | null;
  createdAt: string;
};

function getSubject(row: AuditRow) {
  const snapshot = row.new_values ?? row.previous_values;
  if (!snapshot) return null;

  if (row.record_type === "transactions") {
    return typeof snapshot.description === "string" ? snapshot.description : null;
  }

  if (row.record_type === "account_reconciliations") {
    const periodEnd = snapshot.period_end;
    return typeof periodEnd === "string" ? periodEnd : null;
  }

  return null;
}

export async function listAuditEvents(locale: Locale) {
  const membership = await getCurrentMembership();
  if (!membership || !membership.canViewAuditLog) {
    return { ok: false as const, error: "Audit log access is restricted." };
  }

  const supabase = await createClient();
  const [eventsResult, membersResult] = await Promise.all([
    supabase
      .from("audit_events")
      .select("id, actor_id, action, record_type, record_id, previous_values, new_values, created_at")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("get_organization_members"),
  ]);

  if (eventsResult.error) {
    return { ok: false as const, error: "Audit events could not be loaded." };
  }

  const memberEmails = new Map<string, string>();
  if (!membersResult.error && membersResult.data) {
    for (const member of membersResult.data as Array<{ user_id: string; email: string }>) {
      memberEmails.set(member.user_id, member.email);
    }
  }

  const events = ((eventsResult.data ?? []) as AuditRow[]).map((row) => ({
    id: row.id,
    action: row.action,
    description: getAuditEventDescription(locale, row.action),
    actorEmail: row.actor_id ? (memberEmails.get(row.actor_id) ?? null) : null,
    recordType: row.record_type,
    recordId: row.record_id,
    subject: getSubject(row),
    createdAt: row.created_at,
  } satisfies AuditEvent));

  return { ok: true as const, events };
}
