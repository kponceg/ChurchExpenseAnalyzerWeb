import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FinancialFund = { id: string; name: string; active: boolean };

export async function listFinancialFunds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to view funds." };
  const { data: memberships, error: membershipError } = await supabase.from("organization_memberships").select("organization_id, role").eq("user_id", user.id).order("created_at").limit(1);
  const membership = memberships?.[0];
  if (membershipError || !membership) return { ok: false as const, error: "Organization access could not be loaded." };
  const { data, error } = await supabase.from("funds").select("id, name, active").eq("organization_id", membership.organization_id).order("name");
  if (error) return { ok: false as const, error: "Funds could not be loaded." };
  return { ok: true as const, funds: (data ?? []) as FinancialFund[], canManage: membership.role === "administrator" };
}
