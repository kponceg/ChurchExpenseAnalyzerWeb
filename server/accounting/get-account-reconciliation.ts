import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

export type ReconciliationTransaction = {
  id: string;
  transactionType: "income" | "expense";
  transactionDate: string;
  amount: string;
  description: string;
  paymentReference: string | null;
  cleared: boolean;
};

export async function getAccountReconciliation(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, status: 404, error: "Reconciliation not found." };
  const supabase = await createClient();
  const membership = await getCurrentMembership();
  if (!membership) return { ok: false as const, status: 403, error: "Organization access could not be loaded." };

  const { data: reconciliation } = await supabase
    .from("account_reconciliations")
    .select("id, organization_id, account_id, period_start, period_end, beginning_balance, statement_ending_balance, status, notes, completed_at, account:accounts(name)")
    .eq("id", id)
    .eq("organization_id", membership.organizationId)
    .maybeSingle();
  if (!reconciliation) return { ok: false as const, status: 404, error: "Reconciliation not found." };

  const [transactionResult, itemResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, transaction_type, transaction_date, amount, description, payment_reference")
      .eq("organization_id", membership.organizationId)
      .eq("account_id", reconciliation.account_id)
      .eq("status", "posted")
      .in("transaction_type", ["income", "expense"])
      .lte("transaction_date", reconciliation.period_end)
      .order("transaction_date")
      .order("created_at"),
    supabase
      .from("reconciliation_items")
      .select("reconciliation_id, transaction_id")
      .eq("organization_id", membership.organizationId),
  ]);
  if (transactionResult.error || itemResult.error) {
    return { ok: false as const, status: 500, error: "Reconciliation transactions could not be loaded." };
  }

  const selected = new Set((itemResult.data ?? []).filter((item) => item.reconciliation_id === id).map((item) => item.transaction_id));
  const usedElsewhere = new Set((itemResult.data ?? []).filter((item) => item.reconciliation_id !== id).map((item) => item.transaction_id));
  const transactions: ReconciliationTransaction[] = (transactionResult.data ?? [])
    .filter((transaction) => reconciliation.status === "completed" ? selected.has(transaction.id) : !usedElsewhere.has(transaction.id))
    .map((transaction) => ({
      id: transaction.id,
      transactionType: transaction.transaction_type as "income" | "expense",
      transactionDate: transaction.transaction_date,
      amount: Number(transaction.amount).toFixed(2),
      description: transaction.description,
      paymentReference: transaction.payment_reference,
      cleared: selected.has(transaction.id),
    }));
  const account = Array.isArray(reconciliation.account) ? reconciliation.account[0] : reconciliation.account;

  return {
    ok: true as const,
    reconciliation: {
      id: reconciliation.id,
      accountName: account?.name ?? "Financial account",
      periodStart: reconciliation.period_start,
      periodEnd: reconciliation.period_end,
      beginningBalance: Number(reconciliation.beginning_balance).toFixed(2),
      statementEndingBalance: Number(reconciliation.statement_ending_balance).toFixed(2),
      status: reconciliation.status as "draft" | "completed",
      notes: reconciliation.notes,
      completedAt: reconciliation.completed_at,
    },
    transactions,
    canReconcile: membership.canReconcile,
  };
}
