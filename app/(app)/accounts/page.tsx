import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
export default async function AccountsPage() {
  const text = getMessages(await getLocale()).pages;
  return <><p className="eyebrow">{text.accounts}</p><h1>{text.financialAccounts}</h1><p className="lede">{text.accountsLater}</p></>;
}
