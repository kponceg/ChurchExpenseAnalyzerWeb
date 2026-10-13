import { describe, expect, it } from "vitest";
import { normalizeTransactionActivityFilters, normalizeTransactionSearch } from "@/server/accounting/list-transactions";

describe("transaction activity search", () => {
  it("trims and normalizes ordinary search text", () => {
    expect(normalizeTransactionSearch("  church   offering  ")).toBe("church offering");
  });

  it("removes PostgREST filter control characters", () => {
    expect(normalizeTransactionSearch("rent,().\\%_* check")).toBe("rent check");
  });

  it("limits excessively long searches", () => {
    expect(normalizeTransactionSearch("x".repeat(150))).toHaveLength(100);
  });

  it("accepts only supported type and status filters", () => {
    expect(normalizeTransactionActivityFilters({ type: "expense", status: "reversed" })).toMatchObject({ type: "expense", status: "reversed" });
    expect(normalizeTransactionActivityFilters({ type: "transfer", status: "deleted" })).toMatchObject({ type: undefined, status: undefined });
  });

  it("validates dates and database record identifiers", () => {
    const validId = "8c93c0e5-fcdc-4694-a9b9-b1ff93f413de";
    expect(normalizeTransactionActivityFilters({ startDate: "2026-01-01", endDate: "2026-12-31", accountId: validId })).toMatchObject({ startDate: "2026-01-01", endDate: "2026-12-31", accountId: validId });
    expect(normalizeTransactionActivityFilters({ startDate: "2026-02-31", endDate: "tomorrow", accountId: "not-an-id" })).toMatchObject({ startDate: undefined, endDate: undefined, accountId: undefined });
  });
});
