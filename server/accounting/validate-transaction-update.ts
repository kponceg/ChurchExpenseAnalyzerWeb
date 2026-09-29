import "server-only";
import { z } from "zod";

const transactionUpdateSchema = z.object({
  transactionType: z.enum(["income", "expense"]),
  amount: z.coerce.number().finite().positive().max(1_000_000),
  transactionDate: z.string().date(),
  categoryId: z.string().uuid(),
  fundId: z.string().uuid(),
  accountId: z.string().uuid(),
  description: z.string().trim().min(1).max(160),
  paymentReference: z.string().trim().max(80).optional().default(""),
});

export function validateTransactionUpdate(input: unknown) {
  const parsed = transactionUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the amount, date, category, fund, account, description, and payment reference." };
  return { ok: true as const, data: parsed.data };
}
