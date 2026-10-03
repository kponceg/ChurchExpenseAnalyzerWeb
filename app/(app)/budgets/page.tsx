import { BudgetsPanel } from "@/components/budgets/budgets-panel";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listMonthlyBudgets } from "@/server/accounting/list-monthly-budgets";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const locale = await getLocale(); const text = getMessages(locale); const requested = Number((await searchParams).year); const year = Number.isInteger(requested) && requested >= 2000 && requested <= 2100 ? requested : new Date().getUTCFullYear(); const result = await listMonthlyBudgets(year);
  if (!result.ok) return <><p className="eyebrow">{text.nav.budgets}</p><h1>{text.budgetManagement.title}</h1><section className="state-panel" role="alert"><p>{result.error}</p></section></>;
  return <><p className="eyebrow">{text.nav.budgets}</p><h1>{text.budgetManagement.title}</h1><p className="lede">{text.budgetManagement.lede}</p><BudgetsPanel locale={locale} year={year} budgets={result.budgets} categories={result.categories} canManage={result.canManage} labels={text.budgetManagement} /></>;
}
