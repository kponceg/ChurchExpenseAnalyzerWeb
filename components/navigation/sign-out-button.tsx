"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ labels }: { labels: { signOut: string; signingOut: string } }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    setSubmitting(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <button className="sign-out" type="button" onClick={signOut} disabled={submitting}>{submitting ? labels.signingOut : labels.signOut}</button>;
}
