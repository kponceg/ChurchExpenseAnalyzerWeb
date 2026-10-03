import { TransactionForm } from "@/components/transactions/transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listActiveAccountOptions } from "@/server/accounting/list-active-account-options";
import { listActiveCategoryOptions } from "@/server/accounting/list-active-category-options";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const locale = await getLocale();
  const text = getMessages(locale).transaction;
  const initialType = (await searchParams).type === "expense" ? "expense" : "income";
  const [accountResult, categoryResult] = await Promise.all([listActiveAccountOptions(), listActiveCategoryOptions()]);
  const optionError = !accountResult.ok ? accountResult.error : !categoryResult.ok ? categoryResult.error : null;
  return (
    <>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="lede">{text.lede}</p>
      {optionError || !accountResult.ok || !categoryResult.ok ? <section className="state-panel" role="alert"><p>{optionError}</p></section> : <TransactionForm locale={locale} initialType={initialType} accounts={accountResult.accounts} categories={categoryResult.categories} />}
    </>
  );
}
