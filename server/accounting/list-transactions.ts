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
  attachments: Array<{ id: string; filename: string }>;
};

function relationName(value: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown";
  return value?.name ?? "Unknown";
}

export function normalizeTransactionSearch(value: string | undefined) {
  return (value ?? "")
    .replace(/[,().\\%_*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export type TransactionActivityFilters = {
  search?: string;
  type?: "income" | "expense";
  status?: "posted" | "reversed";
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  fundId?: string;
};

function normalizeDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? undefined : value;
}

function normalizeId(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
}

export function normalizeTransactionActivityFilters(filters: { search?: string; type?: string; status?: string; startDate?: string; endDate?: string; accountId?: string; categoryId?: string; fundId?: string }) {
  return {
    search: normalizeTransactionSearch(filters.search),
    type: filters.type === "income" || filters.type === "expense" ? filters.type : undefined,
    status: filters.status === "posted" || filters.status === "reversed" ? filters.status : undefined,
    startDate: normalizeDate(filters.startDate),
    endDate: normalizeDate(filters.endDate),
    accountId: normalizeId(filters.accountId),
    categoryId: normalizeId(filters.categoryId),
    fundId: normalizeId(filters.fundId),
  } satisfies TransactionActivityFilters;
}

export async function listTransactions(filters: TransactionActivityFilters = {}) {
  const supabase = await createClient();
  const normalizedFilters = normalizeTransactionActivityFilters(filters);
  let query = supabase
    .from("transactions")
    .select("id, transaction_type, transaction_date, amount, description, payment_reference, status, void_reason, voided_at, category:categories(name), fund:funds(name), account:accounts(name), attachments:transaction_attachments(id, original_filename)")
    .in("status", normalizedFilters.status ? [normalizedFilters.status] : ["posted", "reversed"])
    .in("transaction_type", normalizedFilters.type ? [normalizedFilters.type] : ["income", "expense"]);

  if (normalizedFilters.search) {
    query = query.or(`description.ilike.%${normalizedFilters.search}%,payment_reference.ilike.%${normalizedFilters.search}%`);
  }
  if (normalizedFilters.startDate) query = query.gte("transaction_date", normalizedFilters.startDate);
  if (normalizedFilters.endDate) query = query.lte("transaction_date", normalizedFilters.endDate);
  if (normalizedFilters.accountId) query = query.eq("account_id", normalizedFilters.accountId);
  if (normalizedFilters.categoryId) query = query.eq("category_id", normalizedFilters.categoryId);
  if (normalizedFilters.fundId) query = query.eq("fund_id", normalizedFilters.fundId);

  const [transactionResult, accountResult, categoryResult, fundResult] = await Promise.all([
    query.order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(100),
    supabase.from("accounts").select("id, name").order("name"),
    supabase.from("categories").select("id, name, transaction_type").order("transaction_type").order("name"),
    supabase.from("funds").select("id, name").order("name"),
  ]);

  if (transactionResult.error || accountResult.error || categoryResult.error || fundResult.error) return { ok: false as const, error: "Transaction activity could not be loaded." };

  const transactions: TransactionActivityItem[] = (transactionResult.data ?? []).map((row) => ({
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
    attachments: (row.attachments ?? []).map((attachment) => ({ id: attachment.id, filename: attachment.original_filename })),
  }));

  return { ok: true as const, transactions, accounts: accountResult.data ?? [], categories: categoryResult.data ?? [], funds: fundResult.data ?? [] };
}
