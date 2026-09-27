import { ExpenseTransactionForm } from "@/components/transactions/expense-transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
export default async function NewExpensePage() {
  const locale = await getLocale();
  const text = getMessages(locale).expense;
  return <><p className="eyebrow">{text.eyebrow}</p><h1>{text.title}</h1><p className="lede">{text.lede}</p><ExpenseTransactionForm locale={locale} /></>;
}
