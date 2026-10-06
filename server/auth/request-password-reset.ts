import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ email: z.string().trim().email().max(254) });

export async function requestPasswordReset(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: true as const };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let redirectTo: string;
  try { redirectTo = new URL("/auth/reset", siteUrl).toString(); }
  catch { return { ok: true as const }; }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
    if (error?.status === 429 || error?.code === "over_email_send_rate_limit") return { ok: false as const, status: 429 };
  } catch {
    // Keep the response generic so callers cannot discover registered accounts.
  }

  return { ok: true as const };
}
