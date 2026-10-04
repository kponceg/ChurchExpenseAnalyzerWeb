import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OrganizationRole = "administrator" | "treasurer" | "data_entry" | "approver" | "viewer";

export type OrganizationMember = {
  userId: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
  isCurrentUser: boolean;
  active: boolean;
  deactivatedAt: string | null;
};

export async function getOrganizationMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_organization_members");
  if (error || !data) return { ok: false as const, error: "Organization members could not be loaded." };
  const rows = data as Array<{ user_id: string; email: string; role: OrganizationRole; joined_at: string; organization_id: string; organization_name: string; is_current_user: boolean; can_manage: boolean; active: boolean; deactivated_at: string | null }>;
  return {
    ok: true as const,
    organization: { id: rows[0]?.organization_id ?? "", name: rows[0]?.organization_name ?? "", canManage: rows[0]?.can_manage ?? false },
    members: rows.map((row) => ({ userId: row.user_id, email: row.email, role: row.role, joinedAt: row.joined_at, isCurrentUser: row.is_current_user, active: row.active, deactivatedAt: row.deactivated_at } satisfies OrganizationMember)),
  };
}
