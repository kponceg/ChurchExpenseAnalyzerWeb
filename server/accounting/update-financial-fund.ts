import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const fundUpdateSchema = z.object({ name: z.string().trim().min(1).max(80), active: z.boolean() });

export async function updateFinancialFund(id: string, input: unknown) {
  const idResult = z.string().uuid().safeParse(id);
  const parsed = fundUpdateSchema.safeParse(input);
  if (!idResult.success || !parsed.success) return { ok: false as const, status: 400, error: "Enter a valid fund name and status." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before updating a fund." };
  const { data, error } = await supabase.rpc("update_financial_fund", { target_fund_id: idResult.data, fund_name: parsed.data.name, fund_active: parsed.data.active });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The fund could not be updated." };
  return { ok: true as const, fund: data[0] };
}
