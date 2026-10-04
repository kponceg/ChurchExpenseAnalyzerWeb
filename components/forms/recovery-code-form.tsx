"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Labels = { email: string; code: string; verify: string; verifying: string; invalid: string };

export function RecoveryCodeForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setVerifying(true); setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const token = String(form.get("token") ?? "").replace(/\s/g, "");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
    if (verifyError) { setError(labels.invalid); setVerifying(false); return; }
    router.replace("/auth/invite");
    router.refresh();
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="recovery-email">{labels.email}</label><input id="recovery-email" name="email" type="email" autoComplete="email" required /></div>
    <div className="field"><label htmlFor="recovery-code">{labels.code}</label><input id="recovery-code" name="token" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={8} required /></div>
    <button className="primary" disabled={verifying}>{verifying ? labels.verifying : labels.verify}</button>
    {error && <p className="message error" role="alert">{error}</p>}
  </form>;
}
