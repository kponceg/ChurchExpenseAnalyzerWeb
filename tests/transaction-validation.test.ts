import { describe, expect, it } from "vitest";
import { validateExpenseTransaction } from "@/server/accounting/validate-expense-transaction";
import { validateIncomeTransaction } from "@/server/accounting/validate-income-transaction";

const base = {
  amount: "25.50",
  transactionDate: "2026-10-11",
  category: " Church offering ",
  fund: " General congregation ",
  accountId: "11111111-1111-4111-8111-111111111111",
  description: " Sunday deposit ",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
};

describe("transaction validation", () => {
  it("normalizes a valid income transaction", () => {
    const result = validateIncomeTransaction(base);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toMatchObject({ amount: 25.5, category: "Church offering", fund: "General congregation", description: "Sunday deposit" });
  });

  it.each(["0", "-1", "1000000.01", "not money"])("rejects an invalid income amount: %s", (amount) => {
    expect(validateIncomeTransaction({ ...base, amount }).ok).toBe(false);
  });

  it("rejects invalid dates and identifiers", () => {
    expect(validateIncomeTransaction({ ...base, transactionDate: "2026-02-30" }).ok).toBe(false);
    expect(validateIncomeTransaction({ ...base, accountId: "not-a-uuid" }).ok).toBe(false);
  });

  it("accepts and trims an optional expense payment reference", () => {
    const result = validateExpenseTransaction({ ...base, paymentReference: " Check 1042 " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.paymentReference).toBe("Check 1042");
  });

  it("rejects descriptions and payment references beyond their limits", () => {
    expect(validateExpenseTransaction({ ...base, description: "x".repeat(161) }).ok).toBe(false);
    expect(validateExpenseTransaction({ ...base, paymentReference: "x".repeat(81) }).ok).toBe(false);
  });
});
