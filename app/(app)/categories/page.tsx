import { CategoriesPanel } from "@/components/categories/categories-panel";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listFinancialCategories } from "@/server/accounting/list-financial-categories";

export default async function CategoriesPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  const result = await listFinancialCategories();
  if (!result.ok) return <><p className="eyebrow">{text.nav.categories}</p><h1>{text.categoryManagement.title}</h1><section className="state-panel" role="alert"><p>{result.error}</p></section></>;
  return <><p className="eyebrow">{text.nav.categories}</p><h1>{text.categoryManagement.title}</h1><p className="lede">{text.categoryManagement.lede}</p><CategoriesPanel locale={locale} categories={result.categories} canManage={result.canManage} labels={text.categoryManagement} /></>;
}
