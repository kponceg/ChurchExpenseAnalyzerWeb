import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ active: z.boolean() });

export async function setMemberActive(userId: string, input: unknown) {
  if (!z.string().uuid().safeParse(userId).success) return { ok: false as const, status: 404, error: "Organization member not found." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Select a valid access status." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before changing member access." };
  const { data, error } = await supabase.rpc("set_organization_member_active", { target_user_id: userId, new_active: parsed.data.active });
  if (error || data === null) return { ok: false as const, status: 403, error: error?.message ?? "Member access could not be changed." };
  return { ok: true as const, active: data as boolean };
}
