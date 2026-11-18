"use client";

import PatientPageHeader from "../_components/PatientPageHeader";
import {
  formatarData,
  formatarStatusPagamento,
  getAppointmentDateTime,
} from "../_components/appointments";
import usePatientPortalData from "../_components/usePatientPortalData";

export default function PagamentosPacientePage() {
  const { agendamentos, carregandoAgendamentos, erroAgendamentos } =
    usePatientPortalData({ includeProfile: false });
  const pagamentos = [...agendamentos].sort(
    (a, b) =>
      (getAppointmentDateTime(b)?.getTime() ?? 0) -
      (getAppointmentDateTime(a)?.getTime() ?? 0)
  );

  return (
    <main className="space-y-6">
      <PatientPageHeader
        section="Consultas e pagamentos"
        title="Pagamentos"
        description="Esta página exibe o estado de pagamento associado às suas consultas. Não há comprovantes ou operações financeiras disponíveis nesta área."
      />

      {carregandoAgendamentos ? (
        <div role="status" className="rounded-3xl bg-white/85 p-6 text-sm text-[#71545a]">
          Carregando dados...
        </div>
      ) : erroAgendamentos ? (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {erroAgendamentos}
        </div>
      ) : pagamentos.length === 0 ? (
        <div className="rounded-3xl border border-[#eadfd8] bg-white/75 p-6 text-sm leading-6 text-[#81736d]">
          Não há consultas com informações de pagamento para exibir.
        </div>
      ) : (
        <div className="space-y-3">
          {pagamentos.map((item) => (
            <article
              key={item.id}
              className="brand-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-bold text-[#572936]">{item.servico}</h2>
                <p className="mt-1 text-sm text-[#81736d]">
                  {formatarData(item.data)} · {item.horario?.slice(0, 5)}
                </p>
              </div>
              <span className="w-fit rounded-full border border-[#eadfd8] bg-[#faf7f4] px-3 py-1.5 text-xs font-semibold text-[#71545a]">
                {formatarStatusPagamento(item.payment_status)}
              </span>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
