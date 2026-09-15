import "server-only";
import { z } from "zod";

const incomeTransactionSchema = z.object({
  amount: z.coerce.number().finite().positive().max(1_000_000),
  transactionDate: z.string().date(),
  category: z.string().trim().min(1).max(80),
  fund: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(160),
});

export function validateIncomeTransaction(input: unknown) {
  const parsed = incomeTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the amount, date, category, fund, and description." };
  return {
    ok: true as const,
    transaction: {
      ...parsed.data,
      amount: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parsed.data.amount),
    },
  };
}
