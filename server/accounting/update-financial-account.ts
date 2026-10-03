import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const accountUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  active: z.boolean(),
});

export async function updateFinancialAccount(id: string, input: unknown) {
  const idResult = z.string().uuid().safeParse(id);
  const parsed = accountUpdateSchema.safeParse(input);
  if (!idResult.success || !parsed.success) return { ok: false as const, status: 400, error: "Enter a valid account name and status." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before updating an account." };

  const { data, error } = await supabase.rpc("update_financial_account", {
    target_account_id: idResult.data,
    account_name: parsed.data.name,
    account_active: parsed.data.active,
  });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The financial account could not be updated." };
  return { ok: true as const, account: data[0] };
}
