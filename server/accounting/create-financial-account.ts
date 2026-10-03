import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const accountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(["checking", "savings", "cash", "petty_cash", "other"]),
  openingBalance: z.coerce.number().finite().min(-999999999999.99).max(999999999999.99),
});

export async function createFinancialAccount(input: unknown) {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid account name, type, and opening balance." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before creating an account." };

  const { data, error } = await supabase.rpc("create_financial_account", {
    account_name: parsed.data.name,
    new_account_type: parsed.data.accountType,
    initial_balance: parsed.data.openingBalance,
  });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The financial account could not be created." };
  return { ok: true as const, account: data[0] };
}
