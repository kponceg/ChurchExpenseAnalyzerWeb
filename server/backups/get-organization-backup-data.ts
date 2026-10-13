import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";
import type { OrganizationRole } from "@/server/organizations/get-organization-members";

type BackupMember = {
  user_id: string;
  email: string;
  role: OrganizationRole;
  joined_at: string;
  active: boolean;
  deactivated_at: string | null;
};

type OrganizationMemberRpcRow = BackupMember & {
  organization_id: string;
  organization_name: string;
  is_current_user: boolean;
  can_manage: boolean;
};

export type OrganizationBackupData = {
  generatedAt: string;
  organization: { id: string; name: string; created_at: string };
  members: BackupMember[];
  accounts: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  funds: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  budgets: Record<string, unknown>[];
  attachmentMetadata: Record<string, unknown>[];
  reconciliations: Record<string, unknown>[];
  reconciliationItems: Record<string, unknown>[];
  auditEvents: Record<string, unknown>[];
};

export type OrganizationBackupResult =
  | { ok: true; data: OrganizationBackupData }
  | { ok: false; error: string };

export async function getOrganizationBackupData(): Promise<OrganizationBackupResult> {
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false, error: "An active organization membership is required." };
  if (!membership.canExportBackup) return { ok: false, error: "Only administrators can export a complete backup." };

  const supabase = await createClient();
  const organizationId = membership.organizationId;

  const [
    organizationResult,
    membersResult,
    accountsResult,
    categoriesResult,
    fundsResult,
    transactionsResult,
    budgetsResult,
    attachmentsResult,
    reconciliationsResult,
    reconciliationItemsResult,
    auditEventsResult,
  ] = await Promise.all([
    supabase.from("organizations").select("id, name, created_at").eq("id", organizationId).single(),
    supabase.rpc("get_organization_members"),
    supabase.from("accounts").select("id, name, account_type, opening_balance, active, created_at").eq("organization_id", organizationId).order("created_at"),
    supabase.from("categories").select("id, name, transaction_type, active, created_at").eq("organization_id", organizationId).order("transaction_type").order("name"),
    supabase.from("funds").select("id, name, active, created_at").eq("organization_id", organizationId).order("name"),
    supabase.from("transactions").select("id, account_id, category_id, fund_id, transaction_type, transaction_date, amount, description, payment_reference, status, created_by, created_at, updated_by, updated_at, void_reason, voided_by, voided_at, approved_by, approved_at, rejected_by, rejected_at, rejection_reason").eq("organization_id", organizationId).order("transaction_date").order("created_at"),
    supabase.from("budgets").select("id, category_id, month_start, amount, created_at, updated_at").eq("organization_id", organizationId).order("month_start").order("category_id"),
    supabase.from("transaction_attachments").select("id, transaction_id, original_filename, mime_type, size_bytes, uploaded_by, created_at").eq("organization_id", organizationId).order("created_at"),
    supabase.from("account_reconciliations").select("id, account_id, period_start, period_end, beginning_balance, statement_ending_balance, status, notes, created_by, created_at, updated_by, updated_at, completed_by, completed_at").eq("organization_id", organizationId).order("period_end"),
    supabase.from("reconciliation_items").select("reconciliation_id, transaction_id, cleared_by, cleared_at").eq("organization_id", organizationId).order("cleared_at"),
    supabase.from("audit_events").select("id, actor_id, action, record_type, record_id, previous_values, new_values, created_at").eq("organization_id", organizationId).order("created_at"),
  ]);

  const results = [organizationResult, membersResult, accountsResult, categoriesResult, fundsResult, transactionsResult, budgetsResult, attachmentsResult, reconciliationsResult, reconciliationItemsResult, auditEventsResult];
  if (results.some((result) => result.error)) {
    console.error("Organization backup query failed", results.find((result) => result.error)?.error);
    return { ok: false, error: "The organization backup data could not be prepared." };
  }

  if (!organizationResult.data) return { ok: false, error: "The organization could not be found." };

  const members = ((membersResult.data ?? []) as OrganizationMemberRpcRow[]).map((member) => ({
    user_id: member.user_id,
    email: member.email,
    role: member.role,
    joined_at: member.joined_at,
    active: member.active,
    deactivated_at: member.deactivated_at,
  })) as BackupMember[];

  return {
    ok: true,
    data: {
      generatedAt: new Date().toISOString(),
      organization: organizationResult.data,
      members,
      accounts: accountsResult.data ?? [],
      categories: categoriesResult.data ?? [],
      funds: fundsResult.data ?? [],
      transactions: transactionsResult.data ?? [],
      budgets: budgetsResult.data ?? [],
      attachmentMetadata: attachmentsResult.data ?? [],
      reconciliations: reconciliationsResult.data ?? [],
      reconciliationItems: reconciliationItemsResult.data ?? [],
      auditEvents: auditEventsResult.data ?? [],
    },
  };
}
