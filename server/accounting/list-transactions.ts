import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TransactionActivityItem = {
  id: string;
  transactionType: "income" | "expense";
  transactionDate: string;
  amount: number;
  description: string;
  paymentReference: string | null;
  category: string;
  fund: string;
  account: string;
  status: "posted" | "reversed";
  voidReason: string | null;
  voidedAt: string | null;
};

function relationName(value: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown";
  return value?.name ?? "Unknown";
}

export async function listTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_type, transaction_date, amount, description, payment_reference, status, void_reason, voided_at, category:categories(name), fund:funds(name), account:accounts(name)")
    .in("status", ["posted", "reversed"])
    .in("transaction_type", ["income", "expense"])
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { ok: false as const, error: "Transaction activity could not be loaded." };

  const transactions: TransactionActivityItem[] = (data ?? []).map((row) => ({
    id: row.id,
    transactionType: row.transaction_type as "income" | "expense",
    transactionDate: row.transaction_date,
    amount: Number(row.amount),
    description: row.description,
    paymentReference: row.payment_reference,
    category: relationName(row.category),
    fund: relationName(row.fund),
    account: relationName(row.account),
    status: row.status as "posted" | "reversed",
    voidReason: row.void_reason,
    voidedAt: row.voided_at,
  }));

  return { ok: true as const, transactions };
}
