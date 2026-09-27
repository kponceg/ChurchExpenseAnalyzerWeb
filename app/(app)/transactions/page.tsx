import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function TransactionsPage() {
  const text = getMessages(await getLocale());
  return <><p className="eyebrow">{text.pages.transactions}</p><h1>{text.pages.register}</h1><p className="lede">{text.pages.registerText}</p><Link className="primary" href="/transactions/new">{text.nav.transaction}</Link></>;
}
