import { ReconciliationsPanel } from "@/components/reconciliations/reconciliations-panel";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listAccountReconciliations } from "@/server/accounting/list-account-reconciliations";

export default async function ReconciliationsPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  const result = await listAccountReconciliations();
  if (!result.ok) return <><p className="eyebrow">{text.nav.reconciliations}</p><h1>{text.reconciliation.title}</h1><section className="state-panel" role="alert"><p>{result.error}</p></section></>;
  return <><p className="eyebrow">{text.nav.reconciliations}</p><h1>{text.reconciliation.title}</h1><p className="lede">{text.reconciliation.lede}</p><ReconciliationsPanel locale={locale} accounts={result.accounts} reconciliations={result.reconciliations} canReconcile={result.canReconcile} labels={text.reconciliation} /></>;
}
