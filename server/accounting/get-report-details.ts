import "server-only";
import { createClient } from "@/lib/supabase/server";

type TransactionType = "income" | "expense";

function decimalToCents(value: string | number) {
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole || "0") * 100n + BigInt(`${fraction}00`.slice(0, 2));
}

function formatCents(cents: bigint) {
  const dollars = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const remainder = (cents % 100n).toString().padStart(2, "0");
  return `$${dollars}.${remainder}`;
}

function relationName(value: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown";
  return value?.name ?? "Unknown";
}

export async function getReportDetails(monthKey: string, transactionType: TransactionType) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) return { ok: false as const, error: "The reporting month is invalid." };
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const endDate = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_date, amount, description, payment_reference, category:categories(name), fund:funds(name), account:accounts(name)")
    .eq("status", "posted")
    .eq("transaction_type", transactionType)
    .gte("transaction_date", `${monthKey}-01`)
    .lt("transaction_date", endDate)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { ok: false as const, error: "The report details could not be loaded." };

  const grouped = new Map<string, { total: bigint; transactions: Array<{ id: string; transactionDate: string; amount: string; description: string; paymentReference: string | null; fund: string; account: string }> }>();
  let total = 0n;
  for (const row of data ?? []) {
    const category = relationName(row.category);
    const amount = decimalToCents(row.amount);
    const group = grouped.get(category) ?? { total: 0n, transactions: [] };
    group.total += amount;
    group.transactions.push({ id: row.id, transactionDate: row.transaction_date, amount: formatCents(amount), description: row.description, paymentReference: row.payment_reference, fund: relationName(row.fund), account: relationName(row.account) });
    grouped.set(category, group);
    total += amount;
  }

  const categories = [...grouped.entries()].map(([category, group]) => ({ category, total: formatCents(group.total), transactions: group.transactions })).sort((a, b) => a.category.localeCompare(b.category));
  return { ok: true as const, details: { transactionType, total: formatCents(total), transactionCount: data?.length ?? 0, categories } };
}
