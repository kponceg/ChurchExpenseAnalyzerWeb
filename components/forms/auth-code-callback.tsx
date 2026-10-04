"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthCodeCallback({ loading, invalid }: { loading: string; invalid: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = searchParams.get("code");
    const flowId = searchParams.get("sb_flow_id");
    const requestedPath = searchParams.get("next") ?? "/auth/invite";
    const next = requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/auth/invite";

    const supabase = createClient();
    async function verify() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        if (!sessionError) {
          router.replace(next);
          router.refresh();
          return;
        }
        setError(invalid);
        return;
      }
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
        if (!exchangeError) {
          router.replace(next);
          router.refresh();
          return;
        }
        setError(invalid);
        return;
      }
      const { data: existing } = await supabase.auth.getSession();
      if (!existing.session) return setError(invalid);
      router.replace(next);
      router.refresh();
    }
    void verify();
  }, [invalid, router, searchParams]);

  return <p className={`message ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{error || loading}</p>;
}
