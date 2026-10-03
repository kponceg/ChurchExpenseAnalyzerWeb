import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({ name: z.string().trim().min(1).max(80), transactionType: z.enum(["income", "expense"]) });

export async function createFinancialCategory(input: unknown) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid category name and type." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before creating a category." };
  const { data, error } = await supabase.rpc("create_financial_category", { category_name: parsed.data.name, category_transaction_type: parsed.data.transactionType });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The category could not be created." };
  return { ok: true as const, category: data[0] };
}
