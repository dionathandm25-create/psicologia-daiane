"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Paciente = {
  id: number;
  nome: string;
  nome_social: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  foto_url: string | null;
};

type Agendamento = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  servico: string;
  data: string;
  horario: string;
  created_at: string;
  payment_status: string | null;
  atendimento_status: string | null;
  paciente_id: number;
};

export default function PacientePage() {
  const router = useRouter();

  const [paciente, setPaciente] =
    useState<Paciente | null>(null);

  const [agendamentos, setAgendamentos] =
    useState<Agendamento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoAgendamentos, setCarregandoAgendamentos] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [erroAgendamentos, setErroAgendamentos] =
    useState("");

  useEffect(() => {
    async function carregarPaciente() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const resposta = await fetch(
          "/api/paciente/me",
          {
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(
            dados.error ||
              "Não foi possível carregar seus dados."
          );
          return;
        }

        setPaciente(dados.paciente);

        setCarregandoAgendamentos(true);

        const respostaAgendamentos = await fetch(
          "/api/paciente/agendamentos",
          {
            cache: "no-store",
          }
        );

        const dadosAgendamentos =
          await respostaAgendamentos.json();

        if (!respostaAgendamentos.ok) {
          setErroAgendamentos(
            dadosAgendamentos.error ||
              "Não foi possível carregar seus agendamentos."
          );
        } else {
          setAgendamentos(
            dadosAgendamentos.agendamentos || []
          );
        }
      } catch (error) {
        console.error(
          "ERRO AO CARREGAR ÁREA DO PACIENTE:",
          error
        );

        setErro(
          "Não foi possível carregar sua área de paciente."
        );
      } finally {
        setCarregandoAgendamentos(false);
        setCarregando(false);
      }
    }

    carregarPaciente();
  }, [router]);

  async function sair() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
  }

  function formatarData(data: string) {
    if (!data) return "Data não informada";

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;
  }

  function formatarPagamento(status: string | null) {
    switch (status) {
      case "approved":
        return {
          texto: "Pagamento aprovado",
          classe:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

      case "pending":
      case "pendente":
        return {
          texto: "Pagamento pendente",
          classe:
            "bg-amber-50 text-amber-700 border-amber-200",
        };

      case "rejected":
      case "cancelled":
      case "cancelado":
        return {
          texto: "Pagamento não aprovado",
          classe:
            "bg-red-50 text-red-700 border-red-200",
        };

      default:
        return {
          texto: "Pagamento não informado",
          classe:
            "bg-slate-50 text-slate-600 border-slate-200",
        };
    }
  }

  function formatarAtendimento(status: string | null) {
    switch (status) {
      case "aguardando":
      case null:
        return {
          texto: "Aguardando atendimento",
          classe:
            "bg-blue-50 text-blue-700 border-blue-200",
        };

      case "em_andamento":
      case "em andamento":
        return {
          texto: "Atendimento em andamento",
          classe:
            "bg-amber-50 text-amber-700 border-amber-200",
        };

      case "finalizado":
      case "concluido":
      case "concluído":
        return {
          texto: "Atendimento finalizado",
          classe:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

      default:
        return {
          texto: status,
          classe:
            "bg-slate-50 text-slate-600 border-slate-200",
        };
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen px-6 py-16">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-center text-slate-600">
            Carregando sua área...
          </p>
        </section>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen px-6 py-16">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800">
            Área do paciente
          </h1>

          <p className="mt-4 text-red-600">
            {erro}
          </p>

          <button
            onClick={sair}
            className="mt-6 rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Sair
          </button>
        </section>
      </main>
    );
  }

  if (!paciente) {
    return null;
  }

  const nomeExibicao =
    paciente.nome_social?.trim() ||
    paciente.nome;

  return (
    <main className="min-h-screen bg-transparent px-6 py-10">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
                Área do paciente
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                Olá, {nomeExibicao}
              </h1>

              <p className="mt-2 text-slate-600">
                Aqui você pode acompanhar seus agendamentos
                e informações de atendimento.
              </p>
            </div>

            <button
              onClick={sair}
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Nome
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {nomeExibicao}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                E-mail
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {paciente.email || "Não informado"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Telefone
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {paciente.telefone || "Não informado"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                WhatsApp
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {paciente.whatsapp || "Não informado"}
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
                  Minhas consultas
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-800">
                  Seus agendamentos
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                {agendamentos.length} consulta
                {agendamentos.length === 1 ? "" : "s"}
              </p>
            </div>

            {carregandoAgendamentos && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                <p className="text-slate-600">
                  Carregando seus agendamentos...
                </p>
              </div>
            )}

            {!carregandoAgendamentos &&
              erroAgendamentos && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-medium text-red-700">
                    {erroAgendamentos}
                  </p>
                </div>
              )}

            {!carregandoAgendamentos &&
              !erroAgendamentos &&
              agendamentos.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Nenhuma consulta encontrada
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Quando você realizar um agendamento,
                    ele aparecerá aqui.
                  </p>

                  <button
                    onClick={() => router.push("/agendar")}
                    className="mt-5 rounded-2xl bg-pink-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-pink-700"
                  >
                    Agendar consulta
                  </button>
                </div>
              )}

            {!carregandoAgendamentos &&
              !erroAgendamentos &&
              agendamentos.length > 0 && (
                <div className="mt-6 space-y-4">
                  {agendamentos.map((agendamento) => {
                    const pagamento =
                      formatarPagamento(
                        agendamento.payment_status
                      );

                    const atendimento =
                      formatarAtendimento(
                        agendamento.atendimento_status
                      );

                    return (
                      <article
                        key={agendamento.id}
                        className="rounded-2xl border border-pink-100 bg-slate-50 p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                                Consulta
                              </p>

                              <h3 className="mt-1 text-xl font-bold text-slate-800">
                                {agendamento.servico}
                              </h3>
                            </div>

                            <div className="rounded-xl bg-white px-4 py-3 text-left shadow-sm sm:text-right">
                              <p className="text-xs text-slate-500">
                                Data e horário
                              </p>

                              <p className="mt-1 font-bold text-slate-800">
                                {formatarData(
                                  agendamento.data
                                )}
                              </p>

                              <p className="text-sm font-semibold text-pink-600">
                                {agendamento.horario}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${pagamento.classe}`}
                            >
                              {pagamento.texto}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${atendimento.classe}`}
                            >
                              {atendimento.texto}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
      </section>
    </main>
  );
}
