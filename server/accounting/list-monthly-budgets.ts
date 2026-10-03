import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MonthlyBudget = { id: string; categoryId: string; categoryName: string; month: string; amount: number; actual: number; remaining: number };

export async function listMonthlyBudgets(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to view budgets." };
  const { data: memberships, error: membershipError } = await supabase.from("organization_memberships").select("organization_id, role").eq("user_id", user.id).order("created_at").limit(1);
  const membership = memberships?.[0];
  if (membershipError || !membership) return { ok: false as const, error: "Organization access could not be loaded." };
  const start = `${year}-01-01`; const end = `${year + 1}-01-01`;
  const [budgetResult, categoryResult, transactionResult] = await Promise.all([
    supabase.from("budgets").select("id, category_id, month_start, amount, category:categories(name)").eq("organization_id", membership.organization_id).gte("month_start", start).lt("month_start", end).order("month_start").order("category_id"),
    supabase.from("categories").select("id, name, active").eq("organization_id", membership.organization_id).eq("transaction_type", "expense").order("name"),
    supabase.from("transactions").select("category_id, transaction_date, amount").eq("organization_id", membership.organization_id).eq("transaction_type", "expense").eq("status", "posted").gte("transaction_date", start).lt("transaction_date", end),
  ]);
  if (budgetResult.error || categoryResult.error || transactionResult.error) return { ok: false as const, error: "Budgets could not be loaded." };
  const actuals = new Map<string, number>();
  for (const transaction of transactionResult.data ?? []) { const key = `${transaction.category_id}:${transaction.transaction_date.slice(0, 7)}`; actuals.set(key, (actuals.get(key) ?? 0) + Number(transaction.amount)); }
  const budgets: MonthlyBudget[] = (budgetResult.data ?? []).map((budget) => {
    const category = Array.isArray(budget.category) ? budget.category[0] : budget.category;
    const month = budget.month_start.slice(0, 7); const amount = Number(budget.amount); const actual = actuals.get(`${budget.category_id}:${month}`) ?? 0;
    return { id: budget.id, categoryId: budget.category_id, categoryName: category?.name ?? "Category", month, amount, actual, remaining: amount - actual };
  });
  return { ok: true as const, budgets, categories: categoryResult.data ?? [], canManage: membership.role === "administrator" };
}
