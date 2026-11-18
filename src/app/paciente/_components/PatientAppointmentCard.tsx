import type { Agendamento } from "./usePatientPortalData";
import {
  formatarData,
  formatarStatusAtendimento,
  formatarStatusPagamento,
} from "./appointments";

export default function PatientAppointmentCard({
  agendamento,
}: {
  agendamento: Agendamento;
}) {
  return (
    <article className="brand-card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a36e56]">
            Consulta
          </p>
          <h2 className="mt-2 break-words text-lg font-bold leading-snug text-[#4c2630]">
            {agendamento.servico}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#eadfd8] bg-[#faf7f4] px-3 py-1.5 text-xs font-semibold text-[#71545a]">
              {formatarStatusPagamento(agendamento.payment_status)}
            </span>
            <span className="rounded-full border border-[#eadfd8] bg-[#faf7f4] px-3 py-1.5 text-xs font-semibold text-[#71545a]">
              {formatarStatusAtendimento(agendamento.atendimento_status)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#f0e2d3] bg-[#fcf8f2] px-4 py-3 sm:min-w-40">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-[#9a6c38] shadow-sm"
          >
            ◷
          </span>
          <div>
            <p className="text-xs font-medium text-[#81736d]">
              {formatarData(agendamento.data)}
            </p>
            <p className="mt-0.5 font-bold text-[#5b3038]">
              {agendamento.horario?.slice(0, 5) || "Horário não informado"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
