import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getAccountLabel, getCategoryLabel, getFundLabel, type Locale } from "@/lib/i18n";

type MonthlyReport = {
  year: number;
  months: Array<{ key: string; label: string; income: string; expenses: string; net: string }>;
  totalIncome: string;
  totalExpenses: string;
  net: string;
};

type ReportDetails = {
  transactionType: "income" | "expense";
  total: string;
  transactionCount: number;
  categories: Array<{
    category: string;
    total: string;
    transactions: Array<{
      id: string;
      transactionDate: string;
      amount: string;
      description: string;
      paymentReference: string | null;
      fund: string;
      account: string;
    }>;
  }>;
};

const ink = rgb(0.07, 0.07, 0.07);
const muted = rgb(0.4, 0.4, 0.4);
const line = rgb(0.86, 0.86, 0.86);
const panel = rgb(0.96, 0.96, 0.96);

const copy = {
  en: {
    annualTitle: "Annual financial report",
    detailTitle: "Monthly transaction details",
    generated: "Generated",
    income: "Income",
    expenses: "Expenses",
    net: "Net result",
    month: "Month",
    total: "Year total",
    transactions: "Transactions",
    date: "Date",
    description: "Description / reference",
    fund: "Fund",
    account: "Account",
    amount: "Amount",
    empty: "No posted transactions for this selection.",
    page: "Page",
  },
  es: {
    annualTitle: "Reporte financiero anual",
    detailTitle: "Detalles mensuales de transacciones",
    generated: "Generado",
    income: "Ingresos",
    expenses: "Gastos",
    net: "Resultado neto",
    month: "Mes",
    total: "Total del año",
    transactions: "Transacciones",
    date: "Fecha",
    description: "Descripción / referencia",
    fund: "Fondo",
    account: "Cuenta",
    amount: "Monto",
    empty: "No hay transacciones registradas para esta selección.",
    page: "Página",
  },
} as const;

function pdfText(value: string | number) {
  return String(value)
    .replaceAll("−", "-")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("…", "...")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"');
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2) {
  const words = pdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    let last = lines[maxLines - 1];
    while (last && font.widthOfTextAtSize(`${last}...`, size) > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}...`;
  }
  return lines.length ? lines : [""];
}

function drawFooter(document: PDFDocument, font: PDFFont, locale: Locale) {
  const labels = copy[locale];
  document.getPages().forEach((page, index, pages) => {
    const text = `${labels.page} ${index + 1} / ${pages.length}`;
    page.drawText(text, { x: page.getWidth() - 42 - font.widthOfTextAtSize(text, 8), y: 20, size: 8, font, color: muted });
  });
}

function drawDocumentHeader(page: PDFPage, bold: PDFFont, regular: PDFFont, title: string, subtitle: string) {
  page.drawText(pdfText(title), { x: 42, y: page.getHeight() - 52, size: 22, font: bold, color: ink });
  page.drawText(pdfText(subtitle), { x: 42, y: page.getHeight() - 72, size: 9, font: regular, color: muted });
}

function drawSummaryCard(page: PDFPage, regular: PDFFont, bold: PDFFont, x: number, y: number, width: number, label: string, value: string) {
  page.drawRectangle({ x, y, width, height: 54, color: panel, borderColor: line, borderWidth: 1 });
  page.drawText(pdfText(label), { x: x + 12, y: y + 34, size: 8, font: regular, color: muted });
  page.drawText(pdfText(value), { x: x + 12, y: y + 13, size: 15, font: bold, color: ink });
}

function generatedLabel(locale: Locale) {
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { dateStyle: "long", timeZone: "America/Los_Angeles" }).format(new Date());
  return `${copy[locale].generated}: ${date}`;
}

export async function createAnnualReportPdf(report: MonthlyReport, locale: Locale) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const page = document.addPage([612, 792]);
  const labels = copy[locale];
  drawDocumentHeader(page, bold, regular, `${labels.annualTitle} ${report.year}`, generatedLabel(locale));

  const cardWidth = 164;
  drawSummaryCard(page, regular, bold, 42, 640, cardWidth, labels.income, report.totalIncome);
  drawSummaryCard(page, regular, bold, 224, 640, cardWidth, labels.expenses, report.totalExpenses);
  drawSummaryCard(page, regular, bold, 406, 640, cardWidth, labels.net, report.net);

  const columns = [42, 230, 340, 450];
  const headers = [labels.month, labels.income, labels.expenses, labels.net];
  page.drawRectangle({ x: 42, y: 594, width: 528, height: 28, color: ink });
  headers.forEach((header, index) => page.drawText(pdfText(header), { x: columns[index] + 8, y: 604, size: 9, font: bold, color: rgb(1, 1, 1) }));

  let y = 566;
  for (const month of report.months) {
    page.drawLine({ start: { x: 42, y }, end: { x: 570, y }, thickness: 0.7, color: line });
    [month.label, month.income, month.expenses, month.net].forEach((value, index) => page.drawText(pdfText(value), { x: columns[index] + 8, y: y + 9, size: 9, font: index === 0 ? bold : regular, color: ink }));
    y -= 28;
  }
  page.drawRectangle({ x: 42, y: y, width: 528, height: 30, color: panel, borderColor: line, borderWidth: 1 });
  [labels.total, report.totalIncome, report.totalExpenses, report.net].forEach((value, index) => page.drawText(pdfText(value), { x: columns[index] + 8, y: y + 10, size: 9, font: bold, color: ink }));

  drawFooter(document, regular, locale);
  return document.save();
}

export async function createDetailReportPdf(details: ReportDetails, monthLabel: string, locale: Locale) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const labels = copy[locale];
  const typeLabel = details.transactionType === "income" ? labels.income : labels.expenses;
  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  let page = document.addPage([792, 612]);
  let y = 430;

  const drawPageHeader = (continuation = false) => {
    drawDocumentHeader(page, bold, regular, `${labels.detailTitle}: ${monthLabel}`, generatedLabel(locale));
    if (!continuation) {
      drawSummaryCard(page, regular, bold, 42, 474, 220, typeLabel, details.total);
      drawSummaryCard(page, regular, bold, 278, 474, 220, labels.transactions, details.transactionCount.toString());
    }
    page.drawRectangle({ x: 42, y: continuation ? 494 : 416, width: 708, height: 28, color: ink });
    const headerY = continuation ? 504 : 426;
    const columns = [50, 124, 388, 508, 628];
    [labels.date, labels.description, labels.fund, labels.account, labels.amount].forEach((header, index) => page.drawText(pdfText(header), { x: columns[index], y: headerY, size: 8, font: bold, color: rgb(1, 1, 1) }));
    y = continuation ? 484 : 406;
  };

  const addPage = () => {
    page = document.addPage([792, 612]);
    drawPageHeader(true);
  };

  drawPageHeader();
  if (details.categories.length === 0) {
    page.drawText(pdfText(labels.empty), { x: 50, y: y - 22, size: 10, font: regular, color: muted });
  }

  for (const category of details.categories) {
    if (y < 78) addPage();
    page.drawRectangle({ x: 42, y: y - 24, width: 708, height: 24, color: panel });
    page.drawText(pdfText(getCategoryLabel(locale, category.category)), { x: 50, y: y - 16, size: 9, font: bold, color: ink });
    const categoryTotal = pdfText(category.total);
    page.drawText(categoryTotal, { x: 742 - bold.widthOfTextAtSize(categoryTotal, 9), y: y - 16, size: 9, font: bold, color: ink });
    y -= 24;

    for (const transaction of category.transactions) {
      const description = transaction.paymentReference ? `${transaction.description} / ${transaction.paymentReference}` : transaction.description;
      const descriptionLines = wrapText(description, regular, 8, 246, 2);
      const rowHeight = Math.max(28, descriptionLines.length * 10 + 10);
      if (y - rowHeight < 40) addPage();
      page.drawLine({ start: { x: 42, y: y - rowHeight }, end: { x: 750, y: y - rowHeight }, thickness: 0.7, color: line });
      const date = dateFormatter.format(new Date(`${transaction.transactionDate}T00:00:00Z`));
      page.drawText(pdfText(date), { x: 50, y: y - 18, size: 8, font: regular, color: ink });
      descriptionLines.forEach((lineText, index) => page.drawText(lineText, { x: 124, y: y - 17 - index * 10, size: 8, font: regular, color: ink }));
      page.drawText(pdfText(getFundLabel(locale, transaction.fund)), { x: 388, y: y - 18, size: 8, font: regular, color: ink });
      page.drawText(pdfText(getAccountLabel(locale, transaction.account)), { x: 508, y: y - 18, size: 8, font: regular, color: ink });
      const amount = pdfText(`${details.transactionType === "income" ? "+" : "-"}${transaction.amount}`);
      page.drawText(amount, { x: 742 - bold.widthOfTextAtSize(amount, 8), y: y - 18, size: 8, font: bold, color: ink });
      y -= rowHeight;
    }
  }

  drawFooter(document, regular, locale);
  return document.save();
}
