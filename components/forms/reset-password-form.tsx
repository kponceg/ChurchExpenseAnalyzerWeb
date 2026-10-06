"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Labels = { password: string; confirmPassword: string; showPasswords: string; hidePasswords: string; save: string; saving: string; mismatch: string; invalid: string };

export function ResetPasswordForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");

  function togglePasswordVisibility() {
    setShowPasswords((current) => !current);
  }

  useEffect(() => {
    const supabase = createClient();
    let finished = false;
    const markReady = () => { if (!finished) { setReady(true); setError(""); } };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (session) markReady(); });
    async function establishSession() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const code = new URLSearchParams(window.location.search).get("code");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        window.history.replaceState(null, "", window.location.pathname);
        if (!sessionError) return markReady();
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", window.location.pathname);
        if (!exchangeError) return markReady();
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) markReady();
      else if (!finished) setError(labels.invalid);
    }
    void establishSession();
    return () => { finished = true; listener.subscription.unsubscribe(); };
  }, [labels.invalid]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) return setError(labels.mismatch);
    setSaving(true); setError("");
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setSaving(false); return; }
    router.replace("/dashboard");
    router.refresh();
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="reset-password">{labels.password}</label><input id="reset-password" name="password" type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} required disabled={!ready} /></div>
    <div className="field"><label htmlFor="reset-confirmation">{labels.confirmPassword}</label><input id="reset-confirmation" name="confirmation" type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} required disabled={!ready} /></div>
    <button className="password-visibility password-visibility-button" type="button" aria-pressed={showPasswords} onClick={togglePasswordVisibility} disabled={!ready}>{showPasswords ? labels.hidePasswords : labels.showPasswords}</button>
    <button className="primary" disabled={!ready || saving}>{saving ? labels.saving : labels.save}</button>
    {error && <p className="message error" role="alert">{error}</p>}
  </form>;
}
