import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), reason: z.string().optional() }),
  z.object({ decision: z.literal("reject"), reason: z.string().trim().min(3).max(160) }),
]);

export async function reviewTransaction(id: string, input: unknown) {
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, status: 404, error: "Pending transaction not found." };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid review decision and rejection reason." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before reviewing transactions." };

  const { data, error } = await supabase.rpc("review_transaction", {
    target_transaction_id: id,
    decision: parsed.data.decision,
    reason: parsed.data.reason ?? null,
  });
  if (error || !data) return { ok: false as const, status: 403, error: error?.message ?? "The transaction could not be reviewed." };
  return { ok: true as const, decision: parsed.data.decision };
}
