import { FundsPanel } from "@/components/funds/funds-panel";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listFinancialFunds } from "@/server/accounting/list-financial-funds";

export default async function FundsPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  const result = await listFinancialFunds();
  if (!result.ok) return <><p className="eyebrow">{text.nav.funds}</p><h1>{text.fundManagement.title}</h1><section className="state-panel" role="alert"><p>{result.error}</p></section></>;
  return <><p className="eyebrow">{text.nav.funds}</p><h1>{text.fundManagement.title}</h1><p className="lede">{text.fundManagement.lede}</p><FundsPanel locale={locale} funds={result.funds} canManage={result.canManage} labels={text.fundManagement} /></>;
}
