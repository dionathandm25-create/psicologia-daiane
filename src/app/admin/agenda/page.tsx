"use client";

import Link from "next/link";
import useAdminAgendamentos from "../_components/useAdminAgendamentos";

function dataLocalAtual() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

export default function AgendaAdminPage() {
  const { agendamentos, carregando, erro } = useAdminAgendamentos();
  const hoje = dataLocalAtual();
  const proximos = agendamentos.filter((item) =>
    /^\d{4}-\d{2}-\d{2}$/.test(item.data?.slice(0, 10) || "") &&
    item.data.slice(0, 10) >= hoje
  );
  const porData = new Map<string, typeof proximos>();

  for (const agendamento of proximos) {
    const data = agendamento.data.slice(0, 10);
    const registros = porData.get(data) || [];
    registros.push(agendamento);
    porData.set(data, registros);
  }

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
          Agenda profissional
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
          Agenda
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#71545a]">
          Horários futuros agrupados por data, a partir dos agendamentos existentes.
        </p>
      </header>

      {erro && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <div role="status" className="rounded-3xl bg-white/90 p-6 text-sm text-[#71545a]">
          Carregando agenda...
        </div>
      ) : erro ? null : porData.size === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9bd8f] bg-white/75 p-7 text-center">
          <p className="font-semibold text-[#572936]">
            Não há horários futuros registrados
          </p>
          <p className="mt-2 text-sm text-[#81736d]">
            A agenda será exibida quando existirem agendamentos nesta base.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {[...porData.entries()].map(([data, registros]) => (
            <section
              key={data}
              aria-labelledby={`agenda-${data}`}
              className="overflow-hidden rounded-3xl border border-[#eadfd8] bg-white/95 shadow-sm"
            >
              <div className="border-b border-[#eadfd8] bg-[#fffaf6] px-5 py-4">
                <h2 id={`agenda-${data}`} className="font-bold text-[#572936]">
                  {formatarData(data)}
                </h2>
                <p className="mt-1 text-xs text-[#81736d]">
                  {registros.length} horário(s) registrado(s)
                </p>
              </div>
              <div className="divide-y divide-[#f0e2d3]">
                {registros.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#572936]">
                        {item.horario} · {item.nome || "Nome não informado"}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#81736d]">
                        {item.servico}
                      </p>
                    </div>
                    <Link
                      href={`/atendimento/${item.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#eadfd8] bg-white px-4 py-2 text-sm font-semibold text-[#6a2638] hover:bg-[#f8eeeb]"
                    >
                      Abrir atendimento
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
