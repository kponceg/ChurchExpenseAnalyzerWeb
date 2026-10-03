import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listActiveFundOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("funds").select("id, name").eq("active", true).order("name");
  if (error) return { ok: false as const, error: "Transaction funds could not be loaded." };
  return { ok: true as const, funds: data ?? [] };
}
