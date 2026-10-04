"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Labels = {
  password: string;
  confirmPassword: string;
  save: string;
  saving: string;
  mismatch: string;
  invalid: string;
  success: string;
};

export function InvitePasswordForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let finished = false;
    const markReady = () => { if (!finished) { setReady(true); setError(""); } };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (session) markReady(); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) markReady(); });
    const timeout = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session && !finished) setError(labels.invalid);
    }, 1500);
    return () => { finished = true; window.clearTimeout(timeout); listener.subscription.unsubscribe(); };
  }, [labels.invalid]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) return setError(labels.mismatch);

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="invite-password">{labels.password}</label><input id="invite-password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={!ready} /></div>
    <div className="field"><label htmlFor="invite-confirmation">{labels.confirmPassword}</label><input id="invite-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required disabled={!ready} /></div>
    <button className="primary" disabled={!ready || saving}>{saving ? labels.saving : labels.save}</button>
    {error && <p className="message error" role="alert">{error}</p>}
  </form>;
}
