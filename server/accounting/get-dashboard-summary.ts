import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

const REPORTING_TIME_ZONE = "America/Los_Angeles";

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
  const remainder = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}$${dollars}.${remainder}`;
}

function currentReportingPeriod(locale: Locale) {
  const localeName = locale === "es" ? "es-US" : "en-US";
  const parts = new Intl.DateTimeFormat(localeName, {
    timeZone: REPORTING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat(localeName, { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  return { monthKey, label };
}

export async function getDashboardSummary(locale: Locale = "en") {
  const supabase = await createClient();
  const [accountsResult, transactionsResult] = await Promise.all([
    supabase.from("accounts").select("opening_balance"),
    supabase.from("transactions").select("transaction_type, transaction_date, amount").eq("status", "posted").in("transaction_type", ["income", "expense"]),
  ]);

  if (accountsResult.error || transactionsResult.error) {
    return { ok: false as const, error: "The financial summary could not be loaded." };
  }

  const period = currentReportingPeriod(locale);
  let balanceCents = (accountsResult.data ?? []).reduce((total, account) => total + decimalToCents(account.opening_balance), 0n);
  let monthlyIncomeCents = 0n;
  let monthlyExpenseCents = 0n;

  for (const transaction of transactionsResult.data ?? []) {
    const amountCents = decimalToCents(transaction.amount);
    if (transaction.transaction_type === "income") balanceCents += amountCents;
    if (transaction.transaction_type === "expense") balanceCents -= amountCents;
    if (!transaction.transaction_date.startsWith(period.monthKey)) continue;
    if (transaction.transaction_type === "income") monthlyIncomeCents += amountCents;
    if (transaction.transaction_type === "expense") monthlyExpenseCents += amountCents;
  }

  return {
    ok: true as const,
    summary: {
      periodLabel: period.label,
      availableBalance: formatCents(balanceCents),
      monthlyIncome: formatCents(monthlyIncomeCents),
      monthlyExpenses: formatCents(monthlyExpenseCents),
    },
  };
}
