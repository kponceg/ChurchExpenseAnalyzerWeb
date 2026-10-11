import Link from "next/link";
import { notFound } from "next/navigation";
import { ReconciliationWorkspace } from "@/components/reconciliations/reconciliation-workspace";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getAccountReconciliation } from "@/server/accounting/get-account-reconciliation";

export default async function ReconciliationPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getAccountReconciliation((await params).id);
  if (!result.ok) notFound();
  const locale = await getLocale();
  const text = getMessages(locale).reconciliation;
  return <><Link className="secondary-link" href="/reconciliations">{text.back}</Link><p className="eyebrow report-detail-eyebrow">{text.title}</p><h1>{text.matchTitle}</h1><p className="lede">{text.matchLeDe}</p><ReconciliationWorkspace locale={locale} reconciliation={result.reconciliation} transactions={result.transactions} canReconcile={result.canReconcile} labels={text} /></>;
}
