"use client";

import PatientAppointmentCard from "../_components/PatientAppointmentCard";
import PatientPageHeader from "../_components/PatientPageHeader";
import { separateAppointments } from "../_components/appointments";
import usePatientPortalData from "../_components/usePatientPortalData";

export default function HistoricoPacientePage() {
  const { agendamentos, carregandoAgendamentos, erroAgendamentos } =
    usePatientPortalData({ includeProfile: false });
  const { historico } = separateAppointments(agendamentos);

  return (
    <main className="space-y-6">
      <PatientPageHeader
        section="Consultas anteriores"
        title="Histórico"
        description="Registros de consultas anteriores ou já encerradas, conforme os dados disponíveis."
      />

      {carregandoAgendamentos ? (
        <div role="status" className="rounded-3xl bg-white/85 p-6 text-sm text-[#71545a]">
          Carregando histórico...
        </div>
      ) : erroAgendamentos ? (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {erroAgendamentos}
        </div>
      ) : historico.length === 0 ? (
        <div className="rounded-3xl border border-[#eadfd8] bg-white/75 p-6 text-sm leading-6 text-[#81736d]">
          Seu histórico aparecerá aqui após a conclusão ou encerramento de uma consulta.
        </div>
      ) : (
        <div className="brand-card-grid grid gap-4">
          {historico.map((agendamento) => (
            <PatientAppointmentCard key={agendamento.id} agendamento={agendamento} />
          ))}
        </div>
      )}
    </main>
  );
}
