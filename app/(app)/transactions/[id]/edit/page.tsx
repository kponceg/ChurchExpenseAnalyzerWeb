import { notFound, redirect } from "next/navigation";
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getTransactionForEdit } from "@/server/accounting/get-transaction-for-edit";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership?.canRecordTransactions) redirect("/dashboard");
  const locale = await getLocale();
  const text = getMessages(locale).editTransaction;
  const result = await getTransactionForEdit((await params).id);
  if (!result.ok) notFound();
  return <><p className="eyebrow">{text.eyebrow}</p><h1>{text.title}</h1><p className="lede">{text.lede}</p><EditTransactionForm locale={locale} transaction={result.transaction} options={result.options} canVoid={membership.canVoidTransactions} /></>;
}
