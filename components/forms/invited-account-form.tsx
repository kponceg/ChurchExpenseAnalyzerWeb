"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Labels = {
  email: string;
  send: string;
  sending: string;
  sent: string;
  error: string;
  rateLimited: string;
};

export function InvitedAccountForm({ labels }: { labels: Labels }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    const isRateLimited = error?.status === 429 || error?.code === "over_email_send_rate_limit";
    setMessage(error ? { type: "error", text: isRateLimited ? labels.rateLimited : labels.error } : { type: "success", text: labels.sent });
    setSubmitting(false);
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="invited-email">{labels.email}</label><input id="invited-email" name="email" type="email" autoComplete="email" required /></div>
    <button className="primary" disabled={submitting}>{submitting ? labels.sending : labels.send}</button>
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
  </form>;
}
