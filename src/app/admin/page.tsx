"use client";

import Link from "next/link";
import useAdminAgendamentos from "./_components/useAdminAgendamentos";

export default function AdminPage() {
  const { agendamentos, carregando, erro, carregarAgendamentos } =
    useAdminAgendamentos();

  const pendentes = agendamentos.filter(
    (item) =>
      !item.atendimento_status ||
      item.atendimento_status === "aguardando"
  ).length;
  const pagamentosAprovados = agendamentos.filter(
    (item) => item.payment_status === "approved"
  ).length;
  const atendimentosRealizados = agendamentos.filter((item) =>
    ["finalizado", "concluido", "concluído"].includes(
      item.atendimento_status?.toLowerCase() || ""
    )
  ).length;

  return (
    <main className="space-y-7 text-slate-900">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
            Painel administrativo
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
            Visão geral
          </h1>
          <p className="mt-2 text-sm text-[#71545a]">
            Resumo baseado nos agendamentos registrados no sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void carregarAgendamentos()}
          disabled={carregando}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#eadfd8] bg-white px-4 py-2 text-sm font-semibold text-[#6a2638] shadow-sm transition hover:bg-[#f8eeeb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? "Atualizando..." : "Atualizar dados"}
        </button>
      </header>

      {erro && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <section
          role="status"
          className="rounded-3xl border border-[#eadfd8] bg-white/90 p-8 text-sm text-[#71545a] shadow-sm"
        >
          Carregando dados do painel...
        </section>
      ) : !erro ? (
        <>
          <section aria-label="Indicadores dos registros existentes" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Agendamentos"
              value={agendamentos.length}
              detail="Registros no sistema"
            />
            <SummaryCard
              label="Pendentes"
              value={pendentes}
              detail="Aguardando atendimento"
              tone="amber"
            />
            <SummaryCard
              label="Pagamentos aprovados"
              value={pagamentosAprovados}
              detail="Conforme status registrado"
              tone="green"
            />
            <SummaryCard
              label="Atendimentos finalizados"
              value={atendimentosRealizados}
              detail="Conforme status registrado"
              tone="plum"
            />
          </section>

          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
                Navegação
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#572936]">
                Áreas do painel
              </h2>
            </div>
            <div className="brand-card-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  href: "/admin/agenda",
                  title: "Agenda",
                  description: "Consulte os próximos horários registrados.",
                },
                {
                  href: "/admin/consultas",
                  title: "Consultas",
                  description: "Consulte e gerencie os agendamentos existentes.",
                },
                {
                  href: "/admin/pacientes",
                  title: "Pacientes",
                  description: "Consulte os pacientes e acesse prontuários.",
                },
                {
                  href: "/admin/atendimentos",
                  title: "Atendimentos",
                  description: "Acesse atendimentos com status registrado.",
                },
                {
                  href: "/admin/financeiro",
                  title: "Financeiro",
                  description: "Consulte os dados financeiros existentes.",
                },
                {
                  href: "/servicos",
                  title: "Site público",
                  description: "Abrir as informações públicas da clínica.",
                },
              ].map((area) => (
                <Link
                  key={area.href}
                  href={area.href}
                  className="brand-card group rounded-3xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
                >
                  <h3 className="text-lg font-bold text-[#572936]">
                    {area.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#81736d]">
                    {area.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#6a2638]">
                    Acessar <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-900">Privacidade e segurança</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Este painel contém informações potencialmente sensíveis de
              pacientes. Mantenha o acesso restrito ao ambiente autorizado.
            </p>
          </aside>
        </>
      ) : (
        <p className="rounded-3xl border border-[#eadfd8] bg-white/90 p-6 text-sm text-[#71545a]">
          Os indicadores não estão disponíveis enquanto os dados não puderem ser carregados.
        </p>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "rose",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "rose" | "amber" | "green" | "plum";
}) {
  const valueColors = {
    rose: "text-[#640219]",
    amber: "text-amber-700",
    green: "text-emerald-700",
    plum: "text-purple-700",
  };

  return (
    <article className="brand-card rounded-3xl p-5">
      <p className="text-sm font-medium text-[#71545a]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueColors[tone]}`}>{value}</p>
      <p className="mt-2 text-xs text-[#81736d]">{detail}</p>
    </article>
  );
}
