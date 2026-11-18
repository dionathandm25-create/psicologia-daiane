"use client";

import Link from "next/link";
import PatientAppointmentCard from "../_components/PatientAppointmentCard";
import PatientPageHeader from "../_components/PatientPageHeader";
import { separateAppointments } from "../_components/appointments";
import usePatientPortalData from "../_components/usePatientPortalData";

export default function ConsultasPacientePage() {
  const { agendamentos, carregandoAgendamentos, erroAgendamentos } =
    usePatientPortalData({ includeProfile: false });
  const { proximas } = separateAppointments(agendamentos);

  return (
    <main className="space-y-6">
      <PatientPageHeader
        section="Agenda"
        title="Minhas consultas"
        description="Acompanhe os horários futuros e o estado atual dos atendimentos."
      />

      {carregandoAgendamentos ? (
        <div role="status" className="rounded-3xl bg-white/85 p-6 text-sm text-[#71545a]">
          Carregando suas consultas...
        </div>
      ) : erroAgendamentos ? (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {erroAgendamentos}
        </div>
      ) : proximas.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[#d9bd8f] bg-white/75 p-7 text-center sm:p-9">
          <h2 className="text-lg font-bold text-[#572936]">
            Você não tem consultas futuras
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81736d]">
            Quando houver uma consulta agendada, os detalhes aparecerão aqui.
          </p>
          <Link
            href="/agendar"
            className="brand-action mt-5 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 font-semibold"
          >
            Agendar consulta
          </Link>
        </section>
      ) : (
        <div className="brand-card-grid grid gap-4">
          {proximas.map((agendamento) => (
            <PatientAppointmentCard key={agendamento.id} agendamento={agendamento} />
          ))}
        </div>
      )}
    </main>
  );
}
