import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const categoryUpdateSchema = z.object({ name: z.string().trim().min(1).max(80), active: z.boolean() });

export async function updateFinancialCategory(id: string, input: unknown) {
  const idResult = z.string().uuid().safeParse(id);
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!idResult.success || !parsed.success) return { ok: false as const, status: 400, error: "Enter a valid category name and status." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before updating a category." };
  const { data, error } = await supabase.rpc("update_financial_category", { target_category_id: idResult.data, category_name: parsed.data.name, category_active: parsed.data.active });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The category could not be updated." };
  return { ok: true as const, category: data[0] };
}
