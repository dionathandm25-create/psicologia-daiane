"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { getAuthenticatedPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";

type Feedback = {
  tipo: "erro" | "sucesso";
  mensagem: string;
};

const MENSAGENS_LOGIN: Record<string, string> = {
  login: "Não foi possível concluir o login. Tente novamente.",
  email: "A conta não retornou um endereço de e-mail válido.",
  paciente:
    "Não foi possível preparar seu acesso à área do paciente. Entre em contato com a equipe.",
  vinculo:
    "Não foi possível vincular seu acesso ao cadastro. Entre em contato com a equipe.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const erro = new URLSearchParams(window.location.search).get("erro");
    const mensagem = erro ? MENSAGENS_LOGIN[erro] : undefined;

    if (mensagem) {
      setFeedback({ tipo: "erro", mensagem });
    }
  }, []);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCarregando(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        console.error("Erro ao entrar com e-mail e senha:", error);
        setFeedback({
          tipo: "erro",
          mensagem:
            error.status === 400
              ? "E-mail ou senha incorretos."
              : "Não foi possível entrar. Tente novamente.",
        });
        return;
      }

      if (!data.user) {
        setFeedback({
          tipo: "erro",
          mensagem: "Não foi possível confirmar sua conta.",
        });
        return;
      }

      const requestedPath = new URLSearchParams(
        window.location.search
      ).get("next");
      window.location.assign(
        getAuthenticatedPath(data.user.email, requestedPath)
      );
    } catch (error) {
      console.error("Falha inesperada ao entrar:", error);
      setFeedback({
        tipo: "erro",
        mensagem: "Ocorreu um erro ao entrar. Tente novamente.",
      });
    } finally {
      setCarregando(false);
    }
  }

  async function recuperarSenha() {
    if (!email.trim()) {
      setFeedback({
        tipo: "erro",
        mensagem: "Informe seu e-mail para receber o link de recuperação.",
      });
      return;
    }

    setRecuperandoSenha(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (error) {
        console.error("Erro ao solicitar recuperação de senha:", error);
        setFeedback({
          tipo: "erro",
          mensagem:
            "Não foi possível enviar o link. Verifique o e-mail e tente novamente.",
        });
        return;
      }

      setFeedback({
        tipo: "sucesso",
        mensagem:
          "Se houver uma conta para este e-mail, você receberá as instruções de recuperação.",
      });
    } catch (error) {
      console.error("Falha ao solicitar recuperação de senha:", error);
      setFeedback({
        tipo: "erro",
        mensagem: "Ocorreu um erro ao solicitar o link de recuperação.",
      });
    } finally {
      setRecuperandoSenha(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-transparent px-4 py-12 sm:px-6">
      <section className="w-full max-w-lg rounded-3xl border border-[#BD6F0A]/30 bg-[#fffaf3]/95 p-6 shadow-[0_20px_60px_rgba(100,2,25,0.18)] backdrop-blur-sm sm:p-10">
        <div className="text-center">
          <Image
            src="/images/transformacao-saude/logo/simbolo-integrado.png"
            alt="Logomarca Transformação Saúde"
            width={76}
            height={76}
            className="mx-auto h-16 w-16 object-contain sm:h-[76px] sm:w-[76px]"
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#BD6F0A]">
            Dra. Daiane Damasceno
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#640219] sm:text-4xl">
            Acesse sua conta
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#451326]/75">
            Entre para acessar o ambiente seguro da Transformação Saúde.
          </p>
        </div>

        <form onSubmit={entrar} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[#451326]"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#640219]/20 bg-white px-4 py-3 text-[#451326] outline-none transition focus:border-[#BD6F0A] focus:ring-2 focus:ring-[#BD6F0A]/20"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-semibold text-[#451326]"
            >
              Senha
            </label>
            <div className="flex rounded-xl border border-[#640219]/20 bg-white focus-within:border-[#BD6F0A] focus-within:ring-2 focus-within:ring-[#BD6F0A]/20">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3 text-[#451326] outline-none"
              />
              <button
                type="button"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                onClick={() => setMostrarSenha((mostrar) => !mostrar)}
                className="rounded-r-xl px-4 text-sm font-semibold text-[#640219] hover:text-[#BD6F0A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#BD6F0A]"
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={`rounded-xl px-4 py-3 text-sm ${
                feedback.tipo === "erro"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {feedback.mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || recuperandoSenha}
            className="brand-action w-full rounded-xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
          <button
            type="button"
            disabled={carregando || recuperandoSenha}
            onClick={recuperarSenha}
            className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-[#640219] underline decoration-[#BD6F0A]/60 underline-offset-4 hover:text-[#BD6F0A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {recuperandoSenha ? "Enviando instruções..." : "Esqueci minha senha"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-[#451326]/50">
          <span className="h-px flex-1 bg-[#BD6F0A]/25" />
          ou
          <span className="h-px flex-1 bg-[#BD6F0A]/25" />
        </div>

        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>

        <div className="mt-7 space-y-3 text-center text-sm text-[#451326]/75">
          <p>
            Ainda não possui cadastro?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-[#640219] underline decoration-[#BD6F0A]/60 underline-offset-4 hover:text-[#BD6F0A]"
            >
              Criar cadastro
            </Link>
          </p>
          <p>
            <Link
              href="/servicos"
              className="font-semibold text-[#640219] hover:text-[#BD6F0A]"
            >
              Conheça os serviços
            </Link>
            {" · "}
            <Link
              href="/agendar"
              className="font-semibold text-[#640219] hover:text-[#BD6F0A]"
            >
              Agendar consulta
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
