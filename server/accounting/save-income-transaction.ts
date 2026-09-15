import "server-only";
import { createClient } from "@/lib/supabase/server";

type IncomeTransaction = {
  amount: number;
  transactionDate: string;
  category: string;
  fund: string;
  description: string;
  idempotencyKey: string;
};

export async function saveIncomeTransaction(input: IncomeTransaction) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before saving a transaction." };

  const { data: organizationId, error: organizationError } = await supabase.rpc("ensure_initial_organization");
  if (organizationError || !organizationId) return { ok: false as const, status: 503, error: "The financial database has not been configured yet." };

  const [accountResult, categoryResult, fundResult] = await Promise.all([
    supabase.from("accounts").select("id").eq("organization_id", organizationId).eq("name", "Checking").eq("active", true).single(),
    supabase.from("categories").select("id").eq("organization_id", organizationId).eq("transaction_type", "income").eq("name", input.category).eq("active", true).single(),
    supabase.from("funds").select("id").eq("organization_id", organizationId).eq("name", input.fund).eq("active", true).single(),
  ]);

  if (!accountResult.data || !categoryResult.data || !fundResult.data) {
    return { ok: false as const, status: 400, error: "The selected account, category, or fund is unavailable." };
  }

  const record = {
    organization_id: organizationId,
    account_id: accountResult.data.id,
    category_id: categoryResult.data.id,
    fund_id: fundResult.data.id,
    transaction_type: "income",
    transaction_date: input.transactionDate,
    amount: input.amount,
    description: input.description,
    status: "posted",
    idempotency_key: input.idempotencyKey,
    created_by: user.id,
  };

  const { data, error } = await supabase.from("transactions").insert(record).select("id, created_at").single();
  if (!error && data) return { ok: true as const, transactionId: data.id, createdAt: data.created_at };

  if (error?.code === "23505") {
    const existing = await supabase.from("transactions").select("id, created_at").eq("organization_id", organizationId).eq("idempotency_key", input.idempotencyKey).single();
    if (existing.data) return { ok: true as const, transactionId: existing.data.id, createdAt: existing.data.created_at };
  }

  return { ok: false as const, status: 500, error: "The transaction could not be saved." };
}
