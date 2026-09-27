import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
export default async function ReportsPage() {
  const text = getMessages(await getLocale()).pages;
  return <><p className="eyebrow">{text.reports}</p><h1>{text.financialReports}</h1><p className="lede">{text.reportsLater}</p></>;
}
