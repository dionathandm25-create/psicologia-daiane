"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton() {
  const [erro, setErro] = useState("");

  async function handleLogin() {
    setErro("");

    try {
      const supabase = createClient();
      const callbackUrl = new URL(
        "/auth/callback",
        window.location.origin
      );
      const next = new URLSearchParams(window.location.search).get("next");

      if (next) {
        callbackUrl.searchParams.set("next", next);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        console.error("Erro ao iniciar login com Google:", error);
        setErro("Não foi possível iniciar o login com Google.");
      }
    } catch (error) {
      console.error("Falha ao iniciar login com Google:", error);
      setErro("Ocorreu um erro ao iniciar o login com Google.");
    }
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={handleLogin}
        className="rounded-2xl border border-[#640219]/20 bg-white px-6 py-3 font-semibold text-[#640219] shadow-sm transition hover:border-[#BD6F0A] hover:bg-[#fffaf3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BD6F0A]"
      >
        Entrar com Google
      </button>
      {erro && (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
