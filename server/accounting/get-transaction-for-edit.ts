import "server-only";
import { createClient } from "@/lib/supabase/server";

function relation(value: { id: string; name: string } | { id: string; name: string }[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getTransactionForEdit(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return { ok: false as const, status: 404, error: "Transaction not found." };
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("transactions")
    .select("id, organization_id, transaction_type, transaction_date, amount, description, payment_reference, status, category:categories(id, name), fund:funds(id, name), account:accounts(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error || !row || (row.transaction_type !== "income" && row.transaction_type !== "expense") || row.status !== "posted") return { ok: false as const, status: 404, error: "Transaction not found." };

  const [accountsResult, categoriesResult, fundsResult] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("organization_id", row.organization_id).eq("active", true).order("name"),
    supabase.from("categories").select("id, name").eq("organization_id", row.organization_id).eq("transaction_type", row.transaction_type).eq("active", true).order("name"),
    supabase.from("funds").select("id, name").eq("organization_id", row.organization_id).eq("active", true).order("name"),
  ]);
  if (accountsResult.error || categoriesResult.error || fundsResult.error) return { ok: false as const, status: 500, error: "Transaction options could not be loaded." };

  const category = relation(row.category);
  const fund = relation(row.fund);
  const account = relation(row.account);
  if (!category || !fund || !account) return { ok: false as const, status: 500, error: "Transaction details are incomplete." };

  return {
    ok: true as const,
    transaction: {
      id: row.id,
      transactionType: row.transaction_type,
      transactionDate: row.transaction_date,
      amount: Number(row.amount).toFixed(2),
      description: row.description,
      paymentReference: row.payment_reference ?? "",
      categoryId: category.id,
      fundId: fund.id,
      accountId: account.id,
    },
    options: { accounts: accountsResult.data ?? [], categories: categoriesResult.data ?? [], funds: fundsResult.data ?? [] },
  };
}
