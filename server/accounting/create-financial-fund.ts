import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const fundSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function createFinancialFund(input: unknown) {
  const parsed = fundSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid fund name." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before creating a fund." };
  const { data, error } = await supabase.rpc("create_financial_fund", { fund_name: parsed.data.name });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The fund could not be created." };
  return { ok: true as const, fund: data[0] };
}
