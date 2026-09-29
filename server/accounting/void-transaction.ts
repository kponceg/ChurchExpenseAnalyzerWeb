import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const voidTransactionSchema = z.object({ reason: z.string().trim().min(3).max(160) });

export async function voidTransaction(id: string, input: unknown) {
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, status: 404, error: "Transaction not found." };
  const parsed = voidTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a reason between 3 and 160 characters." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before voiding a transaction." };
  const { data, error } = await supabase.rpc("void_transaction", { target_transaction_id: id, reason: parsed.data.reason });
  if (error || !data) return { ok: false as const, status: 403, error: "Only an administrator or treasurer can void a posted transaction." };
  return { ok: true as const, transactionId: data as string };
}
