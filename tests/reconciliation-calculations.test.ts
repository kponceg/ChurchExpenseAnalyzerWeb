import { describe, expect, it } from "vitest";
import { calculateReconciliation, decimalToCents } from "@/lib/reconciliation-calculations";

describe("decimalToCents", () => {
  it("converts whole dollars and one- or two-digit fractions exactly", () => {
    expect(decimalToCents("12")).toBe(1200n);
    expect(decimalToCents("12.3")).toBe(1230n);
    expect(decimalToCents("12.34")).toBe(1234n);
  });

  it("preserves negative balances", () => {
    expect(decimalToCents("-45.67")).toBe(-4567n);
  });

  it("rejects money with more than two decimal places", () => {
    expect(() => decimalToCents("1.999")).toThrow(/two decimal places/i);
  });
});

describe("calculateReconciliation", () => {
  it("adds cleared income and subtracts cleared expenses", () => {
    const result = calculateReconciliation("100.00", "125.00", [
      { transactionType: "income", amount: "50.00", cleared: true },
      { transactionType: "expense", amount: "25.00", cleared: true },
    ]);
    expect(result).toEqual({ clearedActivity: 2500n, clearedBalance: 12500n, difference: 0n });
  });

  it("ignores transactions that have not cleared", () => {
    const result = calculateReconciliation("100.00", "100.00", [
      { transactionType: "income", amount: "999.00", cleared: false },
      { transactionType: "expense", amount: "500.00", cleared: false },
    ]);
    expect(result).toEqual({ clearedActivity: 0n, clearedBalance: 10000n, difference: 0n });
  });

  it("calculates the signed difference shown to the treasurer", () => {
    const result = calculateReconciliation("0.00", "0.00", [
      { transactionType: "income", amount: "1.00", cleared: true },
    ]);
    expect(result.difference).toBe(-100n);
  });

  it("supports accounts that begin with a negative balance", () => {
    const result = calculateReconciliation("-25.00", "5.00", [
      { transactionType: "income", amount: "30.00", cleared: true },
    ]);
    expect(result).toEqual({ clearedActivity: 3000n, clearedBalance: 500n, difference: 0n });
  });
});
