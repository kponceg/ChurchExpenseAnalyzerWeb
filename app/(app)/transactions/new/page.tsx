import { TransactionForm } from "@/components/transactions/transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const locale = await getLocale();
  const text = getMessages(locale).transaction;
  const initialType = (await searchParams).type === "expense" ? "expense" : "income";
  return (
    <>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="lede">{text.lede}</p>
      <TransactionForm locale={locale} initialType={initialType} />
    </>
  );
}
