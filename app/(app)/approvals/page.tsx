import { redirect } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listPendingTransactions } from "@/server/accounting/list-pending-transactions";
import { getCurrentMembership } from "@/server/organizations/get-current-membership";
import { ApprovalsQueue } from "@/components/approvals/approvals-queue";

export default async function ApprovalsPage() {
  const membership = await getCurrentMembership();
  if (!membership?.canReviewTransactions) redirect("/dashboard");
  const locale = await getLocale();
  const text = getMessages(locale);
  const labels = text.approvals;
  const result = await listPendingTransactions();

  return <>
    <p className="eyebrow">{labels.eyebrow}</p>
    <h1>{labels.title}</h1>
    <p className="lede">{labels.lede}</p>
    {!result.ok ? <section className="state-panel" role="alert"><h2>{labels.unavailable}</h2><p>{result.error}</p></section>
      : result.transactions.length === 0 ? <section className="state-panel"><h2>{labels.empty}</h2><p>{labels.emptyText}</p></section>
      : <ApprovalsQueue locale={locale} transactions={result.transactions} labels={{ ...labels, income: text.activity.incomeType, expense: text.activity.expenseType }} />}
  </>;
}
