import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

export type AccountReconciliation = {
  id: string;
  accountId: string;
  accountName: string;
  periodStart: string;
  periodEnd: string;
  beginningBalance: number;
  statementEndingBalance: number;
  status: "draft" | "completed";
  notes: string | null;
  completedAt: string | null;
};

export async function listAccountReconciliations() {
  const supabase = await createClient();
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false as const, error: "Organization access could not be loaded." };

  const [accountResult, reconciliationResult] = await Promise.all([
    supabase.from("accounts").select("id, name, active").eq("organization_id", membership.organizationId).order("name"),
    supabase
      .from("account_reconciliations")
      .select("id, account_id, period_start, period_end, beginning_balance, statement_ending_balance, status, notes, completed_at, account:accounts(name)")
      .eq("organization_id", membership.organizationId)
      .order("period_end", { ascending: false }),
  ]);

  if (accountResult.error || reconciliationResult.error) {
    return { ok: false as const, error: "Account reconciliations could not be loaded." };
  }

  const reconciliations: AccountReconciliation[] = (reconciliationResult.data ?? []).map((row) => {
    const account = Array.isArray(row.account) ? row.account[0] : row.account;
    return {
      id: row.id,
      accountId: row.account_id,
      accountName: account?.name ?? "Financial account",
      periodStart: row.period_start,
      periodEnd: row.period_end,
      beginningBalance: Number(row.beginning_balance),
      statementEndingBalance: Number(row.statement_ending_balance),
      status: row.status as "draft" | "completed",
      notes: row.notes,
      completedAt: row.completed_at,
    };
  });

  return {
    ok: true as const,
    accounts: accountResult.data ?? [],
    reconciliations,
    canReconcile: membership.canReconcile,
  };
}
