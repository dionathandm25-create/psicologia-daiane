"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Registro = {
  id: number;
  created_at: string;
  atendimento_id: number;
  tipo: string;
  conteudo: string;
};

type Agendamento = {
  id: number;
  created_at: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  servico: string;
  data: string;
  horario: string;
  payment_status: string | null;
  payment_id: string | null;
  preference_id: string | null;
  metodo_pagamento: string | null;
  atendimento_status: string;
  atendimento_inicio: string | null;
  atendimento_fim: string | null;
  paciente_id: number | null;
  registros: Registro[];
};

type Paciente = {
  id: number;
  created_at: string;
  nome: string;
  nome_social: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  email: string | null;
  email_verificado: boolean;
  telefone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  foto_url: string | null;
  status: string;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  tipo_documento: string | null;
  documento_numero: string | null;
  identidade_verificada: boolean;
  identidade_verificada_em: string | null;
  usuario_id: string | null;
  ultimo_acesso: string | null;
};

const EMAIL_ADMIN =
  "contatocomercial.dionathandev@gmail.com";

function formatarData(data: string | null) {
  if (!data) return "Não informado";

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(data: string | null) {
  if (!data) return "Não informado";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return dataObj.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function nomeTipoRegistro(tipo: string) {
  const nomes: Record<string, string> = {
    anotacao: "Anotação",
    informacao_extra: "Informação adicional",
    observacao: "Observação",
    evolucao: "Evolução",
    orientacao: "Orientação",
    outro: "Outro",
  };

  return nomes[tipo] || tipo;
}

function formatarStatusAtendimento(status: string) {
  const nomes: Record<string, string> = {
    aguardando: "Aguardando",
    em_andamento: "Em andamento",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };

  return nomes[status] || status;
}

function corStatusAtendimento(status: string) {
  if (status === "finalizado") {
    return "bg-green-100 text-green-700";
  }

  if (status === "em_andamento") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "cancelado") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default function HistoricoPacientePage() {
  const router = useRouter();
  const params = useParams();

  const pacienteId = params?.id;

  const [loading, setLoading] = useState(true);
  const [logado, setLogado] = useState(false);

  const [emailUsuario, setEmailUsuario] =
    useState("");

  const [paciente, setPaciente] =
    useState<Paciente | null>(null);

  const [historico, setHistorico] =
    useState<Agendamento[]>([]);

  const [erro, setErro] = useState("");

  async function carregarHistorico() {
    try {
      setErro("");

      const resposta = await fetch(
        `/api/pacientes/${pacienteId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível carregar o histórico."
        );
      }

      setPaciente(dados.paciente);
      setHistorico(dados.historico || []);
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR HISTÓRICO:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o histórico."
      );
    }
  }

  useEffect(() => {
    async function iniciar() {
      try {
        const supabase = createClient();

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "ERRO AO VERIFICAR SESSÃO:",
            sessionError
          );

          setErro(
            "Não foi possível verificar sua sessão."
          );

          setLoading(false);
          return;
        }

        if (!session) {
          setLogado(false);
          setLoading(false);
          return;
        }

        const email =
          session.user.email?.toLowerCase();

        if (email !== EMAIL_ADMIN) {
          await supabase.auth.signOut();

          setErro(
            "Esta conta não possui acesso ao painel administrativo."
          );

          setLogado(false);
          setLoading(false);
          return;
        }

        setLogado(true);
        setEmailUsuario(
          session.user.email || ""
        );

        await carregarHistorico();

        setLoading(false);
      } catch (error) {
        console.error(
          "ERRO AO INICIAR HISTÓRICO:",
          error
        );

        setErro(
          "Ocorreu um erro ao carregar a página."
        );

        setLoading(false);
      }
    }

    if (pacienteId) {
      iniciar();
    }
  }, [pacienteId]);

  async function sair() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/admin";
  }

  function abrirAtendimento(id: number) {
    router.push(`/atendimento/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <p className="text-slate-700">
            Carregando prontuário...
          </p>
        </div>
      </div>
    );
  }

  if (!logado) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <h1 className="text-3xl font-bold text-slate-800">
            Acesso restrito
          </h1>

          <p className="mt-4 text-slate-600">
            Esta área é exclusiva para o administrador.
          </p>

          {erro && (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
              {erro}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              (window.location.href = "/admin")
            }
            className="mt-8 rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <h1 className="text-2xl font-bold text-slate-800">
            Paciente não encontrado
          </h1>

          <p className="mt-3 text-slate-600">
            Não foi possível localizar este paciente.
          </p>

          {erro && (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
              {erro}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              router.push("/admin/pacientes")
            }
            className="mt-8 rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Voltar para pacientes
          </button>
        </div>
      </div>
    );
  }

  const totalConsultas = historico.length;

  const totalRegistros = historico.reduce(
    (total, consulta) =>
      total + consulta.registros.length,
    0
  );

  const consultasFinalizadas =
    historico.filter(
      (consulta) =>
        consulta.atendimento_status ===
        "finalizado"
    ).length;

  return (
    <div className="min-h-screen bg-transparent px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white/90 p-8 shadow-md">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Prontuário do paciente
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                {paciente.nome}
              </h1>

              {paciente.nome_social && (
                <p className="mt-1 text-slate-500">
                  Nome social: {paciente.nome_social}
                </p>
              )}

              <p className="mt-2 text-sm text-slate-500">
                Administrador: {emailUsuario}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/admin/pacientes")
                }
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Voltar para pacientes
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/admin")
                }
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Painel
              </button>

              <button
                type="button"
                onClick={sair}
                className="rounded-2xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700"
              >
                Sair
              </button>
            </div>
          </div>

          {erro && (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
              {erro}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white/90 p-6 shadow-md">
              <div className="flex flex-col items-center text-center">
                {paciente.foto_url ? (
                  <img
                    src={paciente.foto_url}
                    alt={`Foto de ${paciente.nome}`}
                    className="h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-200 text-4xl font-bold text-slate-600">
                    {paciente.nome
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <h2 className="mt-4 text-xl font-bold text-slate-800">
                  {paciente.nome}
                </h2>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    paciente.status === "ativo"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {paciente.status === "ativo"
                    ? "Paciente ativo"
                    : paciente.status}
                </span>

                {paciente.identidade_verificada && (
                  <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    Identidade verificada
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    E-mail
                  </p>

                  <p className="mt-1 break-words text-sm text-slate-700">
                    {paciente.email ||
                      "Não informado"}
                  </p>

                  {paciente.email_verificado && (
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      E-mail verificado
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Telefone
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {paciente.telefone ||
                      "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    WhatsApp
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {paciente.whatsapp ||
                      "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    CPF
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {paciente.cpf ||
                      "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data de nascimento
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatarData(
                      paciente.data_nascimento
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Sexo
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {paciente.sexo ||
                      "Não informado"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 p-6 shadow-md">
              <h2 className="text-lg font-bold text-slate-800">
                Endereço
              </h2>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p>
                  <strong>CEP:</strong>{" "}
                  {paciente.cep ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Endereço:</strong>{" "}
                  {paciente.endereco ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Número:</strong>{" "}
                  {paciente.numero ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Complemento:</strong>{" "}
                  {paciente.complemento ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Bairro:</strong>{" "}
                  {paciente.bairro ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Cidade:</strong>{" "}
                  {paciente.cidade ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Estado:</strong>{" "}
                  {paciente.estado ||
                    "Não informado"}
                </p>
              </div>
            </div>
          </aside>

          <main>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/90 p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Consultas
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {totalConsultas}
                </p>
              </div>

              <div className="rounded-3xl bg-white/90 p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Finalizadas
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {consultasFinalizadas}
                </p>
              </div>

              <div className="rounded-3xl bg-white/90 p-6 shadow-md">
                <p className="text-sm font-semibold text-slate-500">
                  Registros
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {totalRegistros}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-white/90 shadow-md">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Histórico de atendimentos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Histórico cronológico das consultas e registros do paciente.
                </p>
              </div>

              {historico.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    Nenhuma consulta encontrada.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Quando houver atendimentos vinculados,
                    eles aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  {historico.map(
                    (consulta, indice) => (
                      <section
                        key={consulta.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
                                Consulta #
                                {historico.length -
                                  indice}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${corStatusAtendimento(
                                  consulta.atendimento_status
                                )}`}
                              >
                                {formatarStatusAtendimento(
                                  consulta.atendimento_status
                                )}
                              </span>
                            </div>

                            <h3 className="mt-4 text-xl font-bold text-slate-800">
                              {consulta.servico}
                            </h3>

                            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                              <p>
                                <strong>
                                  Data:
                                </strong>{" "}
                                {formatarData(
                                  consulta.data
                                )}
                              </p>

                              <p>
                                <strong>
                                  Horário:
                                </strong>{" "}
                                {consulta.horario}
                              </p>

                              <p>
                                <strong>
                                  Início:
                                </strong>{" "}
                                {formatarDataHora(
                                  consulta.atendimento_inicio
                                )}
                              </p>

                              <p>
                                <strong>
                                  Fim:
                                </strong>{" "}
                                {formatarDataHora(
                                  consulta.atendimento_fim
                                )}
                              </p>

                              <p>
                                <strong>
                                  Pagamento:
                                </strong>{" "}
                                {consulta.payment_status ||
                                  "Pendente"}
                              </p>

                              <p>
                                <strong>
                                  Método:
                                </strong>{" "}
                                {consulta.metodo_pagamento ||
                                  "Não informado"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              abrirAtendimento(
                                consulta.id
                              )
                            }
                            className="rounded-2xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700"
                          >
                            Abrir atendimento
                          </button>
                        </div>

                        <div className="mt-6 border-t border-slate-200 pt-6">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-800">
                                Registros do atendimento
                              </h4>

                              <p className="mt-1 text-sm text-slate-500">
                                {consulta.registros.length}{" "}
                                registro
                                {consulta.registros.length ===
                                1
                                  ? ""
                                  : "s"}
                              </p>
                            </div>
                          </div>

                          {consulta.registros
                            .length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                              <p className="text-sm text-slate-500">
                                Nenhum registro neste atendimento.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-4">
                              {consulta.registros.map(
                                (registro) => (
                                  <article
                                    key={
                                      registro.id
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white p-5"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {nomeTipoRegistro(
                                          registro.tipo
                                        )}
                                      </span>

                                      <span className="text-xs text-slate-400">
                                        {formatarDataHora(
                                          registro.created_at
                                        )}
                                      </span>
                                    </div>

                                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                      {
                                        registro.conteudo
                                      }
                                    </p>
                                  </article>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </section>
                    )
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
