"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton() {
  async function handleLogin() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={handleLogin}
      className="rounded-2xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700"
    >
      Entrar com Google
    </button>
  );
}
