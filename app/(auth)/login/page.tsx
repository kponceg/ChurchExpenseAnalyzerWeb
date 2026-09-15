import { Suspense } from "react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Church Finance</p>
        <h1>Sign in</h1>
        <p className="lede">Use your authorized church account to continue.</p>
        <Suspense fallback={<p className="message">Loading sign-in…</p>}><LoginForm /></Suspense>
      </section>
    </main>
  );
}
