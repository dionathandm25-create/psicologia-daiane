"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

type Pagamento = {
  id: number;
  nome: string;
  email: string;
  servico: string;
  valor: number | null;
  data: string;
  horario: string;
  payment_status: string | null;
  payment_id: string | null;
  preference_id: string | null;
  metodo_pagamento: string | null;
  paciente_id: number | null;
  created_at: string;
};

type ClienteFinanceiro = {
  paciente_id: number | null;
  nome: string;
  email: string;
  total_recebido: number;
  total_pendente: number;
  total_cancelado_reembolsado: number;
  quantidade_pagamentos: number;
};

type FinanceiroResponse = {
  resumo: {
    total_recebido: number;
    total_pendente: number;
    total_cancelado_reembolsado: number;
    quantidade_recebidos: number;
    quantidade_pendentes: number;
    quantidade_cancelados_reembolsados: number;
    quantidade_total: number;
  };
  por_cliente: ClienteFinanceiro[];
  pagamentos: Pagamento[];
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  if (!data) return "-";

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function nomeStatus(status: string | null) {
  switch (status) {
    case "approved":
      return "Aprovado";

    case "pending":
      return "Pendente";

    case "in_process":
      return "Em processamento";

    case "pendente":
      return "Pendente";

    case "cancelled":
    case "canceled":
      return "Cancelado";

    case "refunded":
      return "Reembolsado";

    case "charged_back":
      return "Estornado";

    default:
      return status || "Não informado";
  }
}

function classeStatus(status: string | null) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";

    case "pending":
    case "in_process":
    case "pendente":
      return "bg-amber-100 text-amber-700";

    case "cancelled":
    case "canceled":
    case "refunded":
    case "charged_back":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function FinanceiroPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [carregandoFinanceiro, setCarregandoFinanceiro] =
    useState(false);

  const [logado, setLogado] = useState(false);
  const [email, setEmail] = useState("");

  const [erro, setErro] = useState("");

  const [dados, setDados] =
    useState<FinanceiroResponse | null>(null);

  const [filtroStatus, setFiltroStatus] =
    useState("todos");

  const [busca, setBusca] = useState("");

  async function carregarFinanceiro() {
    try {
      setCarregandoFinanceiro(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/financeiro",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado?.error ||
            "Não foi possível carregar o financeiro."
        );
      }

      setDados(resultado);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar os dados financeiros."
      );
    } finally {
      setCarregandoFinanceiro(false);
    }
  }

  useEffect(() => {
    async function verificarAcesso() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (
          !user ||
          user.email?.toLowerCase() !== EMAIL_ADMIN
        ) {
          window.location.href = "/admin";
          return;
        }

        setEmail(user.email);
        setLogado(true);

        await carregarFinanceiro();
      } catch (error) {
        console.error(error);

        setErro(
          "Não foi possível verificar seu acesso."
        );
      } finally {
        setLoading(false);
      }
    }

    verificarAcesso();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  const pagamentosFiltrados = useMemo(() => {
    if (!dados) return [];

    return dados.pagamentos.filter((item) => {
      const correspondeStatus =
        filtroStatus === "todos" ||
        item.payment_status === filtroStatus;

      const textoBusca = busca
        .trim()
        .toLowerCase();

      const correspondeBusca =
        !textoBusca ||
        item.nome?.toLowerCase().includes(textoBusca) ||
        item.email?.toLowerCase().includes(textoBusca) ||
        item.servico?.toLowerCase().includes(textoBusca) ||
        item.payment_id
          ?.toLowerCase()
          .includes(textoBusca);

      return correspondeStatus && correspondeBusca;
    });
  }, [dados, filtroStatus, busca]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-10 sm:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="w-full rounded-3xl border border-pink-100 bg-white/95 p-10 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-pink-50">
              <img
                src="/logo-daiane.png"
                alt="Dra. Daiane"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <p className="mt-5 text-lg font-semibold text-slate-800">
              Carregando financeiro...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Aguarde enquanto verificamos seu acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!logado) {
    return null;
  }

  const resumo = dados?.resumo;

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-pink-100 bg-white/95 shadow-lg backdrop-blur-sm lg:flex">
        <div className="flex h-full w-full flex-col">
          <div className="border-b border-pink-100 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-pink-50">
                <img
                  src="/logo-daiane.png"
                  alt="Dra. Daiane Damasceno"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">
                  Dra. Daiane
                </p>

                <p className="truncate text-xs text-slate-500">
                  Painel administrativo
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400">
              Principal
            </p>

            <div className="space-y-1">
              <a
                href="/admin"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-xs">
                  ⌂
                </span>

                <span>Início</span>
              </a>

              <a
                href="/admin#agenda"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-xs">
                  ▣
                </span>

                <span>Agenda</span>
              </a>

              <a
                href="/admin/pacientes"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-xs">
                  ♙
                </span>

                <span>Pacientes</span>
              </a>

              <a
                href="/admin/pacientes"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-xs">
                  ▤
                </span>

                <span>Prontuários</span>
              </a>

              <a
                href="/admin/financeiro"
                className="flex w-full items-center gap-3 rounded-xl bg-pink-100 px-4 py-3 text-sm font-semibold text-pink-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs shadow-sm">
                  R$
                </span>

                <span>Financeiro</span>
              </a>
            </div>

            <p className="px-3 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400">
              Sistema
            </p>

            <button
              type="button"
              onClick={() =>
                alert(
                  "A área de configurações será criada na próxima etapa."
                )
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-xs">
                ⚙
              </span>

              <span>Configurações</span>
            </button>
          </nav>

          <div className="border-t border-pink-100 p-4">
            <div className="mb-3 rounded-2xl bg-pink-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                Administrador
              </p>

              <p className="mt-1 truncate text-xs text-slate-600">
                {email}
              </p>
            </div>

            <button
              type="button"
              onClick={sair}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <span>↪</span>
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="border-b border-pink-100 bg-white/95 shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-pink-50">
              <img
                src="/logo-daiane.png"
                alt="Dra. Daiane"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                Dra. Daiane
              </p>

              <p className="truncate text-xs text-slate-500">
                Financeiro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = "/admin")}
            className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700"
          >
            Painel
          </button>
        </div>
      </div>

      <main className="min-w-0 lg:ml-64">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
                Gestão financeira
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Financeiro
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Acompanhe os valores recebidos, pendentes e
                cancelados.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <div className="rounded-2xl border border-pink-100 bg-white/95 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                  Administrador
                </p>

                <p className="mt-1 max-w-[260px] truncate text-sm font-semibold text-slate-700">
                  {email}
                </p>
              </div>

              <button
                type="button"
                onClick={carregarFinanceiro}
                disabled={carregandoFinanceiro}
                className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregandoFinanceiro
                  ? "Atualizando..."
                  : "Atualizar dados"}
              </button>
            </div>
          </header>

          {erro && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
              {erro}
            </div>
          )}

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-green-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-slate-500">
                Total recebido
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {formatarMoeda(
                  resumo?.total_recebido ?? 0
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {resumo?.quantidade_recebidos ?? 0} pagamento(s)
                aprovado(s)
              </p>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-slate-500">
                Total pendente
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {formatarMoeda(
                  resumo?.total_pendente ?? 0
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {resumo?.quantidade_pendentes ?? 0} pagamento(s)
                pendente(s)
              </p>
            </div>

            <div className="rounded-3xl border border-red-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-slate-500">
                Cancelado / reembolsado
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {formatarMoeda(
                  resumo?.total_cancelado_reembolsado ?? 0
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {resumo?.quantidade_cancelados_reembolsados ??
                  0}{" "}
                registro(s)
              </p>
            </div>

            <div className="rounded-3xl border border-pink-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-slate-500">
                Movimentações
              </p>

              <p className="mt-2 text-3xl font-bold text-pink-600">
                {resumo?.quantidade_total ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Registros financeiros
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-pink-100 bg-white/95 shadow-sm">
            <div className="border-b border-pink-100 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
                Clientes
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Resumo por cliente
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Veja quanto cada cliente movimentou no sistema.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4 font-bold">
                      Cliente
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Recebido
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Pendente
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Cancelado
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Pagamentos
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(dados?.por_cliente ?? []).map(
                    (cliente, index) => (
                      <tr
                        key={`${cliente.email}-${index}`}
                        className="transition hover:bg-pink-50/30"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">
                            {cliente.nome || "Cliente"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {cliente.email}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          {formatarMoeda(
                            cliente.total_recebido
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-amber-600">
                          {formatarMoeda(
                            cliente.total_pendente
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-red-600">
                          {formatarMoeda(
                            cliente.total_cancelado_reembolsado
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {cliente.quantidade_pagamentos}
                          </span>
                        </td>
                      </tr>
                    )
                  )}

                  {(dados?.por_cliente ?? []).length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center"
                      >
                        <p className="font-semibold text-slate-600">
                          Nenhum registro financeiro encontrado.
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Os dados aparecerão aqui quando houver
                          agendamentos.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-3xl border border-pink-100 bg-white/95 shadow-sm">
            <div className="border-b border-pink-100 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
                    Movimentações
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Pagamentos
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Detalhamento dos agendamentos e pagamentos.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) =>
                      setBusca(e.target.value)
                    }
                    placeholder="Buscar cliente, serviço ou ID..."
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  />

                  <select
                    value={filtroStatus}
                    onChange={(e) =>
                      setFiltroStatus(e.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  >
                    <option value="todos">
                      Todos os status
                    </option>

                    <option value="approved">
                      Aprovados
                    </option>

                    <option value="pending">
                      Pendentes
                    </option>

                    <option value="in_process">
                      Em processamento
                    </option>

                    <option value="cancelled">
                      Cancelados
                    </option>

                    <option value="refunded">
                      Reembolsados
                    </option>

                    <option value="charged_back">
                      Estornados
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4 font-bold">
                      Cliente
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Serviço
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Data
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Valor
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Status
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Método
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Mercado Pago
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pagamentosFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-pink-50/30"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">
                          {item.nome}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.email}
                        </p>
                      </td>

                      <td className="max-w-[250px] px-6 py-4">
                        <p className="text-sm text-slate-700">
                          {item.servico}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {formatarData(item.data)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.horario}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {formatarMoeda(
                          Number(item.valor ?? 0)
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${classeStatus(
                            item.payment_status
                          )}`}
                        >
                          {nomeStatus(
                            item.payment_status
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.metodo_pagamento || "-"}
                      </td>

                      <td className="px-6 py-4">
                        {item.payment_id ? (
                          <div>
                            <p className="text-xs font-bold text-slate-600">
                              ID
                            </p>

                            <p className="mt-1 max-w-[180px] truncate font-mono text-xs text-slate-500">
                              {item.payment_id}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Ainda não pago
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {pagamentosFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center"
                      >
                        <p className="font-semibold text-slate-600">
                          Nenhum pagamento encontrado.
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Tente alterar os filtros ou aguarde
                          novos pagamentos.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-400">
                Exibindo {pagamentosFiltrados.length} de{" "}
                {dados?.pagamentos.length ?? 0} registro(s).
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">
                !
              </div>

              <div>
                <p className="font-bold text-amber-900">
                  Privacidade e segurança
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Esta área contém informações financeiras de
                  pacientes. O acesso é restrito ao administrador
                  autorizado.
                </p>
              </div>
            </div>
          </section>

          <footer className="py-8 text-center text-xs text-slate-400">
            Painel administrativo • Dra. Daiane Damasceno
          </footer>
        </div>
      </main>
    </div>
  );
}
