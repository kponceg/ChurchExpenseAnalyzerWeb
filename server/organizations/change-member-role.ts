import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const roleUpdateSchema = z.object({ role: z.enum(["administrator", "treasurer", "data_entry", "approver", "viewer"]) });

export async function changeMemberRole(userId: string, input: unknown) {
  if (!z.string().uuid().safeParse(userId).success) return { ok: false as const, status: 404, error: "Organization member not found." };
  const parsed = roleUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Select a valid role." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before changing a role." };
  const { data, error } = await supabase.rpc("change_organization_member_role", { target_user_id: userId, new_role: parsed.data.role });
  if (error || !data) return { ok: false as const, status: 403, error: error?.message ?? "Only administrators can change roles." };
  return { ok: true as const, role: data as string };
}
