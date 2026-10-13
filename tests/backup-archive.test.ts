import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { createCsv, createOrganizationBackupArchive, createOrganizationBackupFilename } from "@/server/backups/create-backup-archive";
import type { OrganizationBackupData } from "@/server/backups/get-organization-backup-data";

function emptyBackup(): OrganizationBackupData {
  return {
    generatedAt: "2026-10-12T18:00:00.000Z",
    organization: { id: "org-1", name: "Iglesia Esperanza", created_at: "2026-01-01T00:00:00.000Z" },
    members: [], accounts: [], categories: [], funds: [], transactions: [], budgets: [],
    attachmentMetadata: [], reconciliations: [], reconciliationItems: [], auditEvents: [],
  };
}

describe("organization backup archive", () => {
  it("creates Excel-compatible CSV and prevents spreadsheet formulas", () => {
    const csv = createCsv(["description", "amount"], [{ description: '=HYPERLINK("bad")', amount: "12.50" }, { description: "Offering, Sunday", amount: 20 }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"Offering, Sunday",20');
    expect(csv).toContain("\r\n");
  });

  it("includes every expected CSV even when a table has no rows", () => {
    const files = unzipSync(createOrganizationBackupArchive(emptyBackup()));
    expect(Object.keys(files).sort()).toEqual([
      "accounts.csv", "attachment-metadata.csv", "audit-events.csv", "budgets.csv", "categories.csv",
      "funds.csv", "members.csv", "organization.csv", "reconciliation-items.csv", "reconciliations.csv", "transactions.csv",
    ]);
    expect(strFromU8(files["transactions.csv"])).toContain("transaction_date");
    expect(strFromU8(files["organization.csv"])).toContain("Iglesia Esperanza");
  });

  it("uses a safe dated filename", () => {
    expect(createOrganizationBackupFilename("Iglesia Peña / Central", "2026-10-12T18:00:00.000Z")).toBe("iglesia-pena-central-backup-2026-10-12.zip");
  });
});
