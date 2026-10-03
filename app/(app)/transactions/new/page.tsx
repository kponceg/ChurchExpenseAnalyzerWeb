import { TransactionForm } from "@/components/transactions/transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listActiveAccountOptions } from "@/server/accounting/list-active-account-options";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const locale = await getLocale();
  const text = getMessages(locale).transaction;
  const initialType = (await searchParams).type === "expense" ? "expense" : "income";
  const accountResult = await listActiveAccountOptions();
  return (
    <>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="lede">{text.lede}</p>
      {!accountResult.ok ? <section className="state-panel" role="alert"><p>{accountResult.error}</p></section> : <TransactionForm locale={locale} initialType={initialType} accounts={accountResult.accounts} />}
    </>
  );
}
