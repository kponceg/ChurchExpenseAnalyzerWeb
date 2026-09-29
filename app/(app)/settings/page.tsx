import { MembersPanel } from "@/components/settings/members-panel";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getOrganizationMembers } from "@/server/organizations/get-organization-members";
export default async function SettingsPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  const result = await getOrganizationMembers();
  if (!result.ok) return <><p className="eyebrow">{text.pages.administration}</p><h1>{text.pages.settings}</h1><section className="state-panel" role="alert"><h2>{text.settings.unavailable}</h2><p>{result.error}</p></section></>;
  return <><p className="eyebrow">{text.pages.administration}</p><h1>{text.settings.title}</h1><p className="lede">{text.settings.lede}</p><section className="settings-summary"><span>{text.settings.organization}</span><strong>{result.organization.name}</strong><span>{text.settings.members}: {result.members.length}</span></section><MembersPanel locale={locale} members={result.members} canManage={result.organization.canManage} labels={text.settings} /></>;
}
