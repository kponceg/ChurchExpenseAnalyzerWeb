import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CategoryTransactionType = "income" | "expense";
export type FinancialCategory = { id: string; name: string; transactionType: CategoryTransactionType; active: boolean };

export async function listFinancialCategories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to view categories." };

  const { data: memberships, error: membershipError } = await supabase.from("organization_memberships").select("organization_id, role").eq("user_id", user.id).order("created_at").limit(1);
  const membership = memberships?.[0];
  if (membershipError || !membership) return { ok: false as const, error: "Organization access could not be loaded." };

  const { data, error } = await supabase.from("categories").select("id, name, transaction_type, active").eq("organization_id", membership.organization_id).order("transaction_type").order("name");
  if (error) return { ok: false as const, error: "Categories could not be loaded." };
  const categories: FinancialCategory[] = (data ?? []).map((category) => ({ id: category.id, name: category.name, transactionType: category.transaction_type as CategoryTransactionType, active: category.active }));
  return { ok: true as const, categories, canManage: membership.role === "administrator" };
}
