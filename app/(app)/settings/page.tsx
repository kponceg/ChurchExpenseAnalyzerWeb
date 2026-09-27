import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
export default async function SettingsPage() {
  const text = getMessages(await getLocale()).pages;
  return <><p className="eyebrow">{text.administration}</p><h1>{text.settings}</h1><p className="lede">{text.settingsLater}</p></>;
}
