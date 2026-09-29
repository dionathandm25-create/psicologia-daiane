"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

type Agendamento = {
id: number;
nome: string;
email: string;
telefone: string;
servico: string;
data: string;
horario: string;
created_at: string;
payment_status?: string;
atendimento_status?: string;
};

const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

export default function AdminPage() {
console.log("### ADMIN PAGE FOI CARREGADA ###");

const [loading, setLoading] = useState(true);
const [logado, setLogado] = useState(false);
const [email, setEmail] = useState("");
const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
const [erro, setErro] = useState("");
const [menuSiteAberto, setMenuSiteAberto] = useState(false);
const [agendaExpandida, setAgendaExpandida] = useState<number | null>(null);

async function carregarAgendamentos() {
const supabase = createClient();

const { data, error } = await supabase
  .from("agendamentos")
  .select("*")
  .order("data", { ascending: true })
  .order("horario", { ascending: true });

if (error) {
  console.error(
    "ERRO SUPABASE AO CARREGAR AGENDAMENTOS:",
    error
  );

  setErro(
    "Você entrou, mas não foi possível carregar os agendamentos."
  );

  return;
}

console.log("AGENDAMENTOS CARREGADOS:", data);

setAgendamentos(data || []);
setErro("");

}

useEffect(() => {
async function carregar() {
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

      setErro("Não foi possível verificar sua sessão.");
      setLoading(false);
      return;
    }

    if (!session) {
      console.log("NENHUMA SESSÃO ENCONTRADA.");

      setLoading(false);
      setLogado(false);
      return;
    }

    const emailUsuario = session.user.email?.toLowerCase();

    if (emailUsuario !== EMAIL_ADMIN) {
      console.log(
        "USUÁRIO SEM PERMISSÃO DE ADMIN:",
        emailUsuario
      );

      await supabase.auth.signOut();

      setErro(
        "Esta conta não possui acesso ao painel administrativo."
      );

      setLoading(false);
      setLogado(false);
      return;
    }

    console.log("ADMIN LOGADO:", session.user.email);

    setLogado(true);
    setEmail(session.user.email || "");

    await carregarAgendamentos();

    setLoading(false);
  } catch (error) {
    console.error("ERRO AO CARREGAR PAINEL:", error);

    setErro("Ocorreu um erro ao carregar o painel.");
    setLoading(false);
  }
}

carregar();

}, []);

async function sair() {
const supabase = createClient();

await supabase.auth.signOut();

window.location.reload();

}

async function cancelarAgendamento(id: number) {
const supabase = createClient();

const confirmar = window.confirm(
  "Deseja realmente cancelar esta consulta?"
);

if (!confirmar) return;

const { error } = await supabase
  .from("agendamentos")
  .delete()
  .eq("id", id);

if (error) {
  console.error("ERRO AO CANCELAR:", error);

  alert("Erro ao cancelar consulta.");

  return;
}

setAgendamentos((listaAtual) =>
  listaAtual.filter((item) => item.id !== id)
);

if (agendaExpandida === id) {
  setAgendaExpandida(null);
}

alert("Consulta cancelada com sucesso.");

}

function iniciarAtendimento(id: number) {
window.location.href = `/atendimento/${id}`;
}

function abrirPaginaSite(pagina: string) {
setMenuSiteAberto(false);

if (pagina === "home") {
  window.location.href = "/";
  return;
}

if (pagina === "contato") {
  window.location.href = "/contato";
  return;
}

if (pagina === "servicos") {
  window.location.href = "/servicos";
  return;
}

alert(
  "Esta área de edição será criada na próxima etapa."
);

}

function alternarAgenda(id: number) {
setAgendaExpandida((atual) =>
atual === id ? null : id
);
}

if (loading) {
return (
<div className="min-h-screen bg-transparent px-4 py-10 sm:px-6">
<div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
<div className="w-full rounded-3xl border border-pink-100 bg-white/95 p-10 text-center shadow-xl">
<div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-pink-50">
<img src="/logo-daiane.png" alt="Dra. Daiane" className="h-full w-full object-contain p-1" />
</div>

        <p className="mt-5 text-lg font-semibold text-slate-800">
          Carregando painel...
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
return (
<div className="min-h-screen bg-transparent px-4 py-10 sm:px-6">
<div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
<div className="w-full max-w-xl rounded-3xl border border-pink-100 bg-white/95 p-8 text-center shadow-xl sm:p-10">
<div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-pink-50 shadow-sm">
<img src="/logo-daiane.png" alt="Logo Dra. Daiane Damasceno" className="h-full w-full object-contain p-2" />
</div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-pink-500">
          Área administrativa
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          Painel da Dra.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
          Entre com a conta Google autorizada para acessar a
          agenda e as ferramentas administrativas.
        </p>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  </div>
);

}

const totalAgendamentos = agendamentos.length;

const pendentes = agendamentos.filter(
(item) =>
!item.atendimento_status ||
item.atendimento_status === "aguardando"
).length;

const pagamentosAprovados = agendamentos.filter(
(item) => item.payment_status === "approved"
).length;

const atendimentosRealizados = agendamentos.filter(
(item) =>
item.atendimento_status === "finalizado" ||
item.atendimento_status === "concluido"
).length;

return (
<div className="min-h-screen bg-transparent text-slate-900">
<div className="min-h-screen">
{/* SIDEBAR FIXA */}

    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-pink-100 bg-white/95 shadow-lg backdrop-blur-sm lg:flex">
      <div className="flex h-full w-full flex-col">
        {/* LOGO */}

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

        {/* MENU */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400">
            Principal
          </p>

          <div className="space-y-1">
            <a
              href="/admin"
              className="flex w-full items-center gap-3 rounded-xl bg-pink-100 px-4 py-3 text-sm font-semibold text-pink-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs shadow-sm">
                ⌂
              </span>

              <span>Início</span>
            </a>

            <a
              href="#agenda"
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
          </div>

          <p className="px-3 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400">
            Site
          </p>

          <div>
            <button
              type="button"
              onClick={() =>
                setMenuSiteAberto((aberto) => !aberto)
              }
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-pink-50 hover:text-pink-700"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-xs">
                  ◉
                </span>

                <span>Gerenciar site</span>
              </span>

              <span
                className={`text-xs transition ${
                  menuSiteAberto ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {menuSiteAberto && (
              <div className="mt-1 ml-3 space-y-1 border-l border-pink-100 pl-3">
                <button
                  type="button"
                  onClick={() => abrirPaginaSite("home")}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-pink-50 hover:text-pink-700"
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={() => abrirPaginaSite("sobre")}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-pink-50 hover:text-pink-700"
                >
                  Sobre
                </button>

                <button
                  type="button"
                  onClick={() => abrirPaginaSite("servicos")}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-pink-50 hover:text-pink-700"
                >
                  Serviços
                </button>

                <button
                  type="button"
                  onClick={() => abrirPaginaSite("contato")}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-pink-50 hover:text-pink-700"
                >
                  Contato
                </button>

                <button
                  type="button"
                  onClick={() =>
                    abrirPaginaSite("identidade")
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-pink-50 hover:text-pink-700"
                >
                  Identidade da Dra.
                </button>
              </div>
            )}
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

        {/* RODAPÉ */}

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

    {/* MENU MOBILE */}

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
              Painel administrativo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMenuSiteAberto((aberto) => !aberto)
          }
          className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700"
        >
          Menu
        </button>
      </div>

      {menuSiteAberto && (
        <nav className="border-t border-pink-100 px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/admin"
              className="rounded-xl bg-pink-100 px-3 py-2.5 text-center text-sm font-semibold text-pink-700"
            >
              Início
            </a>

            <a
              href="#agenda"
              className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-sm font-medium text-slate-600"
            >
              Agenda
            </a>

            <a
              href="/admin/pacientes"
              className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-sm font-medium text-slate-600"
            >
              Pacientes
            </a>

            <a
              href="/admin/pacientes"
              className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-sm font-medium text-slate-600"
            >
              Prontuários
            </a>

            <button
              type="button"
              onClick={() => abrirPaginaSite("home")}
              className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600"
            >
              Site
            </button>

            <button
              type="button"
              onClick={() =>
                alert(
                  "A área de configurações será criada na próxima etapa."
                )
              }
              className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600"
            >
              Configurações
            </button>
          </div>
        </nav>
      )}
    </div>

    {/* CONTEÚDO */}

    <main className="min-w-0 lg:ml-64">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* CABEÇALHO */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
              Visão geral
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Olá, Dra. Daiane
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Aqui está o resumo do seu painel administrativo.
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white/95 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
              Acesso atual
            </p>

            <p className="mt-1 max-w-[260px] truncate text-sm font-semibold text-slate-700">
              {email}
            </p>
          </div>
        </header>

        {/* ERRO */}

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {/* RESUMO */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-pink-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Agendamentos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalAgendamentos}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Registros no sistema
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Pendentes
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendentes}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Aguardando atendimento
            </p>
          </div>

          <div className="rounded-3xl border border-green-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Pagamentos
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {pagamentosAprovados}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Pagamentos aprovados
            </p>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
              Finalizados
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {atendimentosRealizados}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Atendimentos concluídos
            </p>
          </div>
        </section>

        {/* AGENDA */}

        <section
          id="agenda"
          className="mt-6 overflow-hidden rounded-3xl border border-pink-100 bg-white/95 shadow-sm"
        >
          <div className="border-b border-pink-100 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
                  Agenda
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Agendamentos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consulte os horários e inicie os atendimentos.
                </p>
              </div>

              <span className="w-fit rounded-xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-600">
                {totalAgendamentos} registro(s)
              </span>
            </div>
          </div>

          {agendamentos.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-7">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-xl text-pink-500">
                ▣
              </div>

              <p className="mt-3 font-semibold text-slate-700">
                Nenhum agendamento encontrado
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Quando houver novos agendamentos, eles
                aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agendamentos.map((item) => {
                const expandido =
                  agendaExpandida === item.id;

                const pagamentoAprovado =
                  item.payment_status === "approved";

                return (
                  <div
                    key={item.id}
                    className="transition hover:bg-pink-50/30"
                  >
                    {/* LINHA PRINCIPAL */}

                    <div className="grid gap-4 px-4 py-4 sm:grid-cols-[auto_minmax(180px,1.5fr)_120px_minmax(130px,1fr)_auto] sm:items-center sm:px-6">
                      {/* EXPANDIR */}

                      <button
                        type="button"
                        onClick={() =>
                          alternarAgenda(item.id)
                        }
                        aria-label={
                          expandido
                            ? "Ocultar detalhes"
                            : "Mostrar detalhes"
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-100 bg-white text-pink-500 shadow-sm transition hover:bg-pink-50"
                      >
                        <span
                          className={`text-xs transition ${
                            expandido
                              ? "rotate-90"
                              : ""
                          }`}
                        >
                          ▶
                        </span>
                      </button>

                      {/* PACIENTE */}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {item.nome}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.servico}
                        </p>
                      </div>

                      {/* DATA/HORÁRIO */}

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          {item.data}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {item.horario}
                        </p>
                      </div>

                      {/* STATUS */}

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            pagamentoAprovado
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.payment_status ||
                            "pendente"}
                        </span>

                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {item.atendimento_status ||
                            "aguardando"}
                        </span>
                      </div>

                      {/* AÇÕES */}

                      <div className="flex items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            iniciarAtendimento(item.id)
                          }
                          className="whitespace-nowrap rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700"
                        >
                          Iniciar atendimento
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cancelarAgendamento(item.id)
                          }
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {/* DETALHES EXPANDIDOS */}

                    {expandido && (
                      <div className="border-t border-pink-100 bg-pink-50/40 px-4 py-4 sm:px-6">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-2xl border border-pink-100 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                              E-mail
                            </p>

                            <p className="mt-1 break-all text-sm text-slate-700">
                              {item.email}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-pink-100 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                              Telefone
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {item.telefone}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-pink-100 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                              Pagamento
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {item.payment_status ||
                                "pendente"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-pink-100 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                              Atendimento
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {item.atendimento_status ||
                                "aguardando"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ÁREAS DO PAINEL */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
              Acesso rápido
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Áreas do painel
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <a
              href="/admin/pacientes"
              className="group rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                ♙
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Pacientes
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Consulte pacientes cadastrados e acesse
                suas informações.
              </p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-pink-600 transition group-hover:gap-3">
                Acessar pacientes
                <span>→</span>
              </span>
            </a>

            <div className="rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl">
                ▤
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Prontuários
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Histórico clínico, registros e informações
                dos atendimentos.
              </p>

              <a
                href="/admin/pacientes"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-pink-600"
              >
                Acessar
                <span>→</span>
              </a>
            </div>

            <div className="rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-2xl">
                ◉
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Site
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Gerencie as páginas e, futuramente, edite o
                conteúdo público diretamente pelo painel.
              </p>

              <button
                type="button"
                onClick={() =>
                  setMenuSiteAberto((aberto) => !aberto)
                }
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-pink-600"
              >
                Abrir opções
                <span>→</span>
              </button>
            </div>
          </div>
        </section>

        {/* PRIVACIDADE */}

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
                Este painel contém informações potencialmente
                sensíveis de pacientes. Mantenha o acesso
                restrito ao ambiente autorizado e não
                compartilhe informações clínicas fora do
                sistema.
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
</div>
);
}


