import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const addMemberSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["administrator", "treasurer", "data_entry", "approver", "viewer"]),
});

export async function addOrganizationMember(input: unknown) {
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid email address and role." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before adding a member." };
  const { data, error } = await supabase.rpc("add_organization_member", { member_email: parsed.data.email, member_role: parsed.data.role });
  if (error || !data?.length) return { ok: false as const, status: 400, error: error?.message ?? "The member could not be added." };
  return { ok: true as const, member: data[0] as { user_id: string; email: string; role: string } };
}
