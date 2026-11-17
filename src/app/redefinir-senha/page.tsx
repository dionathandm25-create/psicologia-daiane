"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [validando, setValidando] = useState(true);
  const [recuperacaoAtiva, setRecuperacaoAtiva] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [erro, setErro] = useState(false);
  const [senhaAtualizada, setSenhaAtualizada] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let ativo = true;

    async function verificarRecuperacao() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!ativo) return;

      if (authError && authError.name !== "AuthSessionMissingError") {
        console.error("Erro ao validar link de recuperação:", authError);
      }

      setRecuperacaoAtiva(Boolean(user));
      setValidando(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setRecuperacaoAtiva(true);
        setValidando(false);
      }
    });

    void verificarRecuperacao();

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function atualizarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setErro(false);

    if (senha.length < 8) {
      setErro(true);
      setFeedback("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setErro(true);
      setFeedback("As senhas informadas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: senha,
      });

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError);
        setErro(true);
        setFeedback(
          "Não foi possível atualizar a senha. Solicite um novo link e tente novamente."
        );
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "Erro ao encerrar sessão após atualizar senha:",
          signOutError
        );
        setErro(true);
        setFeedback(
          "A senha foi atualizada, mas não foi possível encerrar a sessão. Saia da conta antes de entrar novamente."
        );
        return;
      }

      setRecuperacaoAtiva(false);
      setSenhaAtualizada(true);
      setFeedback("Senha atualizada. Agora você pode entrar com a nova senha.");
    } catch (error) {
      console.error("Falha ao atualizar senha:", error);
      setErro(true);
      setFeedback("Ocorreu um erro ao atualizar a senha.");
    } finally {
      setCarregando(false);
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
          <h1 className="mt-2 text-3xl font-bold text-[#640219]">
            Redefinir senha
          </h1>
        </div>

        {validando ? (
          <p className="mt-6 text-center text-sm text-[#451326]/75">
            Validando o link de recuperação...
          </p>
        ) : recuperacaoAtiva ? (
          <form onSubmit={atualizarSenha} className="mt-8 space-y-5">
            <p className="text-sm leading-6 text-[#451326]/75">
              Escolha uma nova senha para acessar sua conta.
            </p>
            <div>
              <label
                htmlFor="nova-senha"
                className="mb-2 block text-sm font-semibold text-[#451326]"
              >
                Nova senha
              </label>
              <input
                id="nova-senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="w-full rounded-xl border border-[#640219]/20 bg-white px-4 py-3 text-[#451326] outline-none transition focus:border-[#BD6F0A] focus:ring-2 focus:ring-[#BD6F0A]/20"
              />
            </div>
            <div>
              <label
                htmlFor="confirmacao-senha"
                className="mb-2 block text-sm font-semibold text-[#451326]"
              >
                Confirmar nova senha
              </label>
              <input
                id="confirmacao-senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmacao}
                onChange={(event) => setConfirmacao(event.target.value)}
                className="w-full rounded-xl border border-[#640219]/20 bg-white px-4 py-3 text-[#451326] outline-none transition focus:border-[#BD6F0A] focus:ring-2 focus:ring-[#BD6F0A]/20"
              />
            </div>
            <button
              type="button"
              aria-pressed={mostrarSenha}
              onClick={() => setMostrarSenha((mostrar) => !mostrar)}
              className="text-sm font-semibold text-[#640219] underline underline-offset-4 hover:text-[#BD6F0A]"
            >
              {mostrarSenha ? "Ocultar senhas" : "Mostrar senhas"}
            </button>
            {feedback && (
              <p
                role="status"
                aria-live="polite"
                className={`rounded-xl px-4 py-3 text-sm ${
                  erro
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {feedback}
              </p>
            )}
            <button
              type="submit"
              disabled={carregando}
              className="brand-action w-full rounded-xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-sm leading-6 text-[#451326]/75">
              {senhaAtualizada
                ? "Sua senha foi atualizada. Entre novamente para acessar sua conta."
                : "Este link de recuperação é inválido ou expirou. Solicite um novo link para continuar."}
            </p>
            <Link
              href="/login"
              className="brand-action mt-6 inline-flex rounded-xl px-6 py-3 font-semibold"
            >
              {senhaAtualizada ? "Ir para o login" : "Voltar para o login"}
            </Link>
          </div>
        )}

        {!recuperacaoAtiva && feedback && (
          <p
            role="status"
            aria-live="polite"
            className={`mt-5 rounded-xl px-4 py-3 text-center text-sm ${
              erro
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {feedback}
          </p>
        )}
      </section>
    </div>
  );
}
