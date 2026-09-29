import "server-only";
import { createClient } from "@/lib/supabase/server";

type TransactionUpdate = {
  transactionType: "income" | "expense";
  amount: number;
  transactionDate: string;
  categoryId: string;
  fundId: string;
  accountId: string;
  description: string;
  paymentReference: string;
};

export async function updateTransaction(id: string, input: TransactionUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before updating a transaction." };

  const { data: existing, error: existingError } = await supabase.from("transactions").select("organization_id, transaction_type, status").eq("id", id).maybeSingle();
  if (existingError || !existing || existing.status !== "posted" || existing.transaction_type !== input.transactionType) return { ok: false as const, status: 404, error: "Transaction not found." };

  const [accountResult, categoryResult, fundResult] = await Promise.all([
    supabase.from("accounts").select("id").eq("id", input.accountId).eq("organization_id", existing.organization_id).eq("active", true).maybeSingle(),
    supabase.from("categories").select("id").eq("id", input.categoryId).eq("organization_id", existing.organization_id).eq("transaction_type", input.transactionType).eq("active", true).maybeSingle(),
    supabase.from("funds").select("id").eq("id", input.fundId).eq("organization_id", existing.organization_id).eq("active", true).maybeSingle(),
  ]);
  if (!accountResult.data || !categoryResult.data || !fundResult.data) return { ok: false as const, status: 400, error: "The selected account, category, or fund is unavailable." };

  const { data, error } = await supabase.from("transactions").update({
    account_id: input.accountId,
    category_id: input.categoryId,
    fund_id: input.fundId,
    transaction_date: input.transactionDate,
    amount: input.amount,
    description: input.description,
    payment_reference: input.transactionType === "expense" ? input.paymentReference || null : null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }).eq("id", id).eq("organization_id", existing.organization_id).eq("transaction_type", input.transactionType).select("id").maybeSingle();
  if (error || !data) return { ok: false as const, status: 403, error: "You do not have permission to update this transaction." };
  return { ok: true as const, transactionId: data.id };
}
