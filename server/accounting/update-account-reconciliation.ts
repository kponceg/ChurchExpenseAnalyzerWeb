import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function setReconciliationTransactionCleared(reconciliationId: string, transactionId: string, input: unknown) {
  const parsed = z.object({ cleared: z.boolean() }).safeParse(input);
  if (!uuid.safeParse(reconciliationId).success || !uuid.safeParse(transactionId).success || !parsed.success) return { ok: false as const, status: 400, error: "Invalid reconciliation transaction." };
  const supabase = await authenticatedClient();
  if (!supabase) return { ok: false as const, status: 401, error: "Sign in before updating a reconciliation." };
  const { data, error } = await supabase.rpc("set_reconciliation_transaction_cleared", { target_reconciliation_id: reconciliationId, target_transaction_id: transactionId, is_cleared: parsed.data.cleared });
  if (error || data === null) return { ok: false as const, status: 400, error: error?.message ?? "The transaction could not be updated." };
  return { ok: true as const, cleared: data as boolean };
}

export async function completeAccountReconciliation(reconciliationId: string) {
  if (!uuid.safeParse(reconciliationId).success) return { ok: false as const, status: 404, error: "Reconciliation not found." };
  const supabase = await authenticatedClient();
  if (!supabase) return { ok: false as const, status: 401, error: "Sign in before completing a reconciliation." };
  const { data, error } = await supabase.rpc("complete_account_reconciliation", { target_reconciliation_id: reconciliationId });
  if (error || data === null) return { ok: false as const, status: 400, error: error?.message ?? "The reconciliation could not be completed." };
  return { ok: true as const, difference: Number(data) };
}

export async function cancelAccountReconciliation(reconciliationId: string) {
  if (!uuid.safeParse(reconciliationId).success) return { ok: false as const, status: 404, error: "Reconciliation not found." };
  const supabase = await authenticatedClient();
  if (!supabase) return { ok: false as const, status: 401, error: "Sign in before cancelling a reconciliation." };
  const { data, error } = await supabase.rpc("cancel_account_reconciliation", { target_reconciliation_id: reconciliationId });
  if (error || !data) return { ok: false as const, status: 400, error: error?.message ?? "The reconciliation could not be cancelled." };
  return { ok: true as const, reconciliationId: data as string };
}
