import { TransactionForm } from "@/components/transactions/transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listActiveAccountOptions } from "@/server/accounting/list-active-account-options";
import { listActiveCategoryOptions } from "@/server/accounting/list-active-category-options";
import { listActiveFundOptions } from "@/server/accounting/list-active-fund-options";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";
import { redirect } from "next/navigation";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership?.canRecordTransactions) redirect("/dashboard");
  const locale = await getLocale();
  const text = getMessages(locale).transaction;
  const initialType = (await searchParams).type === "expense" ? "expense" : "income";
  const [accountResult, categoryResult, fundResult] = await Promise.all([listActiveAccountOptions(), listActiveCategoryOptions(), listActiveFundOptions()]);
  const optionError = !accountResult.ok ? accountResult.error : !categoryResult.ok ? categoryResult.error : !fundResult.ok ? fundResult.error : null;
  return (
    <>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="lede">{text.lede}</p>
      {optionError || !accountResult.ok || !categoryResult.ok || !fundResult.ok ? <section className="state-panel" role="alert"><p>{optionError}</p></section> : <TransactionForm locale={locale} initialType={initialType} accounts={accountResult.accounts} categories={categoryResult.categories} funds={fundResult.funds} />}
    </>
  );
}
