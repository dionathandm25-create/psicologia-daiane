"use client";

import Link from "next/link";
import useAdminAgendamentos from "../_components/useAdminAgendamentos";

const STATUS_ATENDIMENTO = new Set([
  "em_andamento",
  "em andamento",
  "finalizado",
  "concluido",
  "concluído",
]);

export default function AtendimentosAdminPage() {
  const { agendamentos, carregando, erro } = useAdminAgendamentos();
  const atendimentos = agendamentos.filter((item) =>
    STATUS_ATENDIMENTO.has(item.atendimento_status?.toLowerCase() || "")
  );

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
          Registros clínicos
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
          Atendimentos
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#71545a]">
          Lista baseada em agendamentos que possuem status de atendimento registrado.
        </p>
      </header>

      {erro && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <div role="status" className="rounded-3xl bg-white/90 p-6 text-sm text-[#71545a]">
          Carregando atendimentos...
        </div>
      ) : erro ? null : atendimentos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9bd8f] bg-white/75 p-7 text-center">
          <p className="font-semibold text-[#572936]">
            Nenhum atendimento com status registrado
          </p>
          <p className="mt-2 text-sm text-[#81736d]">
            Não há atendimentos em andamento ou finalizados para exibir.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#f0e2d3] overflow-hidden rounded-3xl border border-[#eadfd8] bg-white/95 shadow-sm">
          {atendimentos.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h2 className="break-words font-bold text-[#572936]">
                  {item.nome || "Nome não informado"}
                </h2>
                <p className="mt-1 text-sm text-[#81736d]">
                  {item.servico} · {item.data} · {item.horario}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-[#f3eeeb] px-3 py-1 text-xs font-semibold text-[#71545a]">
                  {item.atendimento_status}
                </span>
              </div>
              <Link
                href={`/atendimento/${item.id}`}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-[#6a2638] px-4 py-2 text-sm font-semibold text-white hover:bg-[#57202f]"
              >
                Abrir atendimento
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
