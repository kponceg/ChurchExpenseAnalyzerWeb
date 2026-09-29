import { getLocale } from "@/lib/locale";
import { getMonthlyReport } from "@/server/accounting/get-monthly-report";
import { getReportDetails } from "@/server/accounting/get-report-details";
import { getTransactionReport, type TransactionReportType } from "@/server/accounting/get-transaction-report";
import { createAnnualReportPdf, createDetailReportPdf, createTransactionReportPdf } from "@/server/reports/create-report-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const locale = await getLocale();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const requestedYear = searchParams.get("year") ?? undefined;
  const preview = searchParams.get("preview") === "1";
  const detailed = searchParams.get("detail") === "transactions";

  if (detailed) {
    const reportTypeValue = searchParams.get("type");
    const reportType: TransactionReportType = reportTypeValue === "income" || reportTypeValue === "expense" ? reportTypeValue : "all";
    const result = await getTransactionReport(requestedYear, month || undefined, reportType);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    const periodLabel = formatPeriodLabel(result.report.year, result.report.monthKey, locale);
    const pdf = await createTransactionReportPdf(result.report, periodLabel, locale);
    const periodKey = result.report.monthKey ?? result.report.year.toString();
    return pdfResponse(pdf, `church-finance-detailed-${reportType}-${periodKey}.pdf`, preview);
  }

  if (!month) {
    const result = await getMonthlyReport(locale, requestedYear);
    if (!result.ok) return Response.json({ error: result.error }, { status: 500 });
    const pdf = await createAnnualReportPdf(result.report, locale);
    return pdfResponse(pdf, `church-finance-report-${result.report.year}.pdf`, preview);
  }

  const transactionType = searchParams.get("type") === "expense" ? "expense" : "income";
  const result = await getReportDetails(month, transactionType);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const pdf = await createDetailReportPdf(result.details, monthLabel, locale);
  return pdfResponse(pdf, `church-finance-${transactionType}-${month}.pdf`, preview);
}

function formatPeriodLabel(year: number, monthKey: string | null, locale: "en" | "es") {
  if (!monthKey) return year.toString();
  const [, monthNumber] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

function pdfResponse(pdf: Uint8Array, filename: string, preview: boolean) {
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
