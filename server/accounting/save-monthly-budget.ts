import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ categoryId: z.string().uuid(), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), amount: z.coerce.number().min(0).max(999999999999.99) });

export async function saveMonthlyBudget(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid category, month, and amount." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before saving a budget." };
  const { data, error } = await supabase.rpc("save_monthly_budget", { target_category_id: parsed.data.categoryId, target_month: `${parsed.data.month}-01`, target_amount: parsed.data.amount });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The budget could not be saved." };
  return { ok: true as const, budget: data[0] };
}
