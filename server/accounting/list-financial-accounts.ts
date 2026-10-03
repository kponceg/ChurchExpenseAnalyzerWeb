import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FinancialAccountType = "checking" | "savings" | "cash" | "petty_cash" | "other";
export type FinancialAccount = { id: string; name: string; accountType: FinancialAccountType; openingBalance: string; balance: string; active: boolean };

function decimalToCents(value: string | number) {
  const normalized = String(value);
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const cents = BigInt(whole || "0") * 100n + BigInt(`${fraction}00`.slice(0, 2));
  return negative ? -cents : cents;
}

function formatCents(cents: bigint) {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const dollars = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${dollars}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export async function listFinancialAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to view financial accounts." };

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1);
  const membership = memberships?.[0];
  if (membershipError || !membership) return { ok: false as const, error: "Organization access could not be loaded." };

  const [accountsResult, transactionsResult] = await Promise.all([
    supabase.from("accounts").select("id, name, account_type, opening_balance, active").eq("organization_id", membership.organization_id).order("name"),
    supabase.from("transactions").select("account_id, transaction_type, amount").eq("organization_id", membership.organization_id).eq("status", "posted").in("transaction_type", ["income", "expense"]),
  ]);
  if (accountsResult.error || transactionsResult.error) return { ok: false as const, error: "Financial accounts could not be loaded." };

  const activityByAccount = new Map<string, bigint>();
  for (const transaction of transactionsResult.data ?? []) {
    const signedAmount = decimalToCents(transaction.amount) * (transaction.transaction_type === "income" ? 1n : -1n);
    activityByAccount.set(transaction.account_id, (activityByAccount.get(transaction.account_id) ?? 0n) + signedAmount);
  }

  const accounts: FinancialAccount[] = (accountsResult.data ?? []).map((account) => {
    const openingBalance = decimalToCents(account.opening_balance);
    return {
      id: account.id,
      name: account.name,
      accountType: account.account_type as FinancialAccountType,
      openingBalance: formatCents(openingBalance),
      balance: formatCents(openingBalance + (activityByAccount.get(account.id) ?? 0n)),
      active: account.active,
    };
  });

  return { ok: true as const, accounts, canManage: membership.role === "administrator" };
}
