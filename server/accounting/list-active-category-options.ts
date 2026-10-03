import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CategoryTransactionType } from "@/server/accounting/list-financial-categories";

export async function listActiveCategoryOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name, transaction_type").eq("active", true).order("name");
  if (error) return { ok: false as const, error: "Transaction categories could not be loaded." };
  return { ok: true as const, categories: (data ?? []).map((category) => ({ id: category.id, name: category.name, transactionType: category.transaction_type as CategoryTransactionType })) };
}
