import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listActiveAccountOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("accounts").select("id, name").eq("active", true).order("name");
  if (error) return { ok: false as const, error: "Financial accounts could not be loaded." };
  return { ok: true as const, accounts: data ?? [] };
}
