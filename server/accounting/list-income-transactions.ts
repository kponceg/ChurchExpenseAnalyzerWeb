import "server-only";
import { createClient } from "@/lib/supabase/server";

export type IncomeActivityItem = {
  id: string;
  transactionDate: string;
  amount: number;
  description: string;
  status: string;
  category: string;
  fund: string;
  account: string;
};

function relationName(value: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown";
  return value?.name ?? "Unknown";
}

export async function listIncomeTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_date, amount, description, status, category:categories(name), fund:funds(name), account:accounts(name)")
    .eq("transaction_type", "income")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { ok: false as const, error: "Income activity could not be loaded." };

  const transactions: IncomeActivityItem[] = (data ?? []).map((row) => ({
    id: row.id,
    transactionDate: row.transaction_date,
    amount: Number(row.amount),
    description: row.description,
    status: row.status,
    category: relationName(row.category),
    fund: relationName(row.fund),
    account: relationName(row.account),
  }));

  return { ok: true as const, transactions };
}
