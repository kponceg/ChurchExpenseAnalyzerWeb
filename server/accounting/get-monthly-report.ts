import "server-only";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const REPORTING_TIME_ZONE = "America/Los_Angeles";

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

function currentReportingYear() {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: REPORTING_TIME_ZONE, year: "numeric" }).format(new Date()));
}

export async function getMonthlyReport(locale: Locale) {
  const year = currentReportingYear();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_type, transaction_date, amount")
    .eq("status", "posted")
    .in("transaction_type", ["income", "expense"])
    .gte("transaction_date", `${year}-01-01`)
    .lt("transaction_date", `${year + 1}-01-01`);

  if (error) return { ok: false as const, error: "The monthly report could not be loaded." };

  const monthlyCents = Array.from({ length: 12 }, () => ({ income: 0n, expenses: 0n }));
  for (const transaction of data ?? []) {
    const monthIndex = Number(transaction.transaction_date.slice(5, 7)) - 1;
    if (monthIndex < 0 || monthIndex > 11) continue;
    const amount = decimalToCents(transaction.amount);
    if (transaction.transaction_type === "income") monthlyCents[monthIndex].income += amount;
    if (transaction.transaction_type === "expense") monthlyCents[monthIndex].expenses += amount;
  }

  const localeName = locale === "es" ? "es-US" : "en-US";
  const months = monthlyCents.map((month, monthIndex) => ({
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat(localeName, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthIndex, 1))),
    income: formatCents(month.income),
    expenses: formatCents(month.expenses),
    net: formatCents(month.income - month.expenses),
    netDirection: month.income - month.expenses < 0n ? "negative" as const : "positive" as const,
  }));

  const totals = monthlyCents.reduce((total, month) => ({ income: total.income + month.income, expenses: total.expenses + month.expenses }), { income: 0n, expenses: 0n });
  const net = totals.income - totals.expenses;

  return {
    ok: true as const,
    report: {
      year,
      months,
      totalIncome: formatCents(totals.income),
      totalExpenses: formatCents(totals.expenses),
      net: formatCents(net),
      netDirection: net < 0n ? "negative" as const : "positive" as const,
    },
  };
}
