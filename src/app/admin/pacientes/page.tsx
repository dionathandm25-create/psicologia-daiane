"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Paciente = {
  id: number;
  created_at: string;
  nome: string;
  nome_social: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  foto_url: string | null;
  status: string;
  quantidade_consultas: number;
  ultimo_atendimento: string | null;
};

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

function formatarData(data: string | null) {
  if (!data) return "Nenhum atendimento";

  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

export default function PacientesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [carregandoPacientes, setCarregandoPacientes] =
    useState(false);

  const [logado, setLogado] = useState(false);

  const [emailUsuario, setEmailUsuario] = useState("");

  const [pacientes, setPacientes] =
    useState<Paciente[]>([]);

  const [busca, setBusca] = useState("");

  const [erro, setErro] = useState("");

  async function carregarPacientes(
    termoBusca = ""
  ) {
    try {
      setCarregandoPacientes(true);
      setErro("");

      const resposta = await fetch(
        `/api/pacientes?busca=${encodeURIComponent(
          termoBusca
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível carregar os pacientes."
        );
      }

      setPacientes(dados.pacientes || []);
    } catch (error) {
      console.error(
        "ERRO AO CARREGAR PACIENTES:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os pacientes."
      );
    } finally {
      setCarregandoPacientes(false);
    }
  }

  useEffect(() => {
    async function verificarAcesso() {
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

        await carregarPacientes();

        setLoading(false);
      } catch (error) {
        console.error(
          "ERRO AO VERIFICAR ACESSO:",
          error
        );

        setErro(
          "Ocorreu um erro ao carregar a página."
        );

        setLoading(false);
      }
    }

    verificarAcesso();
  }, []);

  async function pesquisar() {
    await carregarPacientes(busca);
  }

  async function sair() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/admin";
  }

  function abrirHistorico(id: number) {
    router.push(`/admin/pacientes/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/90 p-8 text-center shadow-md">
          <p className="text-slate-700">
            Carregando pacientes...
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

  return (
    <div className="min-h-screen bg-transparent px-6 py-10">
      <div className="mx-auto max-w-7xl">
        {/* CABEÇALHO */}

        <div className="rounded-3xl bg-white/90 p-8 shadow-md">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Painel administrativo
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                Pacientes
              </h1>

              <p className="mt-2 text-slate-600">
                Administrador: {emailUsuario}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/admin")
                }
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Voltar ao painel
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

          {/* BUSCA */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label
              htmlFor="busca"
              className="block text-sm font-semibold text-slate-700"
            >
              Buscar paciente
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="busca"
                type="text"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    pesquisar();
                  }
                }}
                placeholder="Nome, e-mail ou CPF"
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-slate-500"
              />

              <button
                type="button"
                onClick={pesquisar}
                disabled={carregandoPacientes}
                className="rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregandoPacientes
                  ? "Buscando..."
                  : "Buscar"}
              </button>
            </div>
          </div>

          {erro && (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
              {erro}
            </div>
          )}
        </div>

        {/* RESUMO */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-white/90 p-6 shadow-md">
            <p className="text-sm font-semibold text-slate-500">
              Pacientes encontrados
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {pacientes.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-md">
            <p className="text-sm font-semibold text-slate-500">
              Pacientes ativos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {
                pacientes.filter(
                  (paciente) =>
                    paciente.status === "ativo"
                ).length
              }
            </p>
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-md">
            <p className="text-sm font-semibold text-slate-500">
              Consultas registradas
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {pacientes.reduce(
                (total, paciente) =>
                  total +
                  paciente.quantidade_consultas,
                0
              )}
            </p>
          </div>
        </div>

        {/* LISTA */}

        <div className="mt-6 overflow-hidden rounded-3xl bg-white/90 shadow-md">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-800">
              Lista de pacientes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecione um paciente para visualizar o histórico completo.
            </p>
          </div>

          {carregandoPacientes ? (
            <div className="p-10 text-center text-slate-500">
              Carregando...
            </div>
          ) : pacientes.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                Nenhum paciente encontrado.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Quando novos pacientes forem cadastrados,
                eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                    <th className="px-6 py-4">
                      Paciente
                    </th>

                    <th className="px-6 py-4">
                      Contato
                    </th>

                    <th className="px-6 py-4">
                      Consultas
                    </th>

                    <th className="px-6 py-4">
                      Último atendimento
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pacientes.map((paciente) => (
                    <tr
                      key={paciente.id}
                      className="border-b border-slate-100 text-slate-700 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {paciente.foto_url ? (
                            <img
                              src={paciente.foto_url}
                              alt={`Foto de ${paciente.nome}`}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                              {paciente.nome
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-800">
                              {paciente.nome}
                            </p>

                            {paciente.nome_social && (
                              <p className="text-sm text-slate-500">
                                {paciente.nome_social}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p>
                          {paciente.email ||
                            "Sem e-mail"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {paciente.whatsapp ||
                            paciente.telefone ||
                            "Sem telefone"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-semibold">
                          {paciente.quantidade_consultas}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {formatarData(
                          paciente.ultimo_atendimento
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            paciente.status ===
                            "ativo"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {paciente.status ===
                          "ativo"
                            ? "Ativo"
                            : paciente.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() =>
                            abrirHistorico(
                              paciente.id
                            )
                          }
                          className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700"
                        >
                          Ver histórico
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
