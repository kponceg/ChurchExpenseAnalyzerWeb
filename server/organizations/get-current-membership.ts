import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationRole } from "@/server/organizations/get-organization-members";

const transactionRoles: OrganizationRole[] = ["administrator", "treasurer", "data_entry"];
const voidRoles: OrganizationRole[] = ["administrator", "treasurer"];

export async function getCurrentMembership() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organization_memberships")
    .select("organization_id, role, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const role = data.role as OrganizationRole;
  return {
    organizationId: data.organization_id,
    role,
    canManage: role === "administrator",
    canRecordTransactions: transactionRoles.includes(role),
    canVoidTransactions: voidRoles.includes(role),
  };
}
