"use client";

import { useState } from "react";
type Labels = { email: string; send: string; sending: string; sent: string; rateLimited: string };

export function ForgotPasswordForm({ labels }: { labels: Labels }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const isRateLimited = response.status === 429;
    setMessage(isRateLimited ? labels.rateLimited : labels.sent);
    setSubmitting(false);
  }

  return <form className="auth-form" onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="recovery-email">{labels.email}</label><input id="recovery-email" name="email" type="email" autoComplete="email" required /></div>
    <button className="primary" disabled={submitting}>{submitting ? labels.sending : labels.send}</button>
    {message && <p className="message success" role="status">{message}</p>}
  </form>;
}
