"use client";

import Link from "next/link";
import { useState } from "react";
import type { Agendamento } from "./useAdminAgendamentos";

export default function AdminAppointmentList({
  agendamentos,
  onCancel,
}: {
  agendamentos: Agendamento[];
  onCancel?: (agendamento: Agendamento) => void;
}) {
  const [expandido, setExpandido] = useState<number | null>(null);

  if (agendamentos.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#d9bd8f] bg-white/75 p-8 text-center">
        <p className="font-semibold text-[#572936]">
          Nenhum agendamento encontrado
        </p>
        <p className="mt-2 text-sm text-[#81736d]">
          Os registros disponíveis aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#f0e2d3] overflow-hidden rounded-3xl border border-[#eadfd8] bg-white/95 shadow-sm">
      {agendamentos.map((item) => {
        const aberto = expandido === item.id;

        return (
          <article key={item.id} className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(130px,0.7fr)_minmax(130px,0.8fr)_auto] sm:items-center">
              <div className="min-w-0">
                <h2 className="break-words font-bold text-[#572936]">
                  {item.nome || "Nome não informado"}
                </h2>
                <p className="mt-1 break-words text-sm text-[#81736d]">
                  {item.servico}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#81736d]">{item.data}</p>
                <p className="mt-1 font-bold text-[#572936]">{item.horario}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={item.payment_status || "Pagamento pendente"}
                  tone={item.payment_status === "approved" ? "green" : "amber"}
                />
                <StatusBadge
                  label={item.atendimento_status || "aguardando"}
                  tone="neutral"
                />
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  href={`/atendimento/${item.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#6a2638] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#57202f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6c38]"
                >
                  Abrir atendimento
                </Link>
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(item)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  aria-expanded={aberto}
                  onClick={() => setExpandido(aberto ? null : item.id)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#eadfd8] bg-white px-3 py-2 text-xs font-semibold text-[#71545a] transition hover:bg-[#faf7f4]"
                >
                  {aberto ? "Ocultar" : "Detalhes"}
                </button>
              </div>
            </div>

            {aberto && (
              <div className="mt-4 grid gap-3 border-t border-[#f0e2d3] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="E-mail" value={item.email || "Não informado"} />
                <Detail label="Telefone" value={item.telefone || "Não informado"} />
                <Detail
                  label="Pagamento"
                  value={item.payment_status || "Pendente"}
                />
                <Detail
                  label="Atendimento"
                  value={item.atendimento_status || "Aguardando"}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "neutral";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    neutral: "bg-[#f3eeeb] text-[#71545a]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[tone]}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a6c38]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-[#71545a]">{value}</p>
    </div>
  );
}
