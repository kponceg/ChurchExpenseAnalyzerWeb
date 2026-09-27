"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LoginLabels = { email: string; password: string; signIn: string; signingIn: string; error: string };

export function LoginForm({ labels }: { labels: LoginLabels }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(labels.error);
      setSubmitting(false);
      return;
    }

    const requestedPath = searchParams.get("next");
    const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard";
    router.replace(destination);
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">{labels.email}</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">{labels.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
      </div>
      {error && <p className="message error" role="alert">{error}</p>}
      <button className="primary" disabled={submitting}>{submitting ? labels.signingIn : labels.signIn}</button>
    </form>
  );
}
