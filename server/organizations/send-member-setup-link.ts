import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizationMembers } from "@/server/organizations/get-organization-members";

export async function sendMemberSetupLink(memberId: string) {
  const parsedId = z.string().uuid().safeParse(memberId);
  if (!parsedId.success) return { ok: false as const, status: 400, error: "Select a valid organization member." };

  const membership = await getOrganizationMembers();
  if (!membership.ok) return { ok: false as const, status: 401, error: membership.error };
  if (!membership.organization.canManage) return { ok: false as const, status: 403, error: "Only administrators can send setup links." };
  const member = membership.members.find((candidate) => candidate.userId === parsedId.data);
  if (!member) return { ok: false as const, status: 404, error: "That account is not a member of this organization." };

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
  try { admin = createAdminClient(); }
  catch (error) { return { ok: false as const, status: 503, error: error instanceof Error ? error.message : "Setup emails are not configured." }; }

  const { error } = await admin.auth.resetPasswordForEmail(member.email, { redirectTo });
  if (error) return { ok: false as const, status: error.status === 429 ? 429 : 400, error: error.message };
  return { ok: true as const, email: member.email };
}
