"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PatientPageHeader from "../_components/PatientPageHeader";
import usePatientPortalData from "../_components/usePatientPortalData";

export default function PerfilPacientePage() {
  const { paciente, carregandoPaciente, erroPaciente } =
    usePatientPortalData({ includeAppointments: false });
  const [solicitandoLink, setSolicitandoLink] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: "erro" | "sucesso";
    mensagem: string;
  } | null>(null);

  async function solicitarLinkSenha() {
    setFeedback(null);

    if (!paciente?.email) {
      setFeedback({
        tipo: "erro",
        mensagem: "Não há um e-mail cadastrado para enviar o link.",
      });
      return;
    }

    setSolicitandoLink(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        paciente.email.trim(),
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (error) {
        console.error("Erro ao solicitar redefinição de senha:", error);
        setFeedback({
          tipo: "erro",
          mensagem: "Não foi possível enviar o link. Tente novamente mais tarde.",
        });
        return;
      }

      setFeedback({
        tipo: "sucesso",
        mensagem:
          "Se o e-mail estiver habilitado para recuperação, você receberá as instruções.",
      });
    } catch (error) {
      console.error("Falha ao solicitar redefinição de senha:", error);
      setFeedback({
        tipo: "erro",
        mensagem: "Ocorreu um erro ao solicitar o link de recuperação.",
      });
    } finally {
      setSolicitandoLink(false);
    }
  }

  return (
    <main className="space-y-6">
      <PatientPageHeader
        section="Seus dados"
        title="Meu perfil"
        description="Dados exibidos conforme o cadastro vinculado à sua conta. A edição de dados pessoais ainda não está disponível."
      />

      {carregandoPaciente ? (
        <div role="status" className="rounded-3xl bg-white/85 p-6 text-sm text-[#71545a]">
          Carregando seu perfil...
        </div>
      ) : erroPaciente || !paciente ? (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {erroPaciente || "Não foi possível localizar seu cadastro."}
        </div>
      ) : (
        <>
          <section className="brand-card-grid grid gap-3 sm:grid-cols-2">
            {[
              ["Nome", paciente.nome_social?.trim() || paciente.nome],
              ["E-mail", paciente.email || "Não informado"],
              ["Telefone", paciente.telefone || "Não informado"],
              ["WhatsApp", paciente.whatsapp || "Não informado"],
            ].map(([label, value]) => (
              <article key={label} className="brand-card rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7169]">
                  {label}
                </p>
                <p className="mt-2 break-words font-semibold text-[#4c2630]">
                  {value}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-[#eadfd8] bg-white/90 p-6 shadow-[0_12px_34px_rgba(87,35,39,0.08)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
              Segurança da conta
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#572936]">
              Alteração de senha
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#81736d]">
              Enviaremos ao seu e-mail um link seguro para criar uma nova senha.
            </p>
            {!paciente.email && (
              <p className="mt-3 text-sm text-amber-800">
                Não há um e-mail cadastrado para enviar o link. Entre em contato
                com o suporte.
              </p>
            )}
            <button
              type="button"
              onClick={solicitarLinkSenha}
              disabled={solicitandoLink || !paciente.email}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9c7bc] bg-white px-4 py-2.5 text-sm font-semibold text-[#5b3038] transition hover:bg-[#faf7f4] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
            >
              {solicitandoLink ? "Enviando instruções..." : "Solicitar link de redefinição"}
            </button>
            {feedback && (
              <p
                role={feedback.tipo === "erro" ? "alert" : "status"}
                aria-live="polite"
                className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-5 ${
                  feedback.tipo === "erro"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {feedback.mensagem}
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
