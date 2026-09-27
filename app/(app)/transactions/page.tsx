import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function TransactionsPage() {
  const text = getMessages(await getLocale());
  return <><p className="eyebrow">{text.pages.transactions}</p><h1>{text.pages.register}</h1><p className="lede">{text.pages.registerText}</p><div className="page-actions"><Link className="primary" href="/transactions/new">{text.nav.income}</Link><Link className="secondary-link" href="/transactions/expense/new">{text.nav.expense}</Link></div></>;
}
