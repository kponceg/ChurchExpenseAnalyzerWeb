import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TransactionReportType = "all" | "income" | "expense";

function decimalToCents(value: string | number) {
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole || "0") * 100n + BigInt(`${fraction}00`.slice(0, 2));
}

function formatCents(cents: bigint) {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const dollars = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const remainder = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "−" : ""}$${dollars}.${remainder}`;
}

function relationName(value: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown";
  return value?.name ?? "Unknown";
}

export async function getTransactionReport(yearValue: string | undefined, monthKey: string | undefined, reportType: TransactionReportType) {
  if (!yearValue || !/^\d{4}$/.test(yearValue) || Number(yearValue) < 2000 || Number(yearValue) > 2100) return { ok: false as const, error: "The reporting year is invalid." };
  if (monthKey && !new RegExp(`^${yearValue}-(0[1-9]|1[0-2])$`).test(monthKey)) return { ok: false as const, error: "The reporting month is invalid." };

  const year = Number(yearValue);
  const startDate = monthKey ? `${monthKey}-01` : `${year}-01-01`;
  const endDate = monthKey ? nextMonthStart(monthKey) : `${year + 1}-01-01`;
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("id, transaction_type, transaction_date, amount, description, payment_reference, category:categories(name), fund:funds(name), account:accounts(name)")
    .eq("status", "posted")
    .in("transaction_type", ["income", "expense"])
    .gte("transaction_date", startDate)
    .lt("transaction_date", endDate)
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (reportType !== "all") query = query.eq("transaction_type", reportType);
  const { data, error } = await query;
  if (error) return { ok: false as const, error: "The detailed transaction report could not be loaded." };

  type Transaction = { id: string; transactionType: "income" | "expense"; transactionDate: string; amount: string; description: string; paymentReference: string | null; fund: string; account: string };
  type CategoryGroup = { income: bigint; expenses: bigint; transactions: Transaction[] };
  type MonthGroup = { income: bigint; expenses: bigint; categories: Map<string, CategoryGroup> };
  const months = new Map<string, MonthGroup>();
  let totalIncome = 0n;
  let totalExpenses = 0n;

  for (const row of data ?? []) {
    if (row.transaction_type !== "income" && row.transaction_type !== "expense") continue;
    const month = row.transaction_date.slice(0, 7);
    const category = relationName(row.category);
    const amount = decimalToCents(row.amount);
    const monthGroup = months.get(month) ?? { income: 0n, expenses: 0n, categories: new Map<string, CategoryGroup>() };
    const categoryGroup = monthGroup.categories.get(category) ?? { income: 0n, expenses: 0n, transactions: [] };
    if (row.transaction_type === "income") {
      monthGroup.income += amount;
      categoryGroup.income += amount;
      totalIncome += amount;
    } else {
      monthGroup.expenses += amount;
      categoryGroup.expenses += amount;
      totalExpenses += amount;
    }
    categoryGroup.transactions.push({ id: row.id, transactionType: row.transaction_type, transactionDate: row.transaction_date, amount: formatCents(amount), description: row.description, paymentReference: row.payment_reference, fund: relationName(row.fund), account: relationName(row.account) });
    monthGroup.categories.set(category, categoryGroup);
    months.set(month, monthGroup);
  }

  return {
    ok: true as const,
    report: {
      year,
      monthKey: monthKey ?? null,
      reportType,
      transactionCount: data?.length ?? 0,
      totalIncome: formatCents(totalIncome),
      totalExpenses: formatCents(totalExpenses),
      net: formatCents(totalIncome - totalExpenses),
      months: [...months.entries()].map(([key, month]) => ({
        key,
        income: formatCents(month.income),
        expenses: formatCents(month.expenses),
        net: formatCents(month.income - month.expenses),
        categories: [...month.categories.entries()].map(([category, group]) => ({ category, income: formatCents(group.income), expenses: formatCents(group.expenses), transactions: group.transactions })).sort((a, b) => a.category.localeCompare(b.category)),
      })),
    },
  };
}

function nextMonthStart(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  return `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
