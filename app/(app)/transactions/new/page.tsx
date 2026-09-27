import { IncomeTransactionForm } from "@/components/transactions/income-transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function NewTransactionPage() {
  const locale = await getLocale();
  const text = getMessages(locale).income;
  return (
    <>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="lede">{text.lede}</p>
      <IncomeTransactionForm locale={locale} />
    </>
  );
}
