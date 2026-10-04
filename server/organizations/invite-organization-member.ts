import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationMembers } from "@/server/organizations/get-organization-members";

const invitationSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["administrator", "treasurer", "data_entry", "approver", "viewer"]),
});

export async function inviteOrganizationMember(input: unknown) {
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Enter a valid email address and role." };

  const membership = await getOrganizationMembers();
  if (!membership.ok) return { ok: false as const, status: 401, error: membership.error };
  if (!membership.organization.canManage) return { ok: false as const, status: 403, error: "Only administrators can invite members." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let redirectTo: string;
  try {
    const callbackUrl = new URL("/auth/callback", siteUrl);
    callbackUrl.searchParams.set("next", "/auth/invite");
    redirectTo = callbackUrl.toString();
  } catch {
    return { ok: false as const, status: 500, error: "The website URL is not configured correctly." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return { ok: false as const, status: 503, error: error instanceof Error ? error.message : "Invitations are not configured." };
  }

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo,
    data: { invited_role: parsed.data.role },
  });
  if (inviteError || !data.user) {
    return { ok: false as const, status: 400, error: inviteError?.message ?? "The invitation could not be sent." };
  }

  const supabase = await createClient();
  const { data: addedMembers, error: memberError } = await supabase.rpc("add_organization_member", {
    member_email: parsed.data.email,
    member_role: parsed.data.role,
  });

  if (memberError || !addedMembers?.length) {
    return {
      ok: false as const,
      status: 409,
      error: "The invitation was sent, but the role could not be assigned. Add the account using the existing-account form after it appears in Supabase.",
    };
  }

  return { ok: true as const, email: parsed.data.email, role: parsed.data.role };
}
