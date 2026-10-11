import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const money = z.string().trim().regex(/^-?\d{1,12}(\.\d{1,2})?$/);
const date = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/);
const schema = z.object({
  accountId: z.string().uuid(),
  periodStart: date,
  periodEnd: date,
  statementEndingBalance: money,
  notes: z.string().trim().max(500).optional().default(""),
}).refine((value) => value.periodStart <= value.periodEnd, { message: "Invalid period" });

export async function startAccountReconciliation(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, status: 400, error: "Enter a valid account, statement period, and ending balance." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before starting a reconciliation." };

  const { data, error } = await supabase.rpc("start_account_reconciliation", {
    target_account_id: parsed.data.accountId,
    statement_period_start: parsed.data.periodStart,
    statement_period_end: parsed.data.periodEnd,
    statement_balance: parsed.data.statementEndingBalance,
    reconciliation_notes: parsed.data.notes || null,
  });

  if (error || !data) {
    return { ok: false as const, status: 400, error: error?.message ?? "The reconciliation could not be started." };
  }
  return { ok: true as const, reconciliationId: data as string };
}
