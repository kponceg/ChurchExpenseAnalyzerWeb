import { strToU8, zipSync } from "fflate";

import type { OrganizationBackupData } from "@/server/backups/get-organization-backup-data";

type BackupTable = { filename: string; columns: string[]; rows: Record<string, unknown>[] };
const spreadsheetFormulaPrefix = /^[\t\r ]*[=+\-@]/;

function serializeCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return spreadsheetFormulaPrefix.test(text) ? `'${text}` : text;
}

function quoteCsvCell(value: unknown) {
  const text = serializeCell(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCsv(columns: string[], rows: Record<string, unknown>[]) {
  const lines = [columns.map(quoteCsvCell).join(",")];
  for (const row of rows) lines.push(columns.map((column) => quoteCsvCell(row[column])).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function getBackupTables(data: OrganizationBackupData): BackupTable[] {
  return [
    { filename: "organization.csv", columns: ["id", "name", "created_at", "backup_generated_at"], rows: [{ ...data.organization, backup_generated_at: data.generatedAt }] },
    { filename: "members.csv", columns: ["user_id", "email", "role", "joined_at", "active", "deactivated_at"], rows: data.members },
    { filename: "accounts.csv", columns: ["id", "name", "account_type", "opening_balance", "active", "created_at"], rows: data.accounts },
    { filename: "categories.csv", columns: ["id", "name", "transaction_type", "active", "created_at"], rows: data.categories },
    { filename: "funds.csv", columns: ["id", "name", "active", "created_at"], rows: data.funds },
    { filename: "transactions.csv", columns: ["id", "account_id", "category_id", "fund_id", "transaction_type", "transaction_date", "amount", "description", "payment_reference", "status", "created_by", "created_at", "updated_by", "updated_at", "void_reason", "voided_by", "voided_at", "approved_by", "approved_at", "rejected_by", "rejected_at", "rejection_reason"], rows: data.transactions },
    { filename: "budgets.csv", columns: ["id", "category_id", "month_start", "amount", "created_at", "updated_at"], rows: data.budgets },
    { filename: "attachment-metadata.csv", columns: ["id", "transaction_id", "original_filename", "mime_type", "size_bytes", "uploaded_by", "created_at"], rows: data.attachmentMetadata },
    { filename: "reconciliations.csv", columns: ["id", "account_id", "period_start", "period_end", "beginning_balance", "statement_ending_balance", "status", "notes", "created_by", "created_at", "updated_by", "updated_at", "completed_by", "completed_at"], rows: data.reconciliations },
    { filename: "reconciliation-items.csv", columns: ["reconciliation_id", "transaction_id", "cleared_by", "cleared_at"], rows: data.reconciliationItems },
    { filename: "audit-events.csv", columns: ["id", "actor_id", "action", "record_type", "record_id", "previous_values", "new_values", "created_at"], rows: data.auditEvents },
  ];
}

export function createOrganizationBackupArchive(data: OrganizationBackupData) {
  const files = Object.fromEntries(getBackupTables(data).map((table) => [table.filename, strToU8(createCsv(table.columns, table.rows))]));
  return zipSync(files, { level: 6 });
}

export function createOrganizationBackupFilename(organizationName: string, generatedAt: string) {
  const safeName = organizationName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "organization";
  return `${safeName}-backup-${generatedAt.slice(0, 10)}.zip`;
}
