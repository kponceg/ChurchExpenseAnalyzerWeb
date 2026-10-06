import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

function relationName(value: { name: string } | { name: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown";
  return value?.name ?? "Unknown";
}

export async function listPendingTransactions() {
  const membership = await getCurrentMembership();
  if (!membership?.canReviewTransactions) return { ok: false as const, status: 403, error: "Your role cannot review transactions." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_type, transaction_date, amount, description, payment_reference, created_at, created_by, category:categories(name), fund:funds(name), account:accounts(name)")
    .eq("organization_id", membership.organizationId)
    .eq("status", "pending")
    .in("transaction_type", ["income", "expense"])
    .order("created_at", { ascending: true });

  if (error) return { ok: false as const, status: 500, error: "Pending transactions could not be loaded." };
  return {
    ok: true as const,
    transactions: (data ?? []).map((row) => ({
      id: row.id,
      transactionType: row.transaction_type as "income" | "expense",
      transactionDate: row.transaction_date,
      amount: Number(row.amount),
      description: row.description,
      paymentReference: row.payment_reference,
      submittedAt: row.created_at,
      submittedBy: row.created_by,
      category: relationName(row.category),
      fund: relationName(row.fund),
      account: relationName(row.account),
    })),
  };
}
