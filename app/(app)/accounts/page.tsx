import { AccountsPanel } from "@/components/accounts/accounts-panel";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listFinancialAccounts } from "@/server/accounting/list-financial-accounts";
export default async function AccountsPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  const result = await listFinancialAccounts();
  if (!result.ok) return <><p className="eyebrow">{text.pages.accounts}</p><h1>{text.accounts.title}</h1><p className="lede">{text.accounts.lede}</p><section className="state-panel"><h2>{text.accounts.unavailable}</h2><p>{result.error}</p></section></>;
  return <><p className="eyebrow">{text.pages.accounts}</p><h1>{text.accounts.title}</h1><p className="lede">{text.accounts.lede}</p><AccountsPanel accounts={result.accounts} canManage={result.canManage} labels={text.accounts} /></>;
}
